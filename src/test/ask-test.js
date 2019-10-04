const chai = require('chai');
const should = chai.should();
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const sinon = require('sinon');

const ask = require('../server/ask');
const fcmClient = require('../server/fcmClient');
const InstallData = require('../server/db/installData');
const PendingCommand = require('../server/db/pending-command');
const Permission = require('../server/db/permissions');
const User = require('../server/db/user');
const {
  ApprovalState,
  ApprovalType,
  LocationRestrictions,
  ParentalRestrictions
} = require('../permissions');


describe('Ask', () => {
  afterEach(() => {
    sinon.restore();
  });
  describe('request()', () => {
    it('should deny a request if the requester is not an owner and the parental policy is DENY', async () => {
      sinon.stub(Permission, 'findOne').resolves({
        deviceId: 'my-device',
        installedAppId: 'my-installedApp',
        locationRestrictions: LocationRestrictions.ANYWHERE,
        parentalRestrictions: ParentalRestrictions.DENY,
        owners: ['not-requester']
      });

      let request = ask.request({
        requester: { id: 'requester' },
        deviceId: 'my-device',
      });
      await request.should.eventually.have.property('decision', ApprovalState.DENY);
      await request.should.eventually.have.property('owner', ApprovalState.DENY);
    });

    it('should allow a request if the device can be actuated anywhere and the requester is an owner', async () => {
      sinon.stub(Permission, 'findOne').resolves({
        deviceId: 'my-device',
        installedAppId: 'my-installedApp',
        locationRestrictions: LocationRestrictions.ANYWHERE,
        parentalRestrictions: ParentalRestrictions.DENY,
        owners: ['requester']
      });
      let request = ask.request({
        requester: { id: 'requester' },
        deviceId: 'my-device',
      });
      await request.should.eventually.have.property('decision', ApprovalState.ALLOW);
    });

    it('should allow a request if the device is only actuatable nearby, and the requester is nearby and is an owner', async () => {
      sinon.stub(Permission, 'findOne').resolves({
        deviceId: 'my-device',
        installedAppId: 'my-installedApp',
        locationRestrictions: LocationRestrictions.NEARBY,
        parentalRestrictions: ParentalRestrictions.DENY,
        owners: ['requester']
      });
      let request = ask.request({
        requester: { id: 'requester' },
        deviceId: 'my-device',
        isNearby: true
      });
      await request.should.eventually.have.property('decision', ApprovalState.ALLOW);
    });

    it('should allow a request if the device is only actuatable at home, and the requester is at home and is an owner', async () => {
      sinon.stub(Permission, 'findOne').resolves({
        deviceId: 'my-device',
        installedAppId: 'my-installedApp',
        locationRestrictions: LocationRestrictions.AT_HOME,
        parentalRestrictions: ParentalRestrictions.DENY,
        owners: ['requester']
      });
      let request = ask.request({
        requester: { id: 'requester' },
        deviceId: 'my-device',
        isHome: true
      });
      await request.should.eventually.have.property('decision', ApprovalState.ALLOW);
    });

    it('should decide the pending command after it times out', async () => {
      let clock = sinon.useFakeTimers();
      sinon.stub(PendingCommand.prototype, 'save')
      sinon.stub(ask, 'sendAskNotifications');
      let decideFake = sinon.fake();
      sinon.replace(ask, 'decide', decideFake);

      sinon.stub(Permission, 'findOne').resolves({
        deviceId: 'my-device',
        installedAppId: 'my-installedApp',
        locationRestrictions: LocationRestrictions.NEARBY,
        parentalRestrictions: ParentalRestrictions.ALWAYS_ASK,
        owners: ['requester']
      });

      sinon.stub(PendingCommand, 'findOne').resolves({
        decision: ApprovalState.PENDING,
        ownerApproval: ApprovalState.PENDING,
        nearbyApproval: ApprovalState.PENDING
      });

      let request = ask.request({
        requester: { id: 'requester' },
        deviceId: 'my-device',
      });
      request.should.eventually.have.property('decision', ApprovalState.PENDING);
      clock.runAll();
      setTimeout(() => {
        decideFake.callCount.should.equal(1);
        done();
      }, 10);
      clock.restore();
    });

    it('should not decide pending commands on timeout if it was already decided', async() => {
      let clock = sinon.useFakeTimers();
      sinon.stub(PendingCommand.prototype, 'save')
      sinon.stub(ask, 'sendAskNotifications');

      let decideFake = sinon.fake();
      sinon.replace(ask, 'decide', decideFake);

      sinon.stub(Permission, 'findOne').resolves({
        deviceId: 'my-device',
        installedAppId: 'my-installedApp',
        locationRestrictions: LocationRestrictions.NEARBY,
        parentalRestrictions: ParentalRestrictions.ALWAYS_ASK,
        owners: ['requester']
      });

      sinon.stub(PendingCommand, 'findOne').resolves({
        decision: ApprovalState.ALLOW,
        ownerApproval: ApprovalState.ALLOW,
        nearbyApproval: ApprovalState.ALLOW
      });

      let request = ask.request({
        requester: { id: 'requester' },
        deviceId: 'my-device',
      });
      request.should.eventually.have.property('decision', ApprovalState.PENDING);
      clock.runAll();
      clock.restore();
      setTimeout(() => {
        decideFake.callCount.should.equal(0);
        done();
      }, 10);
    });
  });

  describe('response()', () => {
    it('should early exit if the command has been decided', async () => {
      let saveFake = sinon.fake();
      let decideFake = sinon.fake();
      sinon.replace(ask, 'decide', decideFake);

      let pending = {
        decision: ApprovalState.DENY,
        id: 'my-command',
        ownerApproval: ApprovalState.ALLOW,
        nearbyApproval: ApprovalState.DENY,
        save: saveFake
      };
      sinon.stub(PendingCommand, 'findOne').resolves();

      await ask.response({
        commandId: 'my-command',
        approvalType: ApprovalType.NEARBY,
        approvalState: ApprovalState.ALLOW,
      });

      pending.nearbyApproval.should.equal(ApprovalState.DENY);
      decideFake.callCount.should.equal(0);
      saveFake.callCount.should.equal(0);
    });

    it('should early exit if another person has already handled the same approval', async () => {
      let saveFake = sinon.fake();
      let decideFake = sinon.fake();
      sinon.replace(ask, 'decide', decideFake);

      let pending = {
        decision: ApprovalState.PENDING,
        id: 'my-command',
        ownerApproval: ApprovalState.PENDING,
        nearbyApproval: ApprovalState.DENY,
        save: saveFake
      }

      sinon.stub(PendingCommand, 'findOne').resolves(pending);

      await ask.response({
        commandId: 'my-command',
        approvalType: ApprovalType.NEARBY,
        approvalState: ApprovalState.ALLOW,
      });

      pending.nearbyApproval.should.equal(ApprovalState.DENY);
      decideFake.callCount.should.equal(0);
      saveFake.callCount.should.equal(0);
    });

    it('should change a pending approval and save the object, if both approvals are pending', async () => {
      let saveStub = sinon.stub();
      let decideFake = sinon.fake();
      sinon.replace(ask, 'decide', decideFake);

      let pending = {
        decision: ApprovalState.PENDING,
        id: 'my-command',
        ownerApproval: ApprovalState.PENDING,
        nearbyApproval: ApprovalState.PENDING,
        save: saveStub
      };
      saveStub.resolves(pending);
      sinon.stub(PendingCommand, 'findOne').resolves(pending);

      await ask.response({
        commandId: 'my-command',
        approvalType: ApprovalType.NEARBY,
        approvalState: ApprovalState.ALLOW,
      });

      pending.decision.should.equal(ApprovalState.PENDING);
      pending.ownerApproval.should.equal(ApprovalState.PENDING);
      pending.nearbyApproval.should.equal(ApprovalState.ALLOW);
      decideFake.callCount.should.equal(0);
      // saveFake.callCount.should.equal(1);
    });

    it('should call decide() if it changes a pending approval to allow/deny, and both are no longer pending', async () => {
      let saveFake = sinon.fake();
      let decideFake = sinon.fake();
      sinon.replace(ask, 'decide', decideFake);

      let pending = {
        decision: ApprovalState.PENDING,
        id: 'my-command',
        ownerApproval: ApprovalState.PENDING,
        nearbyApproval: ApprovalState.ALLOW,
        save: saveFake
      };
      sinon.stub(PendingCommand, 'findOne').resolves(pending);

      await ask.response({
        commandId: 'my-command',
        approvalType: ApprovalType.OWNERS,
        approvalState: ApprovalState.ALLOW,
      });

      pending.ownerApproval.should.equal(ApprovalState.ALLOW);
      decideFake.callCount.should.equal(1);
      saveFake.callCount.should.equal(0);
    });
  });
  describe('decide()', () => {
    it('should send notifications and deny if one of the approvals is deny', async () => {
      sinon.stub(User, 'findOne').resolves({
        permissionsFcmTokens: ['token1', 'token2']
      });
      sinon.stub(InstallData, 'findOne').resolves({
        authToken: 'authToken'
      });

      let fakeSendAskDecisionNotification = sinon.fake();
      sinon.replace(fcmClient, 'sendAskDecisionNotification', fakeSendAskDecisionNotification);

      let fakeExecute = sinon.fake();
      sinon.replace(ask, 'execute', fakeExecute);

      let pending = {
        ownerApproval: ApprovalState.DENY,
        nearbyApproval: ApprovalState.ALLOW,
        requesterId: 'requester',
      };
      pending.save = sinon.stub().resolves(pending);

      await ask.decide(pending);

      fakeSendAskDecisionNotification.calledWith(sinon.match({
        decision: ApprovalState.DENY,
        ownerApproval: ApprovalState.DENY,
        nearbyApproval: ApprovalState.ALLOW
      }));
      fakeExecute.notCalled.should.be.true;

      let pending2 = {
        ownerApproval: ApprovalState.ALLOW,
        nearbyApproval: ApprovalState.DENY,
        requesterId: 'requester',
      };
      pending2.save = sinon.stub().resolves(pending)

      await ask.decide(pending2);

      fakeSendAskDecisionNotification.calledWith(sinon.match({
        decision: ApprovalState.DENY,
        ownerApproval: ApprovalState.ALLOW,
        nearbyApproval: ApprovalState.DENY
      }));
      fakeExecute.notCalled.should.be.true;
    });
    it('should send notifications and execute if both approvals are allow', async () => {
      sinon.stub(User, 'findOne').resolves({
        permissionsFcmTokens: ['token1', 'token2']
      });
      sinon.stub(InstallData, 'findOne').resolves({
        authToken: 'authToken'
      });

      let fakeSendAskDecisionNotification = sinon.fake();
      sinon.replace(fcmClient, 'sendAskDecisionNotification', fakeSendAskDecisionNotification);

      let fakeExecute = sinon.fake();
      sinon.replace(ask, 'execute', fakeExecute);

      let pending = {
        ownerApproval: ApprovalState.ALLOW,
        nearbyApproval: ApprovalState.ALLOW,
        requesterId: 'requester',
      };
      pending.save = sinon.stub().resolves(pending);

      await ask.decide(pending);

      fakeSendAskDecisionNotification.calledWith(sinon.match({
        decision: ApprovalState.ALLOW,
        ownerApproval: ApprovalState.ALLOW,
        nearbyApproval: ApprovalState.ALLOW
      }));
      fakeExecute.calledOnce.should.be.true;
    });

    it('should send a prompt notification and not execute if nearby timed out', async () => {
      sinon.stub(User, 'findOne').resolves({
        permissionsFcmTokens: ['token1', 'token2']
      });
      sinon.stub(InstallData, 'findOne').resolves({
        authToken: 'authToken'
      });

      let fakeSendAskDecisionNotification = sinon.fake();
      sinon.replace(fcmClient, 'sendAskDecisionNotification', fakeSendAskDecisionNotification);

      let fakeExecute = sinon.fake();
      sinon.replace(ask, 'execute', fakeExecute);

      let pending = {
        ownerApproval: ApprovalState.ALLOW,
        nearbyApproval: ApprovalState.TIMEOUT,
        requesterId: 'requester',
      };
      pending.save = sinon.stub().resolves(pending);

      await ask.decide(pending);

      fakeSendAskDecisionNotification.calledWith(sinon.match({
        decision: ApprovalState.PROMPT,
        ownerApproval: ApprovalState.ALLOW,
        nearbyApproval: ApprovalState.TIMEOUT
      }));
      fakeExecute.notCalled.should.be.true;
    });
  });
});