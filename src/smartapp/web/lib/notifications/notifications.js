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
  static async updateToken(currentToken) {
    try {
      if (!currentToken) {
        // TODO: check cordova behavior
        // If getToken doesn't return a token, we don't have the notification
        // permission.
        store.dispatch(updateNotificationsEnabled(false));
        store.dispatch(updateFcmToken(null));
        throw 'Need to request permissions';
      }
      store.dispatch(updateNotificationsEnabled(true));
      let response = await smartAppClient.updateNotificationToken(currentToken, store.getState().flags);
      if (response.status !== 200) {
        let err = await response.text();
        throw err;
      } else {
        store.dispatch(updateFcmToken(currentToken));
      }
    } catch (e) {
      throw e;
    }
  }
}

export default Notifications;