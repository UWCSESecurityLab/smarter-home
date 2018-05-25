import React from 'react';
import {
  Button,
  DeviceEventEmitter,
  ScrollView,
  StyleSheet,
  ToolbarAndroid,
  Text,
  View } from 'react-native';
import { connect } from 'react-redux';
import {
  navigate,
  Views
} from '../redux/actions';
import FCM, { FCMEvent } from 'react-native-fcm';
import PropTypes from 'prop-types';
import DeviceListItem from './DeviceList/DeviceListItem';
import SwitchStatus from './DeviceList/SwitchStatus';
import LockStatus from './DeviceList/LockStatus';
import ContactSensorStatus from './DeviceList/ContactSensorStatus';
import { CommonActions, SmartAppClient } from 'common';
import smartAppHost from '../getSmartAppHost';
import refreshIcon from '../ic_autorenew_white_24dp_2x.png';
console.log('smartAppHost = ' + smartAppHost);
const smartAppClient = new SmartAppClient(smartAppHost);
const BEACON_INSTANCE_ID = 'aabbccddeeff';

// Flattens |homeConfig|, an object of arrays, into a single array containing
// all the deviceIds of the devices in the home.
function getDeviceIds(homeConfig) {
  return Object.values(homeConfig).reduce((accumulator, current) => {
    return accumulator.concat(current)
  });
}

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
      .then((token) => smartAppClient.updateNotificationToken(token))
      .catch(console.error);

    FCM.on(FCMEvent.Notification, async (notification) => {
      let data = JSON.parse(notification.smartapp);
      let title = data.capability + ' ' + data.value;
      this.setState({ notification: title });
      smartAppClient.getDeviceStatus(data.deviceId)
        .then((newStatus) => {
          this.props.dispatch(
            CommonActions.updateDeviceStatus(newStatus.deviceId, newStatus.status));
        });
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

    smartAppClient.refreshAccessToken()
      .then(() => smartAppClient.getHomeConfig())
      .then((config) => {
        this.props.dispatch(CommonActions.updateHomeConfig(config));
        this.fetchAllDeviceDescriptions(config);
        this.fetchAllDeviceStatuses(config);
      }).catch((err) => {
        console.error(err);
        this.setState({ error: err });
      });
  }

  signOut() {
    this.props.dispatch(navigate(Views.LOGIN));
  }

  fetchAllDeviceDescriptions(homeConfig) {
    Promise.all(getDeviceIds(homeConfig).map((deviceId) => {
      return smartAppClient.getDeviceDescription(deviceId);
    })).then((descs) => {
      descs.forEach((desc) => {
        this.props.dispatch(CommonActions.updateDeviceDescription(desc.deviceId, desc));
      });
    });
  }

  fetchAllDeviceStatuses(homeConfig) {
    Promise.all(getDeviceIds(homeConfig).map((deviceId) => {
      return smartAppClient.getDeviceStatus(deviceId);
    })).then((statuses) => {
      statuses.forEach((status) => {
        this.props.dispatch(CommonActions.updateDeviceStatus(status.deviceId, status.status));
      });
    });
  }

  renderDoorLocks() {
    return this.props.homeConfig.doorLocks.map((lock) => {
      return (
        <DeviceListItem key={lock} deviceId={lock}>
          <LockStatus deviceId={lock}/>
        </DeviceListItem>
      );
    });
  }

  renderSwitches() {
    return this.props.homeConfig.switches.map((switch_) => {
      return (
        <DeviceListItem key={switch_} deviceId={switch_}>
          <SwitchStatus deviceId={switch_}/>
        </DeviceListItem>
      );
    });
  }

  renderContactSensors() {
    return this.props.homeConfig.contactSensors.map((contactSensor) => {
      return (
        <DeviceListItem key={contactSensor} deviceId={contactSensor}>
          <ContactSensorStatus deviceId={contactSensor}/>
        </DeviceListItem>
      );
    });
  }

  render() {
    return (
      <View>
        <ToolbarAndroid
          title={'SmarterHome'}
          titleColor="#ffffff"
          actions={[{
            title: 'Refresh',
            icon: refreshIcon,
            show: 'always',
            showWithText: false
          }]}
          onActionSelected={smartAppClient.refreshAccessToken}
          style={styles.toolbar}/>
        { this.props.homeConfig
          ? <ScrollView>
              {this.renderDoorLocks()}
              {this.renderSwitches()}
              {this.renderContactSensors()}
            </ScrollView>
          : null }
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
  deviceDesc: PropTypes.object,
  deviceStatus: PropTypes.object,
  dispatch: PropTypes.func,
  homeConfig: PropTypes.object
};

const mapStateToProps = (state) => {
  return {
    deviceDesc: state.devices.deviceDesc,
    deviceStatus: state.devices.deviceStatus,
    homeConfig: state.devices.homeConfig
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
    fontSize: 18,
    marginLeft: 20
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