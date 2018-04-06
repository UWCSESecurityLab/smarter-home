import React from 'react';
import { Provider } from 'react-redux'
import { SmartAppClient } from 'common';
import * as fcmHelper from '../fcmHelper';
import { store } from '../redux/reducers';
import FirebaseOptions from './FirebaseOptions.react';

let smartAppClient = new SmartAppClient('http://localhost:5000');

class Home extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      accessToken: null,
      deviceId: ''
    };

    this.refreshAccessToken = this.refreshAccessToken.bind(this);
    this.updateDeviceId = this.updateDeviceId.bind(this);
    this.goToDeviceStatus = this.goToDeviceStatus.bind(this);
  }

  componentDidMount() {
    // Check if there's a cached token on load
    fcmHelper.updateToken();
  }

  async refreshAccessToken() {
    this.setState({ refreshStatus: 'loading' });
    try {
      let res = await smartAppClient.refreshAccessToken();
      if (res.status !== 200) {
        throw res.status;
      }
      let token = await res.json();
      this.setState({
        refreshStatus: 'success',
        accessToken: token.access_token
      });
    } catch (e) {
      this.setState({ refreshStatus: 'error' });
    }
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
      <Provider store={store}>
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
          <FirebaseOptions/>
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
      </Provider>
    );
  }

}

export default Home;