export const UPDATE_FCM_TOKEN = 'UPDATE_FCM_TOKEN';
export function updateFcmToken(fcmToken) {
  return { type: UPDATE_FCM_TOKEN, fcmToken: fcmToken };
}

export const UPDATE_NOTIFICATIONS_ENABLED = 'UPDATE_NOTIFICATIONS_ENABLED';
export function updateNotificationData(data) {
  return { type: UPDATE_NOTIFICATION_DATA, data: data}
}

export const UPDATE_NOTIFICATION_DATA = 'UPDATE_NOTIFICATION_DATA';
export function updateNotificationsEnabled(enabled) {
  return { type: UPDATE_NOTIFICATIONS_ENABLED, enabled: enabled };
}

export const ADD_BEACON = 'ADD_BEACON';
export function addNearbyBeacon(region) {
  return { type: ADD_BEACON, region: region };
}

export const REMOVE_BEACON = 'REMOVE_BEACON';
export function removeNearbyBeacon(region) {
  return { type: REMOVE_BEACON, region: region };
}

export const REMOVE_OLD_BEACONS = 'REMOVE_OLD_BEACONS';
export function removeOldBeacons() {
  return { type: REMOVE_OLD_BEACONS };
}

export const LOGIN = 'LOGIN';
export function login() {
  return { type: LOGIN };
}

export const LOGOUT = 'LOGOUT';
export function logout() {
  return { type: LOGOUT };
}

export const SET_USERS = 'SET_USERS';
export function setUsers(users) {
  return { type: SET_USERS, users: users };
}

export const SET_ALL_FLAGS = 'SET_ALL_FLAGS';
export function setAllFlags(flags) {
  return { type: SET_ALL_FLAGS, flags: flags };
}

export const SET_FLAG = 'SET_FLAG';
export function setFlag(flag) {
  return { type: SET_FLAG, flag: flag };
}
