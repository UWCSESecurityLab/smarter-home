import { store } from '../../redux/reducers';
import * as Actions from '../../redux/actions';
import Notifications from './notifications';
import * as DeviceType from '../capabilities/DeviceType';

const PROXIMITY_ID = 0;
const NEARBY_SUMMARY_ID = 1;
const NEARBY_GROUP_ID_OFFSET = 2;

class CordovaNotifications extends Notifications {
  static async updateToken() {
    try {
      let currentToken = await cordova.plugins.firebase.messaging.getToken();
      super.updateToken(currentToken);
    } catch(e) {
      throw e;
    }
  }

  static enableNotifications() {
    cordova.plugins.firebase.messaging.requestPermission().then((token) => {
      console.log("APNS device token: ", token);
      store.dispatch(Actions.updateNotificationsEnabled(true));
    }).catch((err) => {
      console.error(err);
      store.dispatch(Actions.updateNotificationData(false));
    });
  }

  static onBackgroundMessage(payload) {
    console.log('Background message');
    console.log(payload);

    const nearby = store.getState().nearbyBeacons;
    console.log('Currently nearby beacons:');
    console.log(nearby);

    const message = JSON.parse(payload.activity);
    const title = `${message.device} | ${message.capability} → ${message.value}`;

    // Proximity-based filtering: only show a notification if the beacons
    // associated with the device's room are also sensed by the phone.
    if (message.beacons.filter((msgBcn) => Object.keys(nearby).includes(msgBcn))
          .length > 0) {
      console.log('Beacons nearby, showing notification');
      cordova.plugins.notification.local.schedule({
        id: PROXIMITY_ID,
        title: title,
        summary: 'Nearby activity',
        text: 'Triggered by ' + message.trigger
      });
    } else {
      console.log('Beacons not nearby, blocking notification.')
    }
  }

  static showNearbyDevices() {
    const state = store.getState();
    const nearbyBeacons = Object.values(state.nearbyBeacons).map((beacon) => beacon.identifier);
    const nearbyRooms = Object.values(state.devices.rooms).filter((room) =>
      room.devices.filter((device) =>
        nearbyBeacons.includes(device)).length > 0);
    const nearbyDevices = nearbyRooms
      .map((room) =>
        room.devices.filter((device) => !nearbyBeacons.includes(device)))
      .reduce((accumulator, current) => accumulator.concat(current));

    const group = {
      id: NEARBY_SUMMARY_ID,
      summary: 'Nearby Devices',
      group: 'nearby-devices',
      groupSummary: true,
      sound: false,
      vibrate: false,
      priority: -1,
      channel: 'silent-channel-id'
    }

    let nearbyNotifications = nearbyDevices.map((deviceId, index) => {
      const capability = DeviceType.getCapabilityHelper(state.devices.homeConfig, deviceId);
      if (!capability) {
        return null;
      }
      const label = capability.getLabel(state, deviceId);
      const status = capability.getStatus(state, deviceId);

      return {
        id: index + NEARBY_GROUP_ID_OFFSET,
        data: { deviceId: deviceId },
        group: 'nearby-devices',
        title: `${label} is ${status}`,
        actions: capability.getNotificationActions(),
        vibrate: false,
        sound: false,
        priority: -1,
        channel: 'silent-channel-id'
      };
    }).filter((n) => !!n);

    nearbyNotifications.unshift(group);
    console.log('About to send nearby notifications:');
    console.log(nearbyNotifications);
    cordova.plugins.notification.local.schedule(nearbyNotifications);
  }
}

document.addEventListener('deviceready', () => {
  console.log(cordova.plugins.notification.local.getDefaults());
  // Handle new tokens
  cordova.plugins.firebase.messaging.onTokenRefresh(function() {
    console.log("Device token updated");
    CordovaNotifications.updateToken().catch(console.error);
  });

  // Handle events from SmartThings
  cordova.plugins.firebase.messaging.onMessage((payload) => {
    let message = JSON.parse(payload.smartapp);
    Notifications.onMessage(message)
  });
  CordovaNotifications.updateToken().catch(console.error);
  cordova.plugins.firebase.messaging.onBackgroundMessage(CordovaNotifications.onBackgroundMessage);

  // Set up nearby device access
  document.addEventListener('pause', CordovaNotifications.showNearbyDevices, false);

  // Cancel notifications when the app is reopened
  document.addEventListener('resume', () => {
    cordova.plugins.notification.local.cancelAll(() => {
      console.log('cancelled all notifications');
    });
  });
});


export default CordovaNotifications;