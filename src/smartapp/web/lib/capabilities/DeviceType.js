import ContactSensor from './ContactSensor';
import Lock from './Lock';
import Switch from './Switch';

export function getCapabilityHelper(homeConfig, deviceId) {
  if (homeConfig.contactSensors.includes(deviceId)) {
    return ContactSensor;
  } else if (homeConfig.switches.includes(deviceId)) {
    return Switch;
  } else if (homeConfig.doorLocks.includes(deviceId)) {
    return Lock;
  } else {
    return null;
  }
}