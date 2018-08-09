import { CommonActions, SmartAppClient } from 'common';
import { store } from '../../redux/reducers';
import Capability from './Capability';

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
        CommonActions.updateDeviceStatus(newStatus.deviceId, newStatus.status)
      );
    } catch (e) {
      throw(e)
    }
  }
}

export default Actuatable;