import Capability from './Capability';

class ContactSensor extends Capability {
  static getStatus(state, deviceId) {
    let deviceStatus = state.devices.deviceStatus;
    if (deviceStatus[deviceId]) {
      return deviceStatus[deviceId].components.main.contactSensor.contact.value;
    } else {
      return null;
    }
  }
}

export default ContactSensor;