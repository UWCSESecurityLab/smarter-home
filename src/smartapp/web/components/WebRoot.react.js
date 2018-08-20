import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux'
import { store } from '../redux/reducers';
import App from './App.react';
import * as Actions from '../redux/actions';
import * as Flags from '../../flags';

const WebRoot = () => (
  <Provider store={store}>
    <Router>
      <App/>
    </Router>
  </Provider>
);

export default WebRoot;

// Set initial flags
window.onload = function() {
  let flags;
  let stored = localStorage.getItem('flags');
  if (stored) {
    flags = JSON.parse(stored);
  } else {
    flags = {
      activityNotifications: Flags.ActivityNotifications.ON,
      nearbyNotifications: Flags.NearbyNotifications.OFF
    };
  }
  store.dispatch(Actions.setAllFlags(flags));
}