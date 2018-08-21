import React from 'react';
import PropTypes from 'prop-types';
import MaterialIcon from '@material/react-material-icon';
import TopAppBar from '@material/react-top-app-bar';
import { Route, Switch } from 'react-router-dom';

import AddUserModal from './AddUserModal.react';
import BeaconModal from './BeaconModal.react';
import Devices from './Devices.react';
import Drawer from './Drawer.react';
import FirebaseOptions from './FirebaseOptions.react';
import HomeState from '../lib/home-state';
import NotificationSettings from './NotificationSettings.react';
import Users from './Users.react';
import { SmartAppClient } from 'common';

import '@material/react-material-icon/index.scss';
import '../css/home.scss';

const smartAppClient = new SmartAppClient();

class Home extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      accessToken: null,
      deviceId: '',
      notifications: null,
      drawerOpen: false,
      visible: true,
    };

    this.goToDeviceStatus = this.goToDeviceStatus.bind(this);
    this.refresh = this.refresh.bind(this);
    this.setVisibility = this.setVisibility.bind(this);
    this.updateDeviceId = this.updateDeviceId.bind(this);
  }

  componentDidMount() {
    HomeState.resetDevices();
    HomeState.fetchUsers();
  }

  async refresh() {
    await smartAppClient.refreshAccessToken();
    HomeState.resetDevices();
    HomeState.fetchUsers();
  }

  updateDeviceId(e) {
    this.setState({ deviceId: e.target.value });
  }

  goToDeviceStatus() {
    if (this.state.deviceId !== '') {
      window.open(`/devices/${this.state.deviceId}/status`, '_blank');
    }
  }
  setVisibility(value) {
    this.setState({ visible: value });
  }

  render() {
    const hidden = { visibility: 'hidden' };
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
            <MaterialIcon key='item' icon='refresh' onClick={this.refresh}/>
          ]}
        />
        <div className="container mdc-top-app-bar--fixed-adjust"
             style={this.state.visible ? null : hidden}>

          <Route path={`${this.props.match.url}/addBeacon`}
                 component={BeaconModal}/>
          <Route path={`${this.props.match.url}/addUser`}
                 render={() =>
                  <AddUserModal setVisibility={this.setVisibility}/>} />
          <Switch>
            <Route path="/home" render={() => (
              <div>
                <Devices/>
                <Users/>
                <FirebaseOptions/>
              </div>
            )}/>
            <Route path="/notificationSettings" component={NotificationSettings}/>
          </Switch>
        </div>
      </div>
    );
  }
}

Home.propTypes = {
  match: PropTypes.object
}

export default Home;