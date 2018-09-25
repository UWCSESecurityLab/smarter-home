import HomeState from '../home-state';
import myHistory from '../../lib/history';
import Notifications from './notifications';
import { store } from '../../redux/reducers';
import * as Actions from '../../redux/actions';
import * as DeviceType from '../capabilities/DeviceType';
import * as Flags from '../../../flags';
import * as Proximity from '../proximity';

const PROXIMITY_ID = 0;
const DIARY_REMINDER_ID = 1;
const NEARBY_SUMMARY_ID = 2;
const ASK_REQUEST_ID = 3;
const NEARBY_GROUP_ID_OFFSET = 4;

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
    console.log('enableNotifications called');
    cordova.plugins.firebase.messaging.requestPermission().then((token) => {
      console.log('Plugin successfully requested permissions');
      store.dispatch(Actions.updateNotificationsEnabled(true));
    }).catch((err) => {
      console.error(err);
      store.dispatch(Actions.updateNotificationsEnabled(false));
    });
  }

  // Handles FCM data notifications.
  static onBackgroundMessage(payload) {
    console.log('Background message');
    console.log(payload);
    const state = store.getState();
    const nearby = state.beacons.nearbyBeacons;
    console.log('Currently nearby beacons:');
    console.log(nearby);

    if (payload.activity) {
      const message = JSON.parse(payload.activity);
      const title = `${message.device} | ${message.capability} → ${message.value}`;

      if (Proximity.userIsNearDevice(message.deviceId)) {
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
    if (payload.ask) {
      const message = JSON.parse(payload.ask);
      if (!Notifications.shouldAskUser(message)) {
        return;
      }

      let actionText;
      if (message.capability === 'switch') {
        actionText = `turn ${message.command}`
      } else if (message.capability === 'lock') {
        actionText = message.command;
      }
      cordova.plugins.notification.local.schedule({
        id: ASK_REQUEST_ID,
        title: `${message.requester} wants to ${actionText} ${message.device}`,
        text: 'Tap here to allow or deny'
      });
    }
  }
}

function showNearbyDevices() {
  const state = store.getState();
  if (state.flags.nearbyNotifications == Flags.NearbyNotifications.OFF) {
    return;
  }

  const nearbyBeacons = Object.values(state.beacons.nearbyBeacons).map((beacon) => beacon.identifier);
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
  const newState = store.getState().beacons.activeBeaconRegions;
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
  console.log('initializeBeaconMonitoring called');
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
    if (payload.aps) {
      Notifications.onMessage(payload.data);
    } else {
      Notifications.onMessage(payload);
    }
  });
  cordova.plugins.firebase.messaging.onBackgroundMessage(
      CordovaNotifications.onBackgroundMessage);
  CordovaNotifications.updateToken().catch(console.error);
}

function scheduleNextDiaryNotification() {
  let now = new Date();
  let nextDiary = localStorage.getItem('nextDiary');
  if (!nextDiary) {
    // Set the first notification to 8:00PM tomorrow
    let tomorrowEvening = new Date();
    tomorrowEvening.setSeconds(0);
    tomorrowEvening.setMinutes(0);
    tomorrowEvening.setHours(20);
    tomorrowEvening.setDate(now.getDate() + 1);

    cordova.plugins.notification.local.schedule({
      id: DIARY_REMINDER_ID,
      title: "Anything interesting happen lately?",
      text: "Let us know! For science!",
      trigger: { at: tomorrowEvening }
    });
    console.log('Scheduled diary notification for ' + tomorrowEvening);
    localStorage.setItem('nextDiary', JSON.stringify(tomorrowEvening));
    return;
  }

  let nextDiaryDate = new Date(JSON.parse(nextDiary));
  if (now >= nextDiaryDate) {
    // Schedule another in two days
    let twoEveningsFromNow = new Date();
    twoEveningsFromNow.setSeconds(0);
    twoEveningsFromNow.setMinutes(0);
    twoEveningsFromNow.setHours(20);
    twoEveningsFromNow.setDate(now.getDate() + 2);

    cordova.plugins.notification.local.schedule({
      id: DIARY_REMINDER_ID,
      title: "Anything interesting happen lately?",
      text: "Let us know! For science!",
      trigger: { at: twoEveningsFromNow }
    });
    console.log('Scheduled diary notification for ' + twoEveningsFromNow);
    localStorage.setItem('nextDiary', JSON.stringify(twoEveningsFromNow));
    return;
  }
}

document.addEventListener('deviceready', () => {
  initializeFirebaseMessaging();
  initializeBeaconMonitoring();
  scheduleNextDiaryNotification();

  cordova.plugins.notification.local.on('click', (notification) => {
    if (notification.id === DIARY_REMINDER_ID) {
      myHistory.push('/feedback?diary');
    }
  });
  cordova.plugins.notification.local.on('trigger', (notification) => {
    if (notification.id === DIARY_REMINDER_ID) {
      scheduleNextDiaryNotification();
    }
  });
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
  cordova.plugins.notification.local.cancelAll();
  HomeState.resetDevices();
});

export default CordovaNotifications;