import React from 'react';
import {
  Button,
  DeviceEventEmitter,
  StyleSheet,
  ToolbarAndroid, Text, View } from 'react-native';
import { connect } from 'react-redux';
import {
  navigate,
  Views,
  updateDeviceDescription,
  updateDeviceStatus
} from '../redux/actions';
import FCM, { FCMEvent } from 'react-native-fcm';
import PropTypes from 'prop-types';
import DeviceListItem from './DeviceListItem';
import ORIGIN from '../origin';

const BEACON_INSTANCE_ID = 'aabbccddeeff';

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = { notification: '', beacon: false, error: '' };

    this.signOut = this.signOut.bind(this);
    this.updateAllDevices = this.updateAllDevices.bind(this);
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
      this.updateAllDevices();
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

    this.refreshToken()
      .then(this.getDeviceDescriptions)
      .then((response) => response.json())
      .then((descriptions) => {
        this.props.dispatch(updateDeviceDescription(descriptions))
      }).then(this.updateAllDevices)
      .catch((err) => {
        console.error(err);
        this.setState({ error: err });
      });

  }

  signOut() {
    this.props.dispatch(navigate(Views.LOGIN));
  }

  sendTokenToServer(token) {
    return fetch(`${ORIGIN}/notificationToken?token=${token}`, {
      method: 'POST',
      credentials: 'same-origin'
    });
  }

  getDeviceDescriptions() {
    return fetch(`${ORIGIN}/deviceDescriptions`, {
      credentials: 'same-origin'
    });
  }

  updateAllDevices() {
    let statusRequests = [];
    for (let deviceType in this.props.deviceDescs) {
      for (let device of this.props.deviceDescs[deviceType]) {
        statusRequests.push(this.getDeviceStatus(device.deviceId))
      }
    }

    Promise.all(statusRequests)
      .then((responses) => {
        return Promise.all(responses.map((response) => response.json()))
      }).then((statuses) => {
        statuses.forEach((status) => {
          this.props.dispatch(updateDeviceStatus(status.deviceId, status.status));
        });
    });
  }

  getDeviceStatus(deviceId) {
    return fetch(
      `${ORIGIN}/devices/${deviceId}/status`, {
        credentials: 'same-origin'
      });
  }

  refreshToken() {
    return fetch(`${ORIGIN}/refresh`, {
      credentials: 'same-origin'
    });
  }

  renderDoorLocks() {
    return this.props.deviceDescs.doorLock.map((lock) => {
      return (
        <DeviceListItem
          key={lock.deviceId}
          capability={'lock'}
          activeState={'unlocked'}
          deviceDesc={lock} />
      );
    });
  }

  renderSwitches() {
    return this.props.deviceDescs.switches.map((switch_) => {
      return (
        <DeviceListItem
          key={switch_.deviceId}
          capability={'switch'}
          activeState={'on'}
          deviceDesc={switch_} />
      );
    });
  }

  render() {
    return (
      <View>
        <ToolbarAndroid
          title={'SmarterHome'}
          titleColor="#ffffff"
          style={styles.toolbar}/>
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
          ? <Text style={{ color: 'red'}}>{this.state.error.stack}</Text>
          : null }
        <View style={styles.signout}>
          <Button title="Sign Out" onPress={this.signOut}/>
        </View>
      </View>
    );
  }
}

Home.propTypes = {
  deviceDescs: PropTypes.object,
  deviceStatus: PropTypes.object,
  dispatch: PropTypes.func
};

const mapStateToProps = (state) => {
  return {
    deviceDescs: state.deviceDescs,
    deviceStatus: state.deviceStatus
  }
};

const styles = StyleSheet.create({
  toolbar: {
    backgroundColor: '#2196F3',
    height: 56,
    alignSelf: 'stretch',
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
  signout: {
    marginTop: 20,
    marginHorizontal: 40
  },
});

export default connect(mapStateToProps)(Home);