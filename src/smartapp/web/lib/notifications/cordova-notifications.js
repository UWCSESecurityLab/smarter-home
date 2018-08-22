import { store } from '../../redux/reducers';
import Notifications from './notifications';
import * as Actions from '../../redux/actions';
import * as DeviceType from '../capabilities/DeviceType';
import * as Flags from '../../../flags';

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
      store.dispatch(Actions.updateNotificationsEnabled(false));
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
}

function showNearbyDevices() {
  const state = store.getState();
  if (state.flags.nearbyNotifications == Flags.NearbyNotifications.OFF) {
    return;
  }

  const nearbyBeacons = Object.values(state.nearbyBeacons).map((beacon) => beacon.identifier);
  const nearbyRooms = Object.values(state.devices.rooms).filter((room) =>
    room.devices.filter((device) =>
      nearbyBeacons.includes(device)).length > 0);
  const nearbyDevices = nearbyRooms
    .map((room) =>
      room.devices.filter((device) => !nearbyBeacons.includes(device)))
    .reduce((accumulator, current) => accumulator.concat(current), []);

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

let activeBeaconState = {};
function updateBeaconMonitoring() {
  const newState = store.getState().devices.activeBeaconRegions;
  if (!newState) {
    return;  // If localStorage doesn't exist and returns undefined
  }
  const oldNames = Object.keys(activeBeaconState);
  const newNames = Object.keys(newState);
  let removed = [];
  let added = [];

  oldNames.forEach((oldName) => {
    if (!newNames.includes(oldName)) {
      removed.push(oldName);
    }
  });
  newNames.forEach((newName) => {
    if (!oldNames.includes(newName)) {
      added.push(newName);
    }
  });

  removed.forEach((removedBeacon) => {
    let beacon = activeBeaconState[removedBeacon];
    let region = new cordova.plugins.locationManager.BeaconRegion(
      beacon.name,
      beacon.uuid,
      beacon.major,
      beacon.minor
    );
    cordova.plugins.locationManager.stopMonitoringForRegion(region)
      .then(() => {
        console.log('No longer monitoring beacon:');
        console.log(beacon);
      })
      .catch(console.error);
  });

  added.forEach((addedBeacon) => {
    let beacon = newState[addedBeacon];
    let region = new cordova.plugins.locationManager.BeaconRegion(
      beacon.name,
      beacon.uuid,
      beacon.major,
      beacon.minor
    );
    cordova.plugins.locationManager.startMonitoringForRegion(region)
      .then(() => {
        console.log('Starting to monitor beacon:');
        console.log(beacon);
      })
      .catch(console.error);
  });
  activeBeaconState = newState;
}
store.subscribe(updateBeaconMonitoring);

function initializeBeaconMonitoring() {
  // Initialize beacon scanning code here:
  let delegate = new cordova.plugins.locationManager.Delegate();
  delegate.didDetermineStateForRegion = (result) => {
    switch (result.state) {
      case 'CLRegionStateInside': {
        console.log(result.region.identifier + ' is nearby');
        store.dispatch(Actions.addNearbyBeacon(result.region));
        showNearbyDevices();
        break;
      }
      case 'CLRegionStateOutside': {
        console.log(result.region.identifier + ' is no longer nearby');
        store.dispatch(Actions.removeNearbyBeacon(result.region));
        break;
      }
    }
  }
  delegate.didStartMonitoringForRegion = (result) => {
    console.log('didStartMonitoringForRegion: ' + result.region.identifier);
  }
  delegate.didRangeBeaconsInRegion = (result) => {
    // console.log('didRangeBeaconsInRegion');
    // console.log(result);
  }

  cordova.plugins.locationManager.setDelegate(delegate);
  cordova.plugins.locationManager.requestAlwaysAuthorization();
}

function initializeFirebaseMessaging() {
  cordova.plugins.firebase.messaging.onTokenRefresh(function() {
    console.log("Device token updated");
    CordovaNotifications.updateToken().catch(console.error);
  });
  cordova.plugins.firebase.messaging.onMessage((payload) => {
    let message = JSON.parse(payload.smartapp);
    Notifications.onMessage(message)
  });
  cordova.plugins.firebase.messaging.onBackgroundMessage(
      CordovaNotifications.onBackgroundMessage);
  CordovaNotifications.updateToken().catch(console.error);
}

document.addEventListener('deviceready', () => {
  initializeFirebaseMessaging();
  initializeBeaconMonitoring();
});

document.addEventListener('pause', () => {
  let flags = store.getState().flags;
  // If background scanning is off, stop monitoring for all beacon regions.
  if (flags.backgroundScanning === Flags.BackgroundScanning.OFF) {
    store.dispatch(Actions.removeAllBeaconRegions());
  } else if (flags.nearbyNotifications === Flags.NearbyNotifications.ON) {
    showNearbyDevices();
  }
}, false);

// Cancel notifications when the app is reopened
document.addEventListener('resume', () => {
  cordova.plugins.notification.local.cancelAll(() => {
    console.log('cancelled all notifications');
  });
});


export default CordovaNotifications;