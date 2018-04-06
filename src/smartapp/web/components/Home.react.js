import React from 'react';
import { Provider } from 'react-redux'
import * as notifications from '../notifications';
import { store } from '../redux/reducers';
import FirebaseOptions from './FirebaseOptions.react';
import SmartThingsOptions from './SmartThingsOptions.react';
import Devices from './Devices.react';

class Home extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      accessToken: null,
      deviceId: ''
    };

    this.updateDeviceId = this.updateDeviceId.bind(this);
    this.goToDeviceStatus = this.goToDeviceStatus.bind(this);
  }

  componentDidMount() {
    // Check if there's a cached token on load
    notifications.updateToken();
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
    return (
      <Provider store={store}>
        <div className="container">
          <section>
            <h1>SmarterHome Control Panel</h1>
          </section>
          <Devices/>
          <SmartThingsOptions/>
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