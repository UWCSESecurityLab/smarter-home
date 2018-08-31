import Capability from './Capability';
import SmartAppClient from '../SmartAppClient';
import toastError from '../../lib/error-toaster';
import { store } from '../../redux/reducers';
import * as Actions from '../../redux/actions';

let smartAppClient = new SmartAppClient();

class Actuatable extends Capability {
  static async actuate(deviceId, capability, command) {
    try {
      await smartAppClient.executeDeviceCommand({
        deviceId: deviceId,
        command: {
          component: 'main',
          capability: capability,
          command: command
        }
      });
      let newStatus = await smartAppClient.getDeviceStatus(deviceId);
      store.dispatch(
        Actions.updateDeviceStatus(newStatus.deviceId, newStatus.status)
      );
    } catch (e) {
      toastError(e);
    }
  }
}

export default Actuatable;