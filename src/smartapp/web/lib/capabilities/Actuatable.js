import Capability from './Capability';
import SmartAppClient from '../SmartAppClient';
import Permissions from '../../../permissions';
import toastError from '../../lib/error-toaster';
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
    const state = store.getState();
    const permissions = state.devices.permissions[deviceId];
    const nearbyBeacons = state.beacons.nearbyBeacons;

    if (!permissions) {
      return this.actuallyActuate(deviceId, capability, command);
    }

    switch (permissions.locationRestrictions) {
      case Permissions.LocationRestrictions.ANYWHERE:
        return this.actuallyActuate(deviceId, capability, command);
      case Permissions.LocationRestrictions.AT_HOME: {
        if (Object.keys(nearbyBeacons).length > 0) {
          // TODO: Use geofencing instead to determine if user is at home
          return this.actuallyActuate(deviceId, capability, command);
        } else {
          locationPrompt(deviceId, capability, command, permissions.locationRestrictions);
          break;
        }
      }
      case Permissions.LocationRestrictions.NEARBY: {
        if (Proximity.userIsNearDevice(deviceId)) {
          return this.actuallyActuate(deviceId, capability, command);
        } else {
          locationPrompt(deviceId, capability, command, permissions.locationRestrictions);
          break;
        }
      }
    }
  }
}

export default Actuatable;