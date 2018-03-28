import { NAVIGATE, UPDATE_DEVICE_DESC, UPDATE_DEVICE_STATUS, Views } from './actions';
import { combineReducers } from 'redux';

// Defines which screen in the app is being displayed.
function view(state = Views.HOME, action) {
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

function deviceDescs(state = initial_device_desc_state, action) {
  switch (action.type) {
    case UPDATE_DEVICE_DESC:
      return action.desc;
    default:
      return state;
  }
}

function deviceStatus(state = {}, action) {
  switch (action.type) {
    case UPDATE_DEVICE_STATUS:
      return Object.assign({}, state, { [action.id]: action.status });
    default:
      return state;
  }
}

const reducers = combineReducers({
  view: view,
  deviceDescs: deviceDescs,
  deviceStatus: deviceStatus
});

export default reducers;