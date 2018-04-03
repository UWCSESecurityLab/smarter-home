import React from 'react';
import xhr from 'xhr';
import { SmartAppClient } from 'common';
import * as firebase from 'firebase/app';
import 'firebase/messaging';

let smartAppClient = new SmartAppClient('http://localhost:5000');

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
      fcmToken: null,
      accessToken: null,
      notificationsEnabled: false,
      notificationData: null,
      deviceId: ''
    };

    this.enableNotifications = this.enableNotifications.bind(this);
    this.sendTokenToServer = this.sendTokenToServer.bind(this);
    this.refreshAccessToken = this.refreshAccessToken.bind(this);
    this.updateDeviceId = this.updateDeviceId.bind(this);
    this.goToDeviceStatus = this.goToDeviceStatus.bind(this);
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
      this.setState({ notificationData: payload });
    });

    // Check if there's a cached token on load
    messaging.getToken()
      .then((currentToken) => {
        if (currentToken) {
          this.setState({ fcmToken: currentToken });
          return this.sendTokenToServer(currentToken)
        } else {
          return Promise.reject();
        }
      }).then(() => {
        this.setState({ notificationsEnabled: true });
      }).catch(() => {});
  }

  async sendTokenToServer(token) {
    try {
      let res = await smartAppClient.updateNotificationToken(token);
      if (res.status !== 200) {
        throw res.json();
      }
    } catch(e) {
      throw e;
    }
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
        console.log('token sent to server');
        this.setState({ notificationsEnabled: true });
      }).catch(console.error);
  }

  refreshAccessToken() {
    this.setState({ refreshStatus: 'loading' });
    xhr.get({
      url: '/refresh'
    }, (err, res, body) => {
      if (err || res.statusCode !== 200) {
        this.setState({ refreshStatus: 'error' });
        return;
      }
      this.setState({
        refreshStatus: 'success',
        accessToken: JSON.parse(body).access_token
      });
    });
  }

  updateDeviceId(e) {
    this.setState({ deviceId: e.target.value });
  }

  goToDeviceStatus() {
    if (this.state.deviceId !== '') {
      window.open(`/devices/${this.state.deviceId}/status`, '_blank');
    }
  }

  render() {
    let refreshStatus;
    if (this.state.refreshStatus === 'loading') {
      refreshStatus = <span className="spinner" id="spinner" aria-hidden="true"></span>;
    } else if (this.state.refreshStatus === 'error') {
      refreshStatus = <span className="x-mark">✗</span>
    } else if (this.state.refreshStatus === 'success') {
      refreshStatus = <span className="check-mark">✓</span>
    } else {
      refreshStatus = null;
    }

    return (
      <div className="container">
        <section>
          <h1>SmarterHome Control Panel</h1>
        </section>
        <section>
          <h3>SmartThings Configuration</h3>
          <div>
            <button id="refresh" onClick={this.refreshAccessToken}>⟳</button>
            <span id="refresh-label" >Refresh Access Token</span>
            {refreshStatus}
            { this.state.accessToken
              ? <div className="code-container" id="access-token">
                  <code>{this.state.accessToken}</code>
                </div>
              : null
            }
          </div>
        </section>

        <section>
          <h3>Firebase Cloud Messaging Configuration</h3>
          { this.state.notificationsEnabled
            ? <p><span className="check-mark">✓</span> Notifications enabled!</p>
            : <button onClick={this.enableNotifications}>Enable notifications</button>
          }
          { this.state.fcmToken
            ? <div>
                <p>This client's FCM token:</p>
                <div className="code-container">
                  <code>{this.state.fcmToken}</code>
                </div>
              </div>
            : null
          }
          { this.state.notificationData ?
            <div>
              <p>Received notification data:</p>
              <div className="code-container">
                <code>
                  { JSON.stringify(this.state.notificationData, null, 2) }
                </code>
              </div>
            </div>
            : null
          }
        </section>
        <section>
          <h3>Endpoints</h3>
          <ul>
            <li>
              <a href="/beacon" target="_blank">/beacon</a> -
              Beacon Simulator
            </li>
            <li>
              <a href="/deviceDescriptions" target="_blank">/deviceDescriptions</a> -
              Device Descriptions
            </li>
            <li>
              Device Status - /device/:deviceId/status
              <br/>
              <input placeholder="deviceId" value={this.state.deviceId} onChange={this.updateDeviceId}/>
              <button onClick={this.goToDeviceStatus}>Go</button>
            </li>
          </ul>

        </section>
      </div>
    );
  }

}

export default Home;