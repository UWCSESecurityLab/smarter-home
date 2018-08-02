import { combineReducers, createStore } from 'redux';
import * as Actions from './actions';
import { CommonReducers } from 'common';

function fcmToken(state = '', action) {
  switch (action.type) {
    case Actions.UPDATE_FCM_TOKEN:
      return action.fcmToken;
    default:
      return state;
  }
}

function notificationsEnabled(state = false, action) {
  switch (action.type) {
    case Actions.UPDATE_NOTIFICATIONS_ENABLED:
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

function nearbyBeacons(state = {}, action) {
  switch (action.type) {
    case Actions.ADD_BEACON:
      return Object.assign({}, state, { [action.beacon.address]: action.beacon });
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

const fcmReducers = combineReducers({
  fcmToken: fcmToken,
  notificationsEnabled: notificationsEnabled,
  notificationData: notificationData
});

const store = createStore(combineReducers({
  authenticated: authenticated,
  fcm: fcmReducers,
  nearbyBeacons: nearbyBeacons,
  devices: combineReducers({
    deviceDesc: CommonReducers.deviceDesc,
    deviceStatus: CommonReducers.deviceStatus,
    homeConfig: CommonReducers.homeConfig,
    rooms: CommonReducers.rooms
  })
}));

export { store };
