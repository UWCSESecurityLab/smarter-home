import React from 'react';
import { Button, DeviceEventEmitter, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { navigate, Views } from '../redux/actions';
import FCM, { FCMEvent } from 'react-native-fcm';
import Kontakt from 'react-native-kontaktio';

Kontakt.connect('', [Kontakt.EDDYSTONE])
  .then(() => Kontakt.startScanning())
  .catch(error => console.log('error', error));

let _beacon = false;

DeviceEventEmitter.addListener('eddystoneDidAppear', ({ eddystone, namespace }) => {
  console.log('eddystoneDidAppear', eddystone, namespace);
  if (eddystone.instanceId === 'aabbccddeeff') {
    _beacon = true;
  }
});

DeviceEventEmitter.addListener('eddystoneDidDisappear', ({ eddystone, namespace }) => {
  console.log('eddystoneDidDisappear', eddystone, namespace);
  if (eddystone.instanceId === 'aabbccddeeff') {
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

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = { notification: '', beacon: '' };
    this.signOut = this.signOut.bind(this);
  }

  componentDidMount() {
    FCM.requestPermissions()
      .then(() => console.log('Permissions granted'))
      .catch(() => console.error('Permissions rejected'));

    FCM.getFCMToken()
      .then(this.sendTokenToServer)
      .catch(console.error);

    FCM.on(FCMEvent.Notification, async (notification) => {
      this.setState({ notification: JSON.stringify(notification, null, 2) });
    });
  }

  signOut() {
    this.props.dispatch(navigate(Views.LOGIN));
  }

  sendTokenToServer(token) {
    return fetch(
      `http://selenium.dyn.cs.washington.edu:5000/notificationToken?token=${token}`,
      {
        method: 'POST',
        crednetials: 'same-origin'
      }
    );
  }

  render() {
    return (
      <View>
        <Button title="Sign Out" onPress={this.signOut} />
        { this.state.notification === ''
          ? null
          : <Text selectable={true}>{this.state.notification}</Text>
        }
        <Text>Detected Beacon Instance: {this.state.beacon}</Text>
      </View>
    );
  }
}

export default connect()(Home);