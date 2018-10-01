import SmartAppClient from '../SmartAppClient';
import { ApprovalType, LocationRestrictions } from '../../../permissions';
import { store } from '../../redux/reducers';
import * as Actions from '../../redux/actions';
import * as Proximity from '../proximity';
import HomeState from '../home-state';
import * as StateUpdate from '../../../state-update';

let smartAppClient = new SmartAppClient();

class Notifications {
  static onMessage(message) {
    console.log('Received foreground notification');
    console.log(message);
    if (message.activity) {
      this.onActivity(JSON.parse(message.activity));
    }
    if (message.ask) {
      this.onAsk(JSON.parse(message.ask));
    }
    if (message.askDecision) {
      this.onAskDecision(JSON.parse(message.askDecision));
    }
    if (message.update) {
      this.onUpdate(message.update);
    }
  }
  static updateToken(currentToken) {
    console.log(`updateToken('${currentToken}')`);
    if (!currentToken) {
      // TODO: check cordova behavior
      // If getToken doesn't return a token, we don't have the notification
      // permission.
      // store.dispatch(Actions.updateNotificationsEnabled(false));
      store.dispatch(Actions.updateFcmToken(null));
      throw 'Need to request permissions';
    }
    // store.dispatch(Actions.updateNotificationsEnabled(true));
    return smartAppClient.updateNotificationToken(
      currentToken,
      store.getState().flags
    ).then(() => {
      store.dispatch(Actions.updateFcmToken(currentToken));
    });
  }

  static onActivity(activity) {
    smartAppClient.getDeviceStatus(activity.deviceId).then((newStatus) => {
      store.dispatch(
        Actions.updateDeviceStatus(newStatus.deviceId, newStatus.status));
      store.dispatch(Actions.stopDeviceSpinner(newStatus.deviceId));
    });
  }

  static shouldAskUser(ask) {
    const state = store.getState();
    if (ask.requesterId === state.me) {
      return false;
    }
    // Only notify if the user qualifies to approve the request.
    const permissions = state.devices.permissions[ask.deviceId];
    const userNearby =
      permissions.locationRestrictions === LocationRestrictions.NEARBY &&
      Proximity.userIsNearDevice(ask.deviceId);
    const userAtHome =
      permissions.locationRestrictions === LocationRestrictions.AT_HOME &&
      Proximity.userIsHome();
    const userIsOwner = permissions.owners.includes(state.me);
    return userIsOwner || userAtHome || userNearby;
  }

  static onAsk(ask) {
    if (!this.shouldAskUser(ask)) {
      return;
    }
    HomeState.fetchPendingCommands();
  }

  static onAskDecision(askDecision) {
    const pendingCommand = store.getState().pendingCommand;
    if (!pendingCommand) {
      return;
    }
    if (pendingCommand.commandId === askDecision.id) {
      if (askDecision.nearbyApproval) {
        store.dispatch(Actions.changeApproval(askDecision.id, ApprovalType.NEARBY, askDecision.nearbyApproval));
      }
      if (askDecision.ownerApproval) {
        store.dispatch(Actions.changeApproval(askDecision.id, ApprovalType.OWNERS, askDecision.ownerApproval));
      }
      if (askDecision.decision) {
        store.dispatch(Actions.changeDecision(askDecision.id, askDecision.decision));
        store.dispatch(Actions.stopDeviceSpinner(askDecision.deviceId));
      }
    }
  }

  static onUpdate(type) {
    switch (type) {
      case StateUpdate.USERS:
        HomeState.fetchUsers();
        break;
      case StateUpdate.PERMISSIONS:
        HomeState.fetchAllDevicePermissions(store.getState().devices.rooms);
        break;
      case StateUpdate.ROOMS:
        HomeState.fetchRooms();
        break;
      case StateUpdate.DEVICES:
        HomeState.fetchRooms().then((rooms) => {
          return Promise.all([
            this.fetchAllDeviceDescriptions(rooms),
            this.fetchAllDeviceStatuses(rooms),
            this.fetchAllDevicePermissions(rooms)
          ]);
        });
        break;
    }
  }
}

export default Notifications;