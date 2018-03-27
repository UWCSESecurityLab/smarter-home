import { NAVIGATE, UPDATE_DEVICE_DESC, Views } from './actions';
import { combineReducers } from 'redux';

// Defines which screen in the app is being displayed.
function view(state = Views.LOGIN, action) {
  switch (action.type) {
    case NAVIGATE:
      return action.view
    default:
      return state
  }
}

let initial_device_desc_state = {
  doorLock: [],
  switches: []
}

function device_descs(state = initial_device_desc_state, action) {
  switch (action.type) {
    case UPDATE_DEVICE_DESC:
      return action.desc
    default:
      return state;
  }
}

const reducers = combineReducers({
  view: view,
  device_descs: device_descs
});

export default reducers;