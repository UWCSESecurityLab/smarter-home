import React from 'react';
import SmartThingsOptions from './SmartThingsOptions.react';
import Devices from './Devices.react';

let FirebaseOptions;
if (!window._cordovaNative) {
  FirebaseOptions = require('./FirebaseOptions.react');
}

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

  // componentDidMount() {
    // Check if there's a cached token on load
    // notifications.updateToken();
  // }

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
      <div className="container">
        <section>
          <h1>SmarterHome Control Panel</h1>
        </section>
        <Devices/>
        <SmartThingsOptions/>
        { FirebaseOptions ? <FirebaseOptions/> : null }
        <section>
          <h3>Endpoints</h3>
          <ul>
            <li>
              <a href="/beacon" target="_blank">/beacon</a> -
              Beacon Simulator
            </li>
            <li>
              <a href="/homeConfig" target="_blank">/homeConfig</a> -
              Home Configuration
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