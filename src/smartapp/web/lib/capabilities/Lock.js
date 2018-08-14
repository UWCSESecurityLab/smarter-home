import Actuatable from './Actuatable';

class Lock extends Actuatable {
  static actuate(deviceId, command) {
    return super.actuate(deviceId, 'lock', command)
  }

  static unlock(deviceId) {
    return this.actuate(deviceId, 'unlock');
  }

  static lock(deviceId) {
    return this.actuate(deviceId, 'lock');
  }

  static getStatus(state, deviceId) {
    let deviceStatus = state.devices.deviceStatus;
    if (deviceStatus[deviceId]) {
      return deviceStatus[deviceId].components.main.lock.lock.value;
    } else {
      return null;
    }
  }

  static getNotificationActions() {
    return [
      { id: 'lock-lock', title: 'Lock' },
      { id: 'lock-unlock', title: 'Unlock' }
    ];
  }
}
export default Lock;

async function onNotificationAction(notification, command) {
  try {
    console.log(notification);

    await Lock.actuate(notification.data.deviceId, command);
    const lockStatus = Lock.getStatus(notification.data.deviceId);
    const lockName = Lock.getLabel(notification.data.deviceId);
    cordova.plugins.notification.local.update({
      id: notification.id,
      title: lockName + ' is ' + lockStatus
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


