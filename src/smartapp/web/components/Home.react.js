import React from 'react';
import xhr from 'xhr';

import * as firebase from 'firebase/app';
import 'firebase/messaging';

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

class Home extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      notificationsEnabled: false,
      notification: null
    };

    this.enableNotifications = this.enableNotifications.bind(this);
    this.sendTokenToServer = this.sendTokenToServer.bind(this);
  }

  componentDidMount() {
    // Handle refreshes
    messaging.onTokenRefresh(() => {
      messaging.getToken()
        .then(this.sendTokenToServer)
        .catch(console.error);
    });

    // Handle notifications
    messaging.onMessage((payload) => {
      console.log('notification received');
      console.log(payload);
      this.setState({ notification: payload });
    });

    // Check if there's a cached token on load
    messaging.getToken()
      .then((currentToken) => {
        if (currentToken) {
          return this.sendTokenToServer(currentToken)
        } else {
          return Promise.reject();
        }
      }).then(() => {
        this.setState({ notificationsEnabled: true });
      }).catch(() => {});
  }

  sendTokenToServer(token) {
    console.log('notification token');
    console.log(token);
    return new Promise((resolve, reject) => {
      xhr.post({
        url: 'http://localhost:5000/notificationToken?token=' + token
      }, (err, res, body) => {
        if (err) {
          reject(err);
        } else if (res.statusCode !== 200) {
          reject(body);
        } else {
          resolve();
        }
      });
    });
  }

  enableNotifications() {
    messaging.requestPermission()
      .then(() => {
        return messaging.getToken()
      })
      .then((currentToken) => {
        if (currentToken) {
          return this.sendTokenToServer(currentToken)
        } else {
          return Promise.reject('Permissions not enabled');
        }
      }).then(() => {
        this.setState({ notificationsEnabled: true });
      }).catch(console.error);
  }

  render() {
    return (
      <div>
        <h2>Home</h2>
        { this.state.notificationsEnabled
          ? <p>Notifications enabled!</p>
          : <button onClick={this.enableNotifications}>Enable notifications</button>
        }
        <code>
          { JSON.stringify(this.state.notification, null, 2) }
        </code>
      </div>
    );
  }

}

export default Home;