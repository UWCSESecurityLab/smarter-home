import { store } from '../../redux/reducers';
import {
  updateNotificationsEnabled,
  updateNotificationData
} from '../../redux/actions';
import Notifications from './notifications';

class CordovaNotifications extends Notifications {
  constructor() {
    super();
    // Handle new tokens
    cordova.plugins.firebase.messaging.onTokenRefresh(function() {
      console.log("Device token updated");
      this.updateToken().catch(console.error);
    });
    // Handle notifications
    cordova.plugins.firebase.messaging.onMessage((payload) => {
      let message = JSON.parse(payload.smartapp);
      super.onMessage(message)
    });
    this.updateToken().catch(console.error);

    cordova.plugins.firebase.messaging.onBackgroundMessage(this.onBackgroundMessage);
  }
  async updateToken() {
    try {
      let currentToken = await cordova.plugins.firebase.messaging.getToken();
      super.updateToken(currentToken);
    } catch(e) {
      throw e;
    }
  }

  enableNotifications() {
    cordova.plugins.firebase.messaging.requestPermission().then((token) => {
      console.log("APNS device token: ", token);
      store.dispatch(updateNotificationsEnabled(true));
    }).catch((err) => {
      console.error(err);
      store.dispatch(updateNotificationData(false));
    });
  }

  onBackgroundMessage(payload) {
    console.log('Background message');
    console.log(payload);
    let message = JSON.parse(payload.smartapp);
    let title = `${message.device} | ${message.capability} -> ${message.value}`;
    let text = 'subtitle';

    cordova.plugins.notification.local.schedule({
      title: title,
      text: text
    });
  }
}

export default new CordovaNotifications();