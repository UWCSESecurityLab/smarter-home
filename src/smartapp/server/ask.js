const Command = require('./db/command');
const fcmClient = require('./fcmClient');
const InstallData = require('./db/installData');
const SmartThingsClient = require('./SmartThingsClient');
const PendingCommand = require('./db/pending-command');
const Permission = require('./db/permissions');
const uuid = require('uuid/v4');
const User = require('./db/user');
const { ApprovalType,
        ApprovalState,
        LocationRestrictions,
        ParentalRestrictions } = require('../permissions');

// "Ask" protocol implmentation.
class Ask {
  static async request({ requester, deviceId, command, capability, isNearby, isHome }) {
    const permission = await Permission.findOne({ deviceId: command.deviceId });
    if (!permission) {
      return { decision: ApprovalState.ALLOW };
    }

    let ownerApproval = ApprovalState.PENDING;
    if (permission.owners.includes(requester.id)) {
      ownerApproval = ApprovalState.ALLOW;
    } else if (permission.parentalRestrictions === ParentalRestrictions.DENY) {
      return {
        decision: ApprovalState.DENY,
        owner: ApprovalState.DENY
      };
    }

    let nearbyApproval = ApprovalState.PENDING;
    if (permission.locationRestrictions === LocationRestrictions.ANYWHERE) {
      nearbyApproval = ApprovalState.ALLOW;
    } else if (
      permission.locationRestrictions === LocationRestrictions.NEARBY &&
        isNearby) {
      nearbyApproval = ApprovalState.ALLOW;
    } else if (
      permission.locationRestrictions === LocationRestrictions.AT_HOME &&
        isHome
    ) {
      nearbyApproval = ApprovalState.ALLOW;
    }

    if (nearbyApproval === ApprovalState.ALLOW &&
        ownerApproval == ApprovalState.ALLOW) {
      return {
        decision: ApprovalState.ALLOW,
        owner: ApprovalState.ALLOW,
        nearby: ApprovalState.ALLOW
      };
    }

    const commandId = uuid();

    let pendingCommand = new PendingCommand({
      id: commandId,
      date: new Date(),
      nearbyApproval: nearbyApproval,
      ownerApproval: ownerApproval,
      decided: false,
      deviceId: deviceId,
      capability: capability,
      command: command,
      installedAppId: requester.installedAppId,
      requesterId: requester.id,
      owners: permission.owners,
    });

    await pendingCommand.save();

    this.sendAskNotifications({
      capability: capability,
      command: command,
      deviceId: deviceId,
      requester: requester,
      owners: ownerApproval == ApprovalState.ALLOW ? [] : permission.owners
    });

    setTimeout(async () => {
      let command = await PendingCommand.findOne({ id: commandId });
      if (!command || command.decided) {
        return;
      }
      if (ownerApproval === ApprovalState.PENDING) {
        command.ownerApproval = ApprovalState.DENY;
      }
      if (nearbyApproval === ApprovalState.PENDING) {
        command.nearbyApproval = ApprovalState.TIMEOUT;
      }
      this.decide(command);
    }, 60000);

    return {
      decision: ApprovalState.PENDING,
      nearby: nearbyApproval,
      owner: ownerApproval
    };
  }

  /**
   * Handles the response to a device permissions request.
   * @param {String} params.commandId
   * @param {ApprovalType} params.approvalType
   * @param {ApprovalState} params.approvalState
   */
  static async response({ commandId, approvalType, approvalState }) {
    let command = await PendingCommand.findOne({id: commandId});
    // Exit early if the command has already been decided, or doesn't exist
    if (!command || command.decided) {
      return;
    }
    // Validate input
    if (!Object.values(ApprovalState).includes(approvalState)) {
      return;
    }
    if (!Object.values(ApprovalType).includes(approvalType)) {
      return;
    }

    // Exit early if someone has already responded for this approval type.
    if (command[approvalType] === ApprovalState.PENDING) {
      return;
    }

    command[approvalType] = approvalState;

    // Decide if both permissions have been set
    if (command.ownerApproval !== ApprovalState.PENDING &&
        command.nearbyApproval !== ApprovalState.PENDING) {
      return this.decide(command);
    } else {
      // Otherwise save response
      return command.save();
    }
  }

  /**
   * Decides the outcome of a pending command, and notifies the requester.
   * Called when input has been provided by both an owner and nearby person.
   * @param {mongoose.Document} pendingCommand
   *        The pending command to decide on. Warning! This PendingCommand has
   *        has not yet been saved!
   */
  static decide(pendingCommand) {
    let decision;
    // Determine the final decision on the request.
    if (pendingCommand.ownerApproval === ApprovalState.DENY ||
        pendingCommand.nearbyApproval === ApprovalState.DENY) {
      decision = ApprovalState.DENY;
    } else if (pendingCommand.nearbyApproval === ApprovalState.TIMEOUT) {
      decision =  ApprovalState.PROMPT;
    } else {
      decision = ApprovalState.ALLOW;
    }
    pendingCommand.decided = true;
    // Save the decided command to prevent further changes
    return pendingCommand.save().then((decided) => {
      // Notify requester that the request was fulfilled
      User.findOne({ id: decided.requesterId }).then((requester) => {
        requester.permissionsFcmTokens.forEach((token) => {
          fcmClient.sendAskDecisionNotification({
            decision: decision,
            ownerApproval: decided.ownerApproval,
            nearbyApproval: decided.nearbyApproval
          }, token);
        });
      });

      if (decision == ApprovalState.ALLOW) {
        // Execute the command
        InstallData.findOne({
          'installedApp.installedAppId': decided.installedAppId
        }).then(({ authToken }) => {
          return this.execute({
            installedAppId: decided.installedAppId,
            authToken: authToken,
            userId: decided.requesterId,
            deviceId: decided.deviceId,
            component: 'main',
            capability: decided.capability,
            command: decided.command
          });
        });
      }
    });
  }

  /**
   * Executes a command on a device.
   */
  static async execute({installedAppId, authToken, userId, deviceId, component, capability, command}) {
    let cmd = new Command({
      // Round milliseconds to zero because SmartThings doesn't store milliseconds
      // in eventDate, so commands happening in the same second as the event
      // would appear to happen after the event.
      date: new Date().setMilliseconds(0),
      installedAppId: installedAppId,
      userId: userId,
      deviceId: deviceId,
      component: component,
      capability: capability,
      command: command
    });

    return cmd.save().then(() => {
      return SmartThingsClient.executeDeviceCommand({
        deviceId: deviceId,
        command: {
          component: component,
          capability: capability,
          command: command
        },
        authToken: authToken
      });
    })
  }

  static getPendingCommands(user) {
    return PendingCommand.find({
      installedAppId: user.installedAppId,
      $ne: { requesterId: user.id }
    });
  }

  /**
   * Broadcasts a notification asking for permission to everyone in the home
   * via FCM.,
   * @param {*} param0
   */
  static async sendAskNotifications({ capability, command, deviceId, requester, owners }) {
    let [users, installData] = await Promise.all([
      User.find({
        installedAppId: requester.installedAppId,
        id: { $ne: requester.id }
      }),
      InstallData.find({ installedAppId: requester.installedAppId })
    ]);

    let deviceDesc = await SmartThingsClient.getDeviceDescription({
      deviceId: deviceId,
      authToken: installData.authToken
    });

    let data = {
      requester: requester.displayName,
      capability: capability,
      command: command,
      device: deviceDesc.label
    };

    await users.map((user) => {
      let approvalType = {
        approvalType: owners.includes(user.id)
          ? ApprovalType.OWNERS
          : ApprovalType.NEARBY }
      let payload = Object.assign({}, data, approvalType)
      fcmClient.sendAskNotification(payload, user.permissionsFcmTokens);
    });
  }
}

module.exports = Ask;