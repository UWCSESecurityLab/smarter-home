import Actuatable from './Actuatable';
import { store } from '../../redux/reducers';

class Switch extends Actuatable {
  static actuate(deviceId, command) {
    super.actuate(deviceId, 'switch', command)
  }

  static on(deviceId) {
    return this.actuate(deviceId, 'on');
  }
  static off(deviceId) {
    return this.actuate(deviceId, 'off');
  }

  static getStatus(deviceId) {
    let deviceStatus = store.getState().devices.deviceStatus;
    if (deviceStatus[deviceId]) {
      return deviceStatus[deviceId].components.main.switch.switch.value;
    } else {
      return null;
    }
  }

  static getNotificationActions() {
    return {
      switch: [
        { id: 'switch-on', title: 'Turn On' },
        { id: 'switch-off', title: 'Turn Off' }
      ]
    }
  }
}

export default Switch;

async function onNotificationAction(notification, command) {
  try {
    await Switch.actuate(notification.data.deviceId, 'switch', command);
    const switchStatus = Switch.getStatus(notification.data.deviceId);
    const switchName = Switch.getLabel(notification.data.deviceId);
    cordova.plugins.notification.local.update({
      id: notification.id,
      title: switchName + ' is ' + switchStatus
    });
  } catch (e) {
    console.error(e.stack);
  }
}

document.addEventListener('deviceready', () => {
  if (window._cordovaNative) {
    cordova.plugins.notification.local.on('lock-lock', (notification) => {
      onNotificationAction(notification, 'lock')
    });
    cordova.plugins.notification.local.on('lock-unlock', (notification) => {
      onNotificationAction(notification, 'unlock')
    });
  }
});

