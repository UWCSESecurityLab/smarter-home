import React from 'react';
import SmartThingsOptions from './SmartThingsOptions.react';
import Devices from './Devices.react';

class Home extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      accessToken: null,
      deviceId: '',
      notificationOptions: null,
    };

    this.updateDeviceId = this.updateDeviceId.bind(this);
    this.goToDeviceStatus = this.goToDeviceStatus.bind(this);
  }

  componentDidMount() {
    if (!window._cordovaNative) {
      import('./FirebaseOptions.react').then((module) => {
        this.setState({ notificationOptions: module.default });
      });
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
    let NotificationOptions = this.state.notificationOptions;
    return (
      <div className="container">
        <section>
          <h1>SmarterHome Control Panel</h1>
        </section>
        <Devices/>
        <SmartThingsOptions/>
        { NotificationOptions ? <NotificationOptions /> : null }
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