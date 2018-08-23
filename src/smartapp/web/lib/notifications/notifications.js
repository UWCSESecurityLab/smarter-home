import { store } from '../../redux/reducers';
import {
  updateFcmToken,
  updateNotificationsEnabled,
  updateNotificationData
} from '../../redux/actions';
import { CommonActions, SmartAppClient } from 'common';

let smartAppClient = new SmartAppClient();

class Notifications {
  static onMessage(message) {
    console.log('Foreground notification');
    console.log(message)
    store.dispatch(updateNotificationData(message));
    smartAppClient.getDeviceStatus(message.deviceId)
      .then((newStatus) => {
        store.dispatch(
          CommonActions.updateDeviceStatus(newStatus.deviceId, newStatus.status));
      });
    }
  static updateToken(currentToken) {
    if (!currentToken) {
      // TODO: check cordova behavior
      // If getToken doesn't return a token, we don't have the notification
      // permission.
      store.dispatch(updateNotificationsEnabled(false));
      store.dispatch(updateFcmToken(null));
      throw 'Need to request permissions';
    }
    store.dispatch(updateNotificationsEnabled(true));
    return smartAppClient.updateNotificationToken(
      currentToken,
      store.getState().flags
    ).then(() => {
      store.dispatch(updateFcmToken(currentToken));
    });
  }
}

export default Notifications;