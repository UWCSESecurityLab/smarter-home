import Capability from './Capability';
import SmartAppClient from '../SmartAppClient';
import toastError from '../../lib/error-toaster';
import { notify as toast } from 'react-notify-toast';
import { ApprovalState } from '../../../permissions';
import { store } from '../../redux/reducers';
import * as Actions from '../../redux/actions';
import * as Proximity from '../proximity';

let smartAppClient = new SmartAppClient();

function locationPrompt(deviceId, capability, command, policy) {
  store.dispatch(Actions.addLocationPrompt(deviceId, capability, command, policy));
}

class Actuatable extends Capability {
  // Directly actuate a device and skip access control checks
  static async actuallyActuate(deviceId, capability, command) {
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

  // Attempt to actuate a device, but set prompt UI instead if blocked by access
  // controls.
  static async actuate(deviceId, capability, command) {
    const desc = store.getState().devices.deviceDesc[deviceId];
    let name = '';
    if (desc && desc.label) {
      name = desc.label;
    } else if (desc && desc.name) {
      name = desc.name;
    }

    const isHome = Proximity.userIsHome();
    const isNearby = Proximity.userIsNearDevice(deviceId);

    store.dispatch(Actions.startDeviceSpinner(deviceId));

    smartAppClient.requestDeviceCommand({
      deviceId: deviceId,
      command: {
        command: command,
        capability: capability,
        isHome: isHome,
        isNearby: isNearby
      }
    }).then(({ commandId, decision, nearby, owner }) => {
      console.log(decision);
      if (decision === ApprovalState.DENY) {
        console.log('immediate deny');
        store.dispatch(Actions.stopDeviceSpinner(deviceId));
        toast.show('You do not have permission to control ' + name);
      } else if (decision === ApprovalState.ALLOW) {
        smartAppClient.getDeviceStatus(deviceId).then((newStatus) => {
          store.dispatch(
            Actions.updateDeviceStatus(newStatus.deviceId, newStatus.status));
          });
          store.dispatch(Actions.stopDeviceSpinner(deviceId));
      } else if (decision === ApprovalState.PENDING) {
        store.dispatch(Actions.setPendingCommand({
          capability: capability,
          command: command,
          commandId: commandId,
          deviceId: deviceId,
          decision: decision,
          nearbyApproval: nearby,
          ownerApproval: owner
        }));
      }
    });
  }
}

export default Actuatable;