import { combineReducers, createStore } from 'redux';
import * as Actions from './actions';
import * as NavActions from './navigate-actions';
import { CommonReducers } from 'common';
import * as Views from '../views';

function view(state = Views.AUTH, action) {
  switch (action.type) {
    case NavActions.NAVIGATE:
      return action.view;
    default:
      return state;
  }
}

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
  view: view,
  fcm: fcmReducers,
  devices: combineReducers({
    deviceDesc: CommonReducers.deviceDesc,
    deviceStatus: CommonReducers.deviceStatus,
    homeConfig: CommonReducers.homeConfig,
    rooms: CommonReducers.rooms
  })
}));

export { store };
