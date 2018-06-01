import { combineReducers, createStore } from 'redux';
import { NAVIGATE, Views } from './actions';
import { CommonReducers } from 'common';

// Defines which screen in the app is being displayed.
function view(state = Views.LOGIN, action) {
  switch (action.type) {
    case NAVIGATE:
      return action.view
    default:
      return state
  }
}

const reducers = combineReducers({
  view: view,
  devices: combineReducers({
    deviceDesc: CommonReducers.deviceDesc,
    deviceStatus: CommonReducers.deviceStatus,
    homeConfig: CommonReducers.homeConfig,
    rooms: CommonReducers.rooms
  })
});

const store = createStore(reducers);

export { store };