import * as firebase from 'firebase/app';
import 'firebase/messaging';
import { store } from '../../redux/reducers';
import {
  updateNotificationsEnabled,
  updateNotificationData
} from '../../redux/actions';
import Notifications from './notifications';

// This script initializes Firebase when imported, handles incoming messages,
// and exposes helper functions for updating the Firebase tokens and enabling
// the notifications permission.
// The token, notification data, and permission status are all bound to the
// redux state.

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

class WebNotifications extends Notifications {
  // Updates the FCM token (state.fcmToken).
  // Retrieves a cached token if one exists, otherwise gets one from the FCM server.
  static async updateToken() {
    try {
      let currentToken = await messaging.getToken();
      await super.updateToken(currentToken);
      store.dispatch(updateNotificationsEnabled(true));
    } catch(e) {
      console.error(e);
      store.dispatch(updateNotificationsEnabled(false));
    }
  }

  // Requests permission to send browser notifications.
  static enableNotifications() {
    messaging.requestPermission().then(() => {
      return this.updateToken();
    }).catch((err) => {
      console.error(err);
      store.dispatch(updateNotificationsEnabled(false));
    });
  }
}

// This code goes below the class, because of issues with webpack and hoisting.
// Handle new tokens
messaging.onTokenRefresh(() => {
  WebNotifications.updateToken().catch(console.error);
});
// Handle notifications
messaging.onMessage((payload) => {
  WebNotifications.onMessage(payload.data);
});
WebNotifications.updateToken().catch(console.error);

export default WebNotifications;
