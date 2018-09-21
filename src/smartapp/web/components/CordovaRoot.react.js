import React from 'react'
import { HashRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux'
import { store } from '../redux/reducers';
import App from './App.react';
import myHistory from '../lib/history';
import HomeState from '../lib/home-state';
import * as Actions from '../redux/actions';
import * as Flags from '../../flags';
import '../lib/notifications/cordova-notifications';

function onDeviceReady() {
  // Set initial flags
  let flags;
  let stored = localStorage.getItem('flags');
  if (stored) {
    flags = JSON.parse(stored);
  } else {
    if (device.platform === 'Android') {
      flags = {
        activityNotifications: Flags.ActivityNotifications.PROXIMITY,
        nearbyNotifications: Flags.NearbyNotifications.ON,
        backgroundScanning: Flags.BackgroundScanning.ON
      }
    } else if (device.platform === 'iOS') {
      flags = {
        activityNotifications: Flags.ActivityNotifications.ON,
        nearbyNotifications: Flags.NearbyNotifications.OFF,
        backgroundScanning: Flags.BackgroundScanning.ON
      }
    }
  }
  store.dispatch(Actions.setAllFlags(flags));
  HomeState.fetchPendingCommands();
}

document.addEventListener('deviceready', onDeviceReady, false);

document.addEventListener('resume', () => {
  HomeState.fetchPendingCommands();
});

const CordovaRoot = () => (
  <Provider store={store}>
    <Router history={myHistory}>
      <App/>
    </Router>
  </Provider>
);

export default CordovaRoot;