export const UPDATE_FCM_TOKEN = 'UPDATE_FCM_TOKEN';
export const UPDATE_NOTIFICATIONS_ENABLED = 'UPDATE_NOTIFICATIONS_ENABLED';
export const UPDATE_NOTIFICATION_DATA = 'UPDATE_NOTIFICATION_DATA';

export function updateFcmToken(fcmToken) {
  return { type: UPDATE_FCM_TOKEN, fcmToken: fcmToken };
}

export function updateNotificationData(data) {
  return { type: UPDATE_NOTIFICATION_DATA, data: data}
}

export function updateNotificationsEnabled(enabled) {
  return { type: UPDATE_NOTIFICATIONS_ENABLED, enabled: enabled };
}
