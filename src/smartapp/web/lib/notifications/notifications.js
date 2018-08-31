import SmartAppClient from '../SmartAppClient';
import { store } from '../../redux/reducers';
import * as Actions from '../../redux/actions';

let smartAppClient = new SmartAppClient();

class Notifications {
  static onMessage(message) {
    console.log('Foreground notification');
    console.log(message)
    store.dispatch(Actions.updateNotificationData(message));
    smartAppClient.getDeviceStatus(message.deviceId)
      .then((newStatus) => {
        store.dispatch(
          Actions.updateDeviceStatus(newStatus.deviceId, newStatus.status));
      });
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
}

export default Notifications;