import * as Actions from './actions';

let initial_home_config_state = {
  doorLocks: [],
  switches: [],
  contactSensors: [],
  motionSensors: []
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

export function permissions(state = {}, action) {
  switch (action.type) {
    case Actions.SET_ALL_PERMISSIONS:
      return action.permissions;
    case Actions.UPDATE_PERMISSION:
      return Object.assign({}, state, {
        [action.deviceId]: Object.assign({}, state[action.deviceId], action.permissions)
      });
    case Actions.ADD_DEVICE_OWNER: {
      let newOwners = Array.from(state[action.deviceId].owners);
      if (!newOwners.includes(action.userId)) {
        newOwners.push(action.userId);
      }
      return Object.assign({}, state, {
        [action.deviceId]: Object.assign({}, state[action.deviceId], { owners: newOwners })
      });
    }
    case Actions.REMOVE_DEVICE_OWNER: {
      let newOwners = Array.from(state[action.deviceId].owners);
      if (newOwners.includes(action.userId)) {
        newOwners.splice(newOwners.indexOf(action.userId), 1);
      }
      return Object.assign({}, state, {
        [action.deviceId]: Object.assign({}, state[action.deviceId], { owners: newOwners })
      });
    }
    default:
      return state;
  }
}

export function rooms(state = {}, action) {
  switch (action.type) {
    case Actions.SET_ROOMS: {
      return Object.assign({}, action.rooms);
    }
    case Actions.ADD_ROOM: {
      return Object.assign({}, action.room, state);
    }
    case Actions.REMOVE_ROOM: {
      let newState = Object.assign({}, state);
      delete newState[action.roomId];
      // Move devices from the deleted room to the default room
      let defaultRoom = Object.values(state).find((room) => room.default);
      let newDevices = defaultRoom.devices.concat(state[action.roomId].devices);
      return Object.assign({}, newState, {
        [defaultRoom.roomId]: Object.assign({}, newState[defaultRoom.roomId], {
          devices: newDevices
        })
      });
    }
    case Actions.UPDATE_ROOM_NAME: {
      return Object.assign({}, state, {
        [action.roomId]: Object.assign({}, state[action.roomId], {
          name: action.name,
          // need to deep copy devices array even if not modifying
          devices: state[action.roomId].devices.slice()
        })
      });
    }
    case Actions.REORDER_DEVICE_IN_ROOM: {
      const devicesClone = Array.from(state[action.roomId].devices);
      const [removed] = devicesClone.splice(action.startIndex, 1);
      devicesClone.splice(action.endIndex, 0, removed);
      return Object.assign({}, state, {
        [action.roomId]: Object.assign({}, state[action.roomId], {
          devices: devicesClone
        })
      });
    }
    case Actions.MOVE_DEVICE_BETWEEN_ROOMS: {
      const srcClone = Array.from(state[action.srcRoomId].devices);
      const destClone = Array.from(state[action.destRoomId].devices);
      const [removed] = srcClone.splice(action.srcIndex, 1);
      destClone.splice(action.destIndex, 0, removed);
      return Object.assign({}, state, {
        [action.srcRoomId]: Object.assign({}, state[action.srcRoomId], { devices: srcClone }),
        [action.destRoomId]: Object.assign({}, state[action.destRoomId], { devices: destClone })
      });
    }
    default:
      return state;
  }
}

export function spinners(state = {}, action) {
  switch (action.type) {
    case Actions.START_DEVICE_SPINNER:
      return Object.assign({}, state, { [action.deviceId]: true });
    case Actions.STOP_DEVICE_SPINNER:
      return Object.assign({}, state, { [action.deviceId]: false });
    case Actions.RESET_DEVICE_SPINNERS:
      return {};
    default:
      return state;
  }
}
