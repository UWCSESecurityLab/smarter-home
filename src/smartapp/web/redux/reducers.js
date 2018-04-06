import { combineReducers, createStore } from 'redux';
import {
  UPDATE_FCM_TOKEN,
  UPDATE_NOTIFICATIONS_ENABLED,
  UPDATE_NOTIFICATION_DATA
} from './actions';

function fcmToken(state = '', action) {
  switch (action.type) {
    case UPDATE_FCM_TOKEN:
      return action.fcmToken;
    default:
      return state;
  }
}

function notificationsEnabled(state = false, action) {
  switch (action.type) {
    case UPDATE_NOTIFICATIONS_ENABLED:
      return action.enabled;
    default:
      return state;
  }
}

function notificationData(state = null, action) {
  switch (action.type) {
    case UPDATE_NOTIFICATION_DATA:
      return action.data;
    default:
      return state;
  }
}

const reducers = combineReducers({
  fcmToken: fcmToken,
  notificationsEnabled: notificationsEnabled,
  notificationData: notificationData
});

const store = createStore(reducers);

export { store };
export { reducers };
