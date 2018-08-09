import React from 'react'
import { HashRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux'
import { store } from '../redux/reducers';
import App from './App.react';
import * as Actions from '../redux/actions';

function onDeviceReady () {
  // Initialize beacon scanning code here:
  let delegate = new cordova.plugins.locationManager.Delegate();
  delegate.didDetermineStateForRegion = (result) => {
    switch (result.state) {
      case 'CLRegionStateInside': {
        console.log(result.region.identifier + ' is nearby');
        store.dispatch(Actions.addNearbyBeacon(result.region));
        break;
      }
      case 'CLRegionStateOutside': {
        console.log(result.region.identifier + ' is no longer nearby');
        store.dispatch(Actions.removeNearbyBeacon(result.region));
        break;
      }
    }
  }
  delegate.didStartMonitoringForRegion = (result) => {
    console.log('didStartMonitoringForRegion: ' + result.region.identifier);
  }
  delegate.didRangeBeaconsInRegion = (result) => {
    // console.log('didRangeBeaconsInRegion');
    // console.log(result);
  }

  cordova.plugins.locationManager.setDelegate(delegate);
  cordova.plugins.locationManager.requestAlwaysAuthorization();
}

document.addEventListener('deviceready', onDeviceReady, false);

const CordovaRoot = () => (
  <Provider store={store}>
    <Router>
      <App/>
    </Router>
  </Provider>
);

export default CordovaRoot;