import { combineReducers, createStore } from 'redux';
import * as BeaconReducers from './beacon-reducers';
import * as DeviceReducers from './device-reducers';
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
    case Actions.UPDATE_USER_ROLE:
      return Object.assign({}, state, {
        [action.userId]: Object.assign({}, state[action.userId], { role: action.role })});
    default:
      return state;
  }
}
function me(state = '', action) {
  switch (action.type) {
    case Actions.SET_ME:
      return action.userId;
    default:
      return state;
  }
}

function permissionPrompts(state = [], action) {
  switch (action.type) {
    case Actions.ADD_LOCATION_PROMPT: {
      let newState = Array.from(state);
      newState.push({
        promptType: 'location',
        deviceId: action.deviceId,
        capability: action.capability,
        command: action.command,
        policy: action.policy
      });
      return newState;
    }
    case Actions.REMOVE_TOP_PROMPT: {
      let newState = Array.from(state);
      newState.shift();
      return newState;
    }
    default:
      return state;
  }
}

const defaultState = {
  activityNotifications: Flags.ActivityNotifications.OFF,
  nearbyNotifications: Flags.NearbyNotifications.OFF,
  backgroundScanning: Flags.BackgroundScanning.OFF
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

function pendingCommand(state = null, action) {
  switch (action.type) {
    case Actions.SET_PENDING_COMMAND:
      return action.pendingCommand;
    case Actions.CHANGE_APPROVAL:
      if (action.commandId === state.commandId) {
        return Object.assign({}, state, { [action.approvalType]: action.approvalState });
      } else {
        return state;
      }
    case Actions.CLEAR_PENDING_COMMAND:
      return null;
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
  beacons: combineReducers({
    nearbyBeacons: BeaconReducers.nearbyBeacons,
    activeBeaconRegions: BeaconReducers.activeBeaconRegions
  }),
  devices: combineReducers({
    deviceDesc: DeviceReducers.deviceDesc,
    deviceStatus: DeviceReducers.deviceStatus,
    homeConfig: DeviceReducers.homeConfig,
    permissions: DeviceReducers.permissions,
    rooms: DeviceReducers.rooms
  }),
  flags: flags,
  users: users,
  permissionPrompts: permissionPrompts,
  me: me,
  pendingCommand: pendingCommand,
}));

export { store };
