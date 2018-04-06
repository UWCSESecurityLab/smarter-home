import React from 'react'
import { Provider } from 'react-redux'
import { store } from '../redux/reducers';
import App from './App';

const Entry = () => (
  <Provider store={store}>
    <App/>
  </Provider>
);

export default Entry;