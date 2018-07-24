import React from 'react'
import { HashRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux'
import { store } from '../redux/reducers';
import App from './App.react';
// import notifications from '../cordova-notifications';

function onDeviceReady () {
  console.log('Device ready');
  console.log(cordova);
  //now cordova.ThemeableBrowser.open..
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