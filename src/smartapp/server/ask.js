const fcmClient = require('./fcmClient');
const Permission = require('./db/permissions');
const uuid = require('uuid/v4');
const { LocationRestrictions, ParentalRestrictions } = require('../permissions');

const ApprovalType = {
  NEARBY: 'nearbyApproval',
  OWNERS: 'ownerApproval'
}

const ApprovalState = {
  PENDING: 'PENDING',
  ALLOW: 'ALLOW',
  DENY: 'DENY',
  TIMEOUT: 'TIMEOUT'
}

// "Ask" protocol implmentation.
class Ask {
  constructor() {
    this.requests = {};
  }

  async request({ requester, command, callback }) {
    const permission = await Permission.findOne({ deviceId: command.deviceId });
    if (!permission) {
      callback('allow');
      return;
    }

    let ownerApproval = ApprovalState.PENDING;
    if (permission.owners.includes(requester.id)) {
      ownerApproval = ApprovalState.ALLOW;
    } else if (permission.parentalRestrictions === ParentalRestrictions.DENY) {
      callback('deny');
      return;
    }

    let nearbyApproval = ApprovalState.PENDING;
    if (permission.locationRestrictions === LocationRestrictions.ANYWHERE) {
      nearbyApproval = ApprovalState.ALLOW;
    }

    if (nearbyApproval === ApprovalState.ALLOW &&
        ownerApproval == ApprovalState.ALLOW) {
      callback('allow');
      return;
    }

    const commandId = uuid();

    this.requests[commandId] = {
      command: command,
      requester: requester.id,
      ownerApproval: ownerApproval,
      nearbyApproval: nearbyApproval,
      decided: false,
      callback: callback
    };

    if (ownerApproval === ApprovalState.PENDING) {
      fcmClient.sendAskNotification(command, requester.id, permission.owners);
    }
    if (nearbyApproval === ApprovalState.PENDING) {
      fcmClient.sendAskNotification(command, requester.id);
    }

    setTimeout(() => {
      let request = this.requests[commandId];
      if (!request) {
        return;
      }
      if (ownerApproval === ApprovalState.PENDING) {
        request.ownerApproval = ApprovalState.DENY;
      }
      if (nearbyApproval === ApprovalState.PENDING) {
        request.nearbyApproval = ApprovalState.TIMEOUT;
      }
      this.decide(commandId);
    }, 20000);
  }

  response({ commandId, approvalType, approvalState }) {
    let request = this.requests[commandId];
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
      this.decide(commandId);
    }
  }

  decide(commandId) {
    let request = this.requests[commandId];
    delete this.requests[commandId];
    if (request.ownerApproval === ApprovalState.DENY ||
        request.nearbyApproval === ApprovalState.DENY) {
      request.callback('deny');
      return;
    }
    if (request.nearbyApproval === ApprovalState.TIMEOUT) {
      request.callback('prompt');
      return;
    }
    request.callback('allow');
  }
}

export default new Ask();