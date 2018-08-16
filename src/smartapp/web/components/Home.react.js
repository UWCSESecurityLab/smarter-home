import React from 'react';
import Devices from './Devices.react';
import Drawer from './Drawer.react';
import FirebaseOptions from './FirebaseOptions.react';
import HomeState from '../lib/home-state';
import SmartThingsOptions from './SmartThingsOptions.react';
import Users from './Users.react';

import TopAppBar from '@material/react-top-app-bar';
import MaterialIcon from '@material/react-material-icon';

import '@material/react-material-icon/index.scss';
import '../css/home.scss';

class Home extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      accessToken: null,
      deviceId: '',
      notifications: null,
      drawerOpen: false
    };

    this.updateDeviceId = this.updateDeviceId.bind(this);
    this.goToDeviceStatus = this.goToDeviceStatus.bind(this);
  }

  componentDidMount() {
    HomeState.reset();
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
      <div>
        <Drawer open={this.state.drawerOpen} closeFn={() => this.setState({drawerOpen: false})}/>
        <TopAppBar
          fixed
          title='SmarterHome'
          navigationIcon={<MaterialIcon
            icon='menu'
            onClick={() => { this.setState({ drawerOpen: !this.state.drawerOpen })}}
          />}
          actionItems={[
            <MaterialIcon key='item' icon='refresh' onClick={() => {HomeState.reset() }}/>
          ]}
        />
        <div className="container mdc-top-app-bar--fixed-adjust">
          {/* <Devices/> */}
          <Users/>
          <SmartThingsOptions/>
          <FirebaseOptions/>
        </div>
      </div>
    );
  }
}

export default Home;