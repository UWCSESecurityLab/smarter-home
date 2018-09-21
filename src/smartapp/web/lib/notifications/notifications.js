import SmartAppClient from '../SmartAppClient';
import { LocationRestrictions } from '../../../permissions';
import { store } from '../../redux/reducers';
import * as Actions from '../../redux/actions';
import * as Proximity from '../proximity';
import HomeState from '../home-state';

let smartAppClient = new SmartAppClient();

class Notifications {
  static onMessage(message) {
    console.log('Received foreground notification');
    console.log(message);
    store.dispatch(Actions.updateNotificationData(message));
    if (message.activity) {
      this.onActivity(JSON.parse(message.activity));
    }
    if (message.ask) {
      this.onAsk(JSON.parse(message.ask));
    }
  }
  static updateToken(currentToken) {
    if (!currentToken) {
      // TODO: check cordova behavior
      // If getToken doesn't return a token, we don't have the notification
      // permission.
      store.dispatch(Actions.updateNotificationsEnabled(false));
      store.dispatch(Actions.updateFcmToken(null));
      throw 'Need to request permissions';
    }
    store.dispatch(Actions.updateNotificationsEnabled(true));
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
    // Update pending command modal
    // Update device status
  }
}

export default Notifications;