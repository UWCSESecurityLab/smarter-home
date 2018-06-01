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

export function rooms(state = {}, action) {
  switch (action.type) {
    case Actions.UPDATE_ROOM_NAME: {
      return Object.assign({}, state, {
        [action.roomId]: Object.assign({}, state[action.roomId], {
          name: action.name,
          devices: state[action.roomId].devices.slice()
        })
      });
    }
    case Actions.ADD_DEVICE_TO_ROOM: {
      let devicesClone = state[action.roomId].devices.slice();
      if (!devicesClone.includes(action.deviceId)) {
        devicesClone.push(action.deviceId);
      }
      return Object.assign({}, state, {
        [action.roomId]: Object.assign({}, state[action.roomId], {
          devices: devicesClone
        })
      });
    }
    case Actions.REMOVE_DEVICE_FROM_ROOM: {
      let devicesClone = state[action.roomId].devices.slice();
      let index = devicesClone.indexOf(action.deviceId);
      if (index !== 0) {
        devicesClone[action.id].devices.splice(index, 1);
      }
      return Object.assign({}, state, {
        [action.roomId]: Object.assign({}, state[action.roomId], {
          devices: devicesClone
        })
      });
    }
    default:
      return state;
  }
}
