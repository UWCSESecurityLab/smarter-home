import React from 'react';
import PropTypes from 'prop-types';
import MaterialIcon from '@material/react-material-icon';
import TopAppBar from '@material/react-top-app-bar';
import Toast from 'react-notify-toast';
import { connect } from 'react-redux';
import { Route, Switch, withRouter } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group'

import AddUserModal from './AddUserModal.react';
import AskApprovalPrompt from './AskApprovalPrompt.react';
import AskRequest from './AskRequest.react';
import BeaconModal from './BeaconModal.react';
import Devices from './Devices.react';
import DeviceModal from './DeviceModal.react';
import Drawer from './Drawer.react';
import Feedback from './Feedback.react';
import HomeState from '../lib/home-state';
import NotificationSettings from './NotificationSettings.react';
import toastError from '../lib/error-toaster';
import UserModal from './UserModal.react';
import Users from './Users.react';
import * as Actions from '../redux/actions';

import '@material/react-material-icon/index.scss';
import '../css/home.scss';
import '../css/modal.scss';

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
    this.renderNotificationsPrompt = this.renderNotificationsPrompt.bind(this);
    this.setVisibility = this.setVisibility.bind(this);
    this.updateDeviceId = this.updateDeviceId.bind(this);
  }

  componentDidMount() {
    HomeState.resetDevices();
    HomeState.fetchUsers();

    if (!window.cordova) {
      import('../lib/notifications/web-notifications.js').then((module) => {
        this.setState({ notifications: module.default });
      });
    } else {
      import('../lib/notifications/cordova-notifications.js').then((module) => {
        console.log('Imported cordova-notifications');
        this.setState({notifications: module.default });
        console.log(this.state);
      });
    }
  }

  async refresh() {
    HomeState.resetDevices().catch(toastError);
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

  renderNotificationsPrompt() {
    if (!this.props.notificationsEnabled && !this.props.silenceNotificationPrompt) {
      return (
        <div id="notifications-prompt">
          <span onClick={() => {
            this.state.notifications.enableNotifications();
          }}>
            Tap here to enable notifications about activity in your home.
          </span>
          <MaterialIcon icon="close" onClick={() => {
            this.props.dispatch(Actions.silenceNotificationPrompt());
          }}/>
        </div>
      );
    } else {
      return null;
    }
  }

  render() {
    let devFlag = process.env.NODE_ENV === 'development' ? ' (Dev)' : '';
    const hidden = { visibility: 'hidden' };

    let transitionKey;
    if (this.props.location.pathname.startsWith('/home')) {
      transitionKey = this.props.location.pathname.split('/home')[1].split('/')[1];
    } else {
      transitionKey = this.props.location.key;
    }

    return (
      <div>
        <Drawer open={this.state.drawerOpen} closeFn={() => this.setState({drawerOpen: false})}/>
        <TopAppBar
          fixed
          title={'SmarterHome' + devFlag}
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
          <Toast options={{ zIndex: 6 }}/>
          {this.renderNotificationsPrompt()}

          <TransitionGroup>
            <CSSTransition
              key={transitionKey}
              timeout={75}
              classNames={'fade'}>
              <Switch location={this.props.location}>
                <Route path={`${this.props.match.url}/addBeacon`}
                      component={BeaconModal}/>
                <Route path={`${this.props.match.url}/addUser`}
                      render={() =>
                        <AddUserModal setVisibility={this.setVisibility}/>} />
                <Route path={`${this.props.match.url}/device/:deviceId`}
                      component={DeviceModal}/>
                <Route path={`${this.props.match.url}/user/:userId`}
                      component={UserModal}/>
                <Route render={() => null}/>
              </Switch>
            </CSSTransition>
          </TransitionGroup>

          <AskApprovalPrompt/>
          <AskRequest/>
          <Switch>
            <Route path="/home" render={() => (
              <div>
                <Devices/>
                <Users/>
              </div>
            )}/>
            <Route path="/notificationSettings" component={NotificationSettings}/>
            <Route path="/feedback" component={Feedback}/>
          </Switch>
        </div>
      </div>
    );
  }
}

Home.propTypes = {
  dispatch: PropTypes.func,
  match: PropTypes.object,
  location: PropTypes.object,
  notificationsEnabled: PropTypes.bool,
  silenceNotificationPrompt: PropTypes.bool
}

const mapStateToProps = (state) => {
  return {
    notificationsEnabled: state.fcm.notificationsEnabled,
    silenceNotificationPrompt: state.fcm.silenceNotificationPrompt
  }
}

export default withRouter(connect(mapStateToProps)(Home));