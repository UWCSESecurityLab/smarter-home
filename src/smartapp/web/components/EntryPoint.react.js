import React from 'react'
import { Provider } from 'react-redux'
import { store } from '../redux/reducers';
import App from './App.react';

const EntryPoint = () => (
  <Provider store={store}>
    <App/>
  </Provider>
);

export default EntryPoint;