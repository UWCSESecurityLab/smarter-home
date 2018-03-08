import React from 'react';
import { Button, DeviceEventEmitter, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { navigate, Views } from '../redux/actions';
import FCM, { FCMEvent } from 'react-native-fcm';

const BEACON_INSTANCE_ID = 'aabbccddeeff';

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = { notification: '', beacon: false };
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
      let data = JSON.parse(notification.smartapp);
      let title = data.capability + ' ' + data.value;
      this.setState({ notification: title });
    });

    DeviceEventEmitter.addListener('eddystoneDidAppear', ({ eddystone, namespace }) => {
      if (eddystone.instanceId === BEACON_INSTANCE_ID) {
        console.log('Beacon appeared');
        this.setState({ beacon: true });
      }
    });

    DeviceEventEmitter.addListener('eddystoneDidDisappear', ({ eddystone, namespace }) => {
      if (eddystone.instanceId === BEACON_INSTANCE_ID) {
        console.log('Beacon disappeared');
        this.setState({ beacon: false });
      }
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
          : <Text style={{marginTop: 20, fontSize: 24}}>
              Received notification: {this.state.notification}
            </Text>
        }
        <Text style={{marginTop: 20, fontSize: 18, marginLeft: 20}}>
          Beacon Nearby? {this.state.beacon ? 'Yes' : 'No'}
        </Text>
      </View>
    );
  }
}

export default connect()(Home);