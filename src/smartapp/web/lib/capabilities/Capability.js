class Capability {
  static isBeacon(state, deviceId) {
    let deviceDesc = state.devices.deviceDesc;
    if (deviceDesc[deviceId]) {
      return deviceDesc[deviceId].deviceTypeName == 'beacon';
    } else {
      return false;
    }
  }

  static getLabel(state, deviceId) {
    let deviceDesc = state.devices.deviceDesc;
    if (deviceDesc[deviceId]) {
      if (deviceDesc[deviceId].label) {
        return deviceDesc[deviceId].label;
      } else {
        return deviceDesc[deviceId].name;
      }
    } else {
      return null;
    }
  }

  static getDesc(state, deviceId) {
    return state.devices.deviceDesc[deviceId];
  }

  static getStatus(state, deviceId) {
    return state.devices.deviceStatus[deviceId];
  }

  static getPermissions(state, deviceId) {
    return state.devices.permissions[deviceId];
  }

  static getNotificationActions() {
    return null;
  }
}

export default Capability;