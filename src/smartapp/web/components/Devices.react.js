import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { CommonActions, SmartAppClient } from 'common';
import ContactSensorStatus from './DeviceList/ContactSensorStatus.react';
import DeviceListItem from './DeviceList/DeviceListItem.react';
import LockStatus from './DeviceList/LockStatus.react';
import SwitchStatus from './DeviceList/SwitchStatus.react';

const smartAppClient = new SmartAppClient('http://localhost:5000');

// Flattens |homeConfig|, an object of arrays, into a single array containing
// all the deviceIds of the devices in the home.
function getDeviceIds(homeConfig) {
  return Object.values(homeConfig).reduce((accumulator, current) => {
    return accumulator.concat(current)
  });
}

class Devices extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  componentDidMount() {
    smartAppClient.refreshAccessToken()
      // Fetch home config
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

  fetchAllDeviceDescriptions(homeConfig) {
    Promise.all(getDeviceIds(homeConfig).map((deviceId) => {
      return smartAppClient.getDeviceDescription(deviceId);
    })).then((descs) => {
      console.log(descs);
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
      <section>
        <div className="devices-header">
          <h3>My Home</h3>
          <button className="btn btn-green" id="edit-rooms">Edit Rooms</button>
        </div>
        { this.props.homeConfig
          ? <div>
              {this.renderDoorLocks()}
              {this.renderSwitches()}
              {this.renderContactSensors()}
            </div>
          : null
        }
      </section>
    );
  }
}

Devices.propTypes = {
  deviceDesc: PropTypes.object,
  deviceStatus: PropTypes.object,
  dispatch: PropTypes.func,
  homeConfig: PropTypes.object
}

function mapStateToProps(state) {
  return {
    deviceDesc: state.devices.deviceDesc,
    deviceStatus: state.devices.deviceStatus,
    homeConfig: state.devices.homeConfig
  };
}
export default connect(mapStateToProps)(Devices);