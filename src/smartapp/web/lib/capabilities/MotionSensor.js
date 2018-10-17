import Capability from './Capability';

class MotionSensor extends Capability {
  static getStatus(state, deviceId) {
    let deviceStatus = state.devices.deviceStatus;
    if (deviceStatus[deviceId]) {
      return deviceStatus[deviceId].components.main.motionSensor.motion.value;
    } else {
      return null;
    }
  }
}

export default MotionSensor;