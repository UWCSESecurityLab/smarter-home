import Capability from './Capability';
import { store } from '../../redux/reducers';

class ContactSensor extends Capability {
  static getStatus(deviceId) {
    let deviceStatus = store.getState().devices.deviceStatus;
    if (deviceStatus[deviceId]) {
      return deviceStatus[deviceId].components.main.contactSensor.contact.value;
    } else {
      return null;
    }
  }
}

export default ContactSensor;