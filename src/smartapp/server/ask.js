const fcmClient = require('./fcmClient');
const InstallData = require('./db/installData');
const SmartThingsClient = require('./SmartThingsClient');
const Permission = require('./db/permissions');
const uuid = require('uuid/v4');
const User = require('./db/user');
const { ApprovalType,
        ApprovalState,
        LocationRestrictions,
        ParentalRestrictions } = require('../permissions');

// "Ask" protocol implmentation.
class Ask {
  constructor() {
    this.requests = {};
  }

  async request({ requester, deviceId, command, capability, isNearby, isHome, callback }) {
    const permission = await Permission.findOne({ deviceId: command.deviceId });
    if (!permission) {
      callback({ decision: ApprovalState.ALLOW });
      return;
    }

    let ownerApproval = ApprovalState.PENDING;
    if (permission.owners.includes(requester.id)) {
      ownerApproval = ApprovalState.ALLOW;
    } else if (permission.parentalRestrictions === ParentalRestrictions.DENY) {
      callback({
        decision: ApprovalState.DENY,
        owner: ApprovalState.DENY
      });
      return;
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
      callback({
        decision: ApprovalState.ALLOW,
        owner: ApprovalState.ALLOW,
        nearby: ApprovalState.ALLOW
      });
      return;
    }

    const requestId = uuid();

    this.requests[requestId] = {
      capability: capability,
      command: command,
      deviceId: deviceId,
      requester: requester.id,
      installedAppId: requester.installedAppId,
      owners: permission.owners,
      nearbyApproval: nearbyApproval,
      ownerApproval: ownerApproval,
      decided: false,
      callback: callback
    };

    if (ownerApproval === ApprovalState.PENDING) {
      this.sendNotifications({
        capability: capability,
        command: command,
        deviceId: deviceId,
        requester: requester,
        recipients: permission.owners
      });
    }
    if (nearbyApproval === ApprovalState.PENDING) {
      this.sendNotifications({
        capability: capability,
        command: command,
        deviceId: deviceId,
        requester: requester
      });
    }

    setTimeout(() => {
      let request = this.requests[requestId];
      if (!request) {
        return;
      }
      if (ownerApproval === ApprovalState.PENDING) {
        request.ownerApproval = ApprovalState.DENY;
      }
      if (nearbyApproval === ApprovalState.PENDING) {
        request.nearbyApproval = ApprovalState.TIMEOUT;
      }
      this.decide(requestId);
    }, 60000);
  }

  response({ requestId, approvalType, approvalState }) {
    let request = this.requests[requestId];
    if (!request) {
      return;
    }
    if (!Object.values(ApprovalState).includes(approvalState)) {
      return;
    }
    if (!Object.values(ApprovalType).includes(approvalType)) {
      return;
    }
    request[approvalType] = approvalState;

    if (request.ownerApproval !== ApprovalState.PENDING &&
        request.nearbyApproval !== ApprovalState.PENDING) {
      this.decide(requestId);
    }
  }

  decide(requestId) {
    let request = this.requests[requestId];
    delete this.requests[requestId];
    if (request.ownerApproval === ApprovalState.DENY ||
        request.nearbyApproval === ApprovalState.DENY) {
      request.callback({
        decision: ApprovalState.DENY,
        owner: request.ownerApproval,
        nearby: request.nearbyApproval
      });
      return;
    }
    if (request.nearbyApproval === ApprovalState.TIMEOUT) {
      request.callback({
        decision: ApprovalState.PROMPT,
        owner: request.ownerApproval,
        nearby: request.nearbyApproval
      });
      return;
    }
    request.callback({
      decision: ApprovalState.ALLOW,
      owner: request.ownerApproval,
      nearby: request.nearbyApproval
    });
  }

  getPendingRequests(user) {
    return Object.values(this.requests).filter((request) => {
      request.installedAppId = user.installedAppId
    });
  }

  async sendNotifications({ capability, command, deviceId, requester, recipients }) {
    let userQuery = recipients ? { $in: recipients } : { $ne: requester.id };

    let [users, installData] = await Promise.all([
      User.find({
        installedAppId: requester.installedAppId,
        id: userQuery
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
      fcmClient.sendAskNotification(data, user.permissionsFcmTokens);
    });
  }
}

export default new Ask();