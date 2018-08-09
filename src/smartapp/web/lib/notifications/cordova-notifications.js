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

    const nearby = store.getState().nearbyBeacons;
    console.log('Currently nearby beacons:');
    console.log(nearby);

    const message = JSON.parse(payload.smartapp);
    const title = `${message.device} | ${message.capability} → ${message.value}`;

    // Proximity-based filtering: only show a notification if the beacons
    // associated with the device's room are also sensed by the phone.
    if (message.beacons.filter((msgBcn) => Object.keys(nearby).includes(msgBcn))
          .length > 0) {
      console.log('Beacons nearby, showing notification');
      cordova.plugins.notification.local.schedule({
        title: title,
        text: 'Triggered by ' + message.trigger
      });
    } else {
      console.log('Beacons not nearby, blocking notification.')
    }
  }
}

export default new CordovaNotifications();