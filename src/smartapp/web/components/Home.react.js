import React from 'react';
import SmartThingsOptions from './SmartThingsOptions.react';
import Devices from './Devices.react';
import Drawer from './Drawer.react';

import TopAppBar from '@material/react-top-app-bar';
import MaterialIcon from '@material/react-material-icon';

import '../css/home.scss';

import '@material/react-material-icon/index.scss';

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
      <div>
        <Drawer/>
        <TopAppBar
          fixed
          title='SmarterHome'
          navigationIcon={<MaterialIcon
            icon='menu'
            onClick={() => console.log('click')}
          />}
          actionItems={[<MaterialIcon key='item' icon='bookmark' />]}
        />
        <div className="container mdc-top-app-bar--fixed-adjust">
          <Devices/>
          <SmartThingsOptions/>
          { NotificationOptions ? <NotificationOptions /> : null }
          <section className="home-item">
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
      </div>
    );
  }
}

export default Home;