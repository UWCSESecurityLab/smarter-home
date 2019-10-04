import MaterialIcon from '@material/react-material-icon';
import '@material/react-material-icon/index.scss';
import TopAppBar, {
  TopAppBarIcon,
  TopAppBarRow,
  TopAppBarSection,
  TopAppBarTitle
} from '@material/react-top-app-bar';
import PropTypes from 'prop-types';
import React from 'react';
import Toast from 'react-notify-toast';
import { connect } from 'react-redux';
import { Route, Switch, withRouter } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import '../css/home.scss';
import '../css/modal.scss';

import toastError from '../lib/error-toaster';
import HomeState from '../lib/home-state';
import * as Actions from '../redux/actions';
import ActivityNotificationSettings from './ActivityNotificationSettings.react';
import AddUserModal from './AddUserModal.react';
import AskApprovalPrompt from './AskApprovalPrompt.react';
import AskRequest from './AskRequest.react';
import BeaconModal from './BeaconModal.react';
import DeviceModal from './DeviceModal.react';
import Devices from './Devices.react';
import Drawer from './Drawer.react';
import Feedback from './Feedback.react';
import HomeItemErrorBoundary from './HomeItemErrorBoundary.react';
import ModalErrorBoundary from './ModalErrorBoundary.react';
import NotificationSettings from './NotificationSettings.react';
import UserModal from './UserModal.react';
import Users from './Users.react';



const RippleSpinner = (props) => {
  return (
    <span ref={props.initRipple} className="ripple-icon-component inline-spinner-white"></span>
  )
}

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
        module.default.updateToken();
      });
    } else {
      import('../lib/notifications/cordova-notifications.js').then((module) => {
        this.setState({notifications: module.default });
        module.default.updateToken();
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

    const showApprovalPrompt = Object.keys(this.props.commandRequests).length !== 0;
    const showAskRequest = !!this.props.pendingCommand;

    return (
      <div>
        <Drawer open={this.state.drawerOpen} closeFn={() => this.setState({drawerOpen: false})}/>
        <TopAppBar fixed>
          <TopAppBarRow>
            <TopAppBarSection align='start'>
              <TopAppBarIcon navIcon>
                <MaterialIcon
                  icon='menu'
                  onClick={() => { this.setState({ drawerOpen: !this.state.drawerOpen })}}/>
              </TopAppBarIcon>
              <TopAppBarTitle>{'SmarterHome' + devFlag}</TopAppBarTitle>
            </TopAppBarSection>
            <TopAppBarSection align="end" role="toolbar">
              <TopAppBarIcon actionItem>
                { this.props.refreshSpinner
                  ? <RippleSpinner/>
                  : <MaterialIcon key='item' icon='refresh' onClick={this.refresh}/>
                }
              </TopAppBarIcon>
            </TopAppBarSection>
          </TopAppBarRow>
        </TopAppBar>

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
                       render={() =>
                        <ModalErrorBoundary route="/addBeacon">
                          <BeaconModal/>
                        </ModalErrorBoundary>
                       }/>
                <Route path={`${this.props.match.url}/addUser`}
                       render={() =>
                          <ModalErrorBoundary route="/addUser">
                            <AddUserModal setVisibility={this.setVisibility}/>
                          </ModalErrorBoundary>
                       }/>
                <Route path={`${this.props.match.url}/device/:deviceId`}
                       render={() =>
                         <ModalErrorBoundary route="/device/">
                           <DeviceModal/>
                         </ModalErrorBoundary>
                       }/>
                <Route path={`${this.props.match.url}/user/:userId`}
                       render={() =>
                         <ModalErrorBoundary route="/user/">
                           <UserModal/>
                         </ModalErrorBoundary>
                       }/>
                <Route render={() => null}/>
              </Switch>
            </CSSTransition>
          </TransitionGroup>

          <CSSTransition in={showApprovalPrompt} timeout={75} classNames={'fade'} mountOnEnter unmountOnExit>
            <ModalErrorBoundary action={Actions.clearCommandRequests()}>
              <AskApprovalPrompt/>
            </ModalErrorBoundary>
          </CSSTransition>

          <CSSTransition in={showAskRequest} timeout={75} classNames={'fade'} mountOnEnter unmountOnExit>
            <ModalErrorBoundary action={Actions.clearPendingCommand()}>
              <AskRequest/>
            </ModalErrorBoundary>
          </CSSTransition>

          <Switch>
            <Route path="/home" render={() => (
              <div>
                <HomeItemErrorBoundary className="home-item">
                  <Devices/>
                </HomeItemErrorBoundary>
                <HomeItemErrorBoundary className="home-item">
                  <Users/>
                </HomeItemErrorBoundary>
              </div>
            )}/>
            <Route path="/notificationSettings/activity" render={() =>
              <HomeItemErrorBoundary>
                <ActivityNotificationSettings/>
              </HomeItemErrorBoundary>
            }/>
            <Route path="/notificationSettings" render={() =>
              <HomeItemErrorBoundary>
                <NotificationSettings/>
              </HomeItemErrorBoundary>
            }/>
            <Route path="/feedback" render={() =>
              <HomeItemErrorBoundary>
                <Feedback/>
              </HomeItemErrorBoundary>
            }/>
          </Switch>
        </div>
      </div>
    );
  }
}

Home.propTypes = {
  commandRequests: PropTypes.object,
  dispatch: PropTypes.func,
  match: PropTypes.object,
  location: PropTypes.object,
  notificationsEnabled: PropTypes.bool,
  pendingCommand: PropTypes.object,
  refreshSpinner: PropTypes.bool,
  silenceNotificationPrompt: PropTypes.bool
}

const mapStateToProps = (state) => {
  return {
    notificationsEnabled: state.fcm.notificationsEnabled,
    refreshSpinner: state.refreshSpinner,
    silenceNotificationPrompt: state.fcm.silenceNotificationPrompt,
    pendingCommand: state.pendingCommand,
    commandRequests: state.commandRequests
  }
}

export default withRouter(connect(mapStateToProps)(Home));