import * as Actions from './actions';

let initial_device_desc_state = {
  doorLock: [],
  switches: [],
  contactSensors: [],
}

export function deviceDescs(state = initial_device_desc_state, action) {
  switch (action.type) {
    case Actions.UPDATE_DEVICE_DESC:
      return action.desc;
    default:
      return state;
  }
}

export function deviceStatus(state = {}, action) {
  switch (action.type) {
    case Actions.UPDATE_DEVICE_STATUS:
      return Object.assign({}, state, { [action.id]: action.status });
    default:
      return state;
  }
}