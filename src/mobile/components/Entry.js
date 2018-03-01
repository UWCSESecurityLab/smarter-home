import React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import reducers from '../redux/reducers';
import App from './App';

let store = createStore(reducers);

const Entry = () => (
  <Provider store={store}>
    <App/>
  </Provider>
);

export default Entry;