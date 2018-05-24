import * as Actions from './actions';

let initial_home_config_state = {
  doorLocks: [],
  switches: [],
  contactSensors: [],
}

// Export individual reducers because react-native's metro bundler can't
// bundle external modules in local packages (like redux)
export function homeConfig(state = initial_home_config_state, action) {
  switch (action.type) {
    case Actions.UPDATE_HOME_CONFIG:
      console.log(action);
      return action.config
    default:
      return state;
  }
}

export function deviceDesc(state = {}, action) {
  switch (action.type) {
    case Actions.UPDATE_DEVICE_DESC:
      return Object.assign({}, state, { [action.id]: action.desc });
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
