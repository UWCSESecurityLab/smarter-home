import React from 'react';
import { Button, DeviceEventEmitter, StyleSheet, ToolbarAndroid, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { navigate, Views, updateDeviceDescription } from '../redux/actions';
import FCM, { FCMEvent } from 'react-native-fcm';
import PropTypes from 'prop-types';

const BEACON_INSTANCE_ID = 'aabbccddeeff';

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = { notification: '', beacon: false, error: '' };
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

    this.getDeviceDescription()
      .then((response) => response.json())
      .then((descriptions) => {
        this.props.dispatch(updateDeviceDescription(descriptions))
      }).catch((err) => {
        this.setState({ error: err });
      });
  }

  signOut() {
    this.props.dispatch(navigate(Views.LOGIN));
  }

  sendTokenToServer(token) {
    return fetch(
      `http://10.0.2.2:5000/notificationToken?token=${token}`,
      {
        method: 'POST',
        crednetials: 'same-origin'
      }
    );
  }

  getDeviceDescription() {
    return fetch('http://10.0.2.2:5000/dashboard');
  }

  renderDoorLocks() {
    return this.props.device_descs.doorLock.map((lock) => {
      return (
        <View style={styles.device} key={lock.deviceId}>
          <Text style={styles.deviceName}>{lock.label}</Text>
        </View>
      );
    });
  }

  renderSwitches() {
    return this.props.device_descs.switches.map((switch_) => {
      return (
        <View style={styles.device} key={switch_.deviceId}>
          <Text style={styles.deviceName}>{switch_.label}</Text>
        </View>
      );
    });
  }

  render() {
    return (
      <View>
        <ToolbarAndroid title={'SmarterHome'} titleColor="#ffffff" style={styles.toolbar}/>
        {this.renderDoorLocks()}
        {this.renderSwitches()}
        { this.state.notification === ''
          ? null
          : <Text style={styles.notification}>
              Received notification: {this.state.notification}
            </Text>
        }
        <Text style={styles.beacon}>
          Beacon Nearby? {this.state.beacon ? 'Yes' : 'No'}
        </Text>

        { this.state.error
          ? <Text style={{ color: 'red'}}>{this.state.error.toString()}</Text>
          : null }
        <View style={styles.signout}>
          <Button title="Sign Out" onPress={this.signOut}/>
        </View>
      </View>
    );
  }
}

Home.propTypes = {
  device_descs: PropTypes.object,
  dispatch: PropTypes.func
};

const mapStateToProps = (state) => {
  return {
    device_descs: state.device_descs
  }
};

const styles = StyleSheet.create({
  toolbar: {
    backgroundColor: '#2196F3',
    height: 56,
    alignSelf: 'stretch',
    textAlign: 'center'
  },
  notification: {
    marginTop: 20,
    fontSize: 24
  },
  beacon: {
    marginTop: 20,
    fontSize: 18,
    marginLeft: 20
  },
  device: {
    borderBottomColor: '#bbb',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 20,
    paddingRight: 20,
  },
  deviceName: {
    fontSize: 18
  },
  signout: {
    marginTop: 20,
    marginLeft: 40,
    marginRight: 40
  }
});

export default connect(mapStateToProps)(Home);