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

const fcmReducers = combineReducers({
  fcmToken: fcmToken,
  notificationsEnabled: notificationsEnabled,
  notificationData: notificationData
});

const store = createStore(combineReducers({
  fcm: fcmReducers,
  devices: combineReducers({
    deviceDescs: CommonReducers.deviceDescs,
    deviceStatus: CommonReducers.deviceStatus
  })
}));

export { store };
