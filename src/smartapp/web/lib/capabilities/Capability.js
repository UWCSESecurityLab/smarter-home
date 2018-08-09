import { store } from '../../redux/reducers';

class Capability {
  static isBeacon(deviceId) {
    let deviceDesc = store.getState().devices.deviceDesc;
    if (deviceDesc[deviceId]) {
      return deviceDesc[deviceId].deviceTypeName == 'beacon';
    } else {
      return false;
    }
  }

  static getName(deviceId) {
    let deviceDesc = store.getState().devices.deviceDesc;
    if (deviceDesc[deviceId]) {
      return deviceDesc[deviceId].name;
    } else {
      return null;
    }
  }

  static getNotificationActions() {
    return null;
  }
}

export default Capability