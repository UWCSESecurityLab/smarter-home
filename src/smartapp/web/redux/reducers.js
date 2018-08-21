import { combineReducers, createStore } from 'redux';
import { CommonReducers } from 'common';
import * as Actions from './actions';
import * as Flags from '../../flags';

function fcmToken(state = '', action) {
  switch (action.type) {
    case Actions.UPDATE_FCM_TOKEN:
      return action.fcmToken;
    default:
      return state;
  }
}

function notificationsEnabled(state = JSON.parse(localStorage.getItem('notificationsEnabled')), action) {
  switch (action.type) {
    case Actions.UPDATE_NOTIFICATIONS_ENABLED:
      localStorage.setItem('notificationsEnabled', action.enabled);
      return action.enabled;
    default:
      return state;
  }
}

function notificationData(state = null, action) {
  switch (action.type) {
    case Actions.UPDATE_NOTIFICATION_DATA:
      return action.data;
    default:
      return state;
  }
}

function silenceNotificationPrompt(state = false, action) {
  switch (action.type) {
    case Actions.SILENCE_NOTIFICATION_PROMPT:
      return true;
    default:
      return state;
  }
}

function nearbyBeacons(state = {}, action) {
  switch (action.type) {
    case Actions.ADD_BEACON: {
      let res = Object.assign({}, state, { [action.region.identifier]: action.region });
      return res;
    }
    case Actions.REMOVE_BEACON: {
      let newState = Object.assign({}, state);
      delete newState[action.region.identifier];
      return newState;
    }
    case Actions.REMOVE_OLD_BEACONS: {
      let newState = Object.assign({}, state);
      let now = Date.now();
      for (let key in newState) {
        // Filter out beacons updated more than 30 seconds ago.
        let beacon = newState[key];
        if (beacon.timestamp + 5000 < now) {
          delete newState[key];
        }
      }
      return newState;
    }
    default:
      return state;
  }
}

function authenticated(state = JSON.parse(localStorage.getItem('authenticated')), action) {
  switch (action.type) {
    case Actions.LOGIN:
      localStorage.setItem('authenticated', true);
      return true;
    case Actions.LOGOUT:
      localStorage.setItem('authenticated', false);
      return false;
    default:
      return state;
  }
}

function users(state = {}, action) {
  switch (action.type) {
    case Actions.SET_USERS:
      return Object.assign({}, ...action.users.map((user) => { return { [user.id]: user }}));
    default:
      return state;
  }
}

const defaultState = {
  activityNotifications: Flags.ActivityNotifications.OFF,
  nearbyNotifications: Flags.NearbyNotifications.OFF
}

function flags(state = defaultState, action) {
  switch (action.type) {
    case Actions.SET_ALL_FLAGS:
      localStorage.setItem('flags', JSON.stringify(action.flags));
      return action.flags;
    case Actions.SET_FLAG: {
      // We only start persisting flags when a user sets something on their own.
      let newState = Object.assign({}, state, action.flag);
      localStorage.setItem('flags', JSON.stringify(newState));
      return newState;
    }
    default:
      return state;
  }
}

function activeBeaconRegions(state = JSON.parse(localStorage.getItem('beaconRegions')), action) {
  switch (action.type) {
    case Actions.ADD_BEACON_REGION: {
      const newState = Object.assign({}, state,
          { [action.beaconRegion.name]: action.beaconRegion });
      localStorage.setItem('beaconRegions', newState);
      return newState;
    }
    case Actions.REMOVE_BEACON_REGION: {
      const newState = Object.assign({}, state);
      delete newState[action.name];
      localStorage.setItem('beaconRegions', newState);
      return newState;
    }
    case Actions.REMOVE_ALL_BEACON_REGIONS: {
      localStorage.setItem('beaconRegions', {});
      return {};
    }
    default:
      return state;
  }
}

const fcmReducers = combineReducers({
  fcmToken: fcmToken,
  notificationsEnabled: notificationsEnabled,
  notificationData: notificationData,
  silenceNotificationPrompt: silenceNotificationPrompt
});

const store = createStore(combineReducers({
  authenticated: authenticated,
  fcm: fcmReducers,
  nearbyBeacons: nearbyBeacons,
  devices: combineReducers({
    activeBeaconRegions: activeBeaconRegions,
    deviceDesc: CommonReducers.deviceDesc,
    deviceStatus: CommonReducers.deviceStatus,
    homeConfig: CommonReducers.homeConfig,
    rooms: CommonReducers.rooms
  }),
  flags: flags,
  users: users
}));

export { store };
