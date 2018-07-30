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
export function addNearbyBeacon(beacon) {
  return { type: ADD_BEACON, beacon: beacon };
}

export const REMOVE_OLD_BEACONS = 'REMOVE_OLD_BEACONS';
export function removeOldBeacons() {
  return { type: REMOVE_OLD_BEACONS };
}