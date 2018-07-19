import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux'
import { store } from '../redux/reducers';
import App from './App.react';

const EntryPoint = () => (
  <Provider store={store}>
    <Router>
      <App/>
    </Router>
  </Provider>
);

export default EntryPoint;