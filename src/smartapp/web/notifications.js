import * as firebase from 'firebase/app';
import 'firebase/messaging';

import { store } from './redux/reducers';
import {
  updateFcmToken,
  updateNotificationsEnabled,
  updateNotificationData
} from './redux/actions';

import { CommonActions, SmartAppClient } from 'common';

// This script initializes Firebase when imported, handles incoming messages,
// and exposes helper functions for updating the Firebase tokens and enabling
// the notifications permission.
// The token, notification data, and permission status are all bound to the
// redux state.

let smartAppClient = new SmartAppClient();
// Initialize Firebase
const config = {
  apiKey: "AIzaSyCmhR4iGFbCSY3JO3UFPwjkZjd16JiNUO8",
  authDomain: "iot-stuff-8e265.firebaseapp.com",
  databaseURL: "https://iot-stuff-8e265.firebaseio.com",
  projectId: "iot-stuff-8e265",
  storageBucket: "iot-stuff-8e265.appspot.com",
  messagingSenderId: "469706959609"
};

firebase.initializeApp(config);

// Retrieve Firebase Messaging object.
const messaging = firebase.messaging();
// Add the public key generated from the console here.
messaging.usePublicVapidKey('BNrb6anNOhl4s8eiPTLHsLLtgftuu-WRc3CAYVJuqNhZ4pTqci_GWqr_Aq93_TZnm_mJKaDijOn9oLXsQUrBOow');

// Updates the FCM token (state.fcmToken).
// Retrieves a cached token if one exists, otherwise gets one from the FCM server.
export async function updateToken() {
  try {
    let currentToken = await messaging.getToken();
    if (!currentToken) {
      // If getToken doesn't return a token, we don't have the notification
      // permission.
      store.dispatch(updateNotificationsEnabled(false));
      store.dispatch(updateFcmToken(null));
      throw 'Need to request permissions';
    }
    store.dispatch(updateNotificationsEnabled(true));
    let response = await smartAppClient.updateNotificationToken(currentToken);
    if (response.status !== 200) {
      let err = await response.text();
      throw err;
    } else {
      store.dispatch(updateFcmToken(currentToken));
    }
  } catch(e) {
    throw e;
  }
}

// Requests permission to send browser notifications.
export function enableNotifications() {
  messaging.requestPermission().then(() => {
    store.dispatch(updateNotificationsEnabled(true));
  }).catch((err) => {
    console.error(err);
    store.dispatch(updateNotificationData(false));
  });
}

// Handle new tokens
messaging.onTokenRefresh(() => {
  updateToken().catch(console.error);
});

// Handle notifications
messaging.onMessage((payload) => {
  let data = JSON.parse(payload.data.smartapp);
  store.dispatch(updateNotificationData(payload));
  smartAppClient.getDeviceStatus(data.deviceId)
    .then((newStatus) => {
      store.dispatch(
        CommonActions.updateDeviceStatus(newStatus.deviceId, newStatus.status));
    });
});

updateToken().catch(console.error);
