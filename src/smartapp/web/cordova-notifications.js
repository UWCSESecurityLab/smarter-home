import { store } from './redux/reducers';
import {
  updateNotificationsEnabled,
  updateNotificationData
} from './redux/actions';
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
    cordova.plugins.firebase.messaging.onMessage(super.onMessage);
    this.updateToken().catch(console.error);

    // cordova.plugins.firebase.messaging.requestPermission().then(function(token) {
    //   console.log("APNS device token: ", token);
    // });
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
}

export default new CordovaNotifications();