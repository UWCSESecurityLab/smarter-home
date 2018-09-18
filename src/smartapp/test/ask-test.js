const chai = require('chai');
const should = chai.should();
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const sinon = require('sinon');

const ask = require('../server/ask');
const PendingCommand = require('../server/db/pending-command');
const Permission = require('../server/db/permissions');
const {
  ApprovalState,
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
        decided: false,
        ownerApproval: ApprovalState.PENDING,
        nearbyApproval: ApprovalState.PENDING
      });

      let request = ask.request({
        requester: { id: 'requester' },
        deviceId: 'my-device',
      });
      await request.should.eventually.have.property('decision', ApprovalState.PENDING);
      clock.runAll();
      clock.restore();
      setTimeout(() => {
        decideFake.callCount.should.equal(1);
        done();
      }, 5);
    });
  });
});