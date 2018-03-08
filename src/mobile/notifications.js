import { DeviceEventEmitter } from 'react-native';
import Kontakt from 'react-native-kontaktio';
import FCM, { FCMEvent } from 'react-native-fcm';

const BEACON_INSTANCE_ID = 'aabbccddeeff';

Kontakt.connect('', [Kontakt.EDDYSTONE])
  .then(() => Kontakt.startScanning())
  .catch(error => console.log('error', error));

let _beacon = false;

DeviceEventEmitter.addListener('eddystoneDidAppear', ({ eddystone, namespace }) => {
  // console.log('eddystoneDidAppear', eddystone, namespace);
  if (eddystone.instanceId === BEACON_INSTANCE_ID) {
    _beacon = true;
  }
});

DeviceEventEmitter.addListener('eddystoneDidDisappear', ({ eddystone, namespace }) => {
  // console.log('eddystoneDidDisappear', eddystone, namespace);
  if (eddystone.instanceId === BEACON_INSTANCE_ID) {
    _beacon = false;
  }
});

FCM.on(FCMEvent.Notification, async (notification) => {
  console.log('FCMEvent.Notification');
  if (_beacon) {
    console.log('_beacon is true');
    let data = JSON.parse(notification.smartapp);
    let title = data.capability + ' ' + data.value;

    FCM.presentLocalNotification({
      id: new Date().valueOf().toString(),
      title: title,
      body: data.device,
      sound: 'default',
      priority: 'low'
    });
  } else {
    console.log('_beacon is false');
  }
});