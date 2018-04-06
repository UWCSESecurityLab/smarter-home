import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { CommonActions, SmartAppClient } from 'common';
import ContactSensorStatus from './DeviceList/ContactSensorStatus.react';
import DeviceListItem from './DeviceList/DeviceListItem.react';
import LockStatus from './DeviceList/LockStatus.react';
import SwitchStatus from './DeviceList/SwitchStatus.react';

const smartAppClient = new SmartAppClient('http://localhost:5000');

class Devices extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.updateAllDevices = this.updateAllDevices.bind(this);
  }

  componentDidMount() {
    smartAppClient.refreshAccessToken()
      .then(() => smartAppClient.getDeviceDescriptions())
      .then((descriptions) => {
        this.props.dispatch(CommonActions.updateDeviceDescription(descriptions))
      }).then(this.updateAllDevices)
      .catch((err) => {
        console.error(err);
        this.setState({ error: err });
      });
  }

  updateAllDevices() {
    let statusRequests = [];
    for (let deviceType in this.props.deviceDescs) {
      for (let device of this.props.deviceDescs[deviceType]) {
        statusRequests.push(smartAppClient.getDeviceStatus(device.deviceId))
      }
    }

    Promise.all(statusRequests).then((statuses) => {
      statuses.forEach((status) => {
        this.props.dispatch(CommonActions.updateDeviceStatus(status.deviceId, status.status));
      });
    });
  }

  renderDoorLocks() {
    return this.props.deviceDescs.doorLock.map((lock) => {
      return (
        <DeviceListItem key={lock.deviceId} deviceDesc={lock}>
          <LockStatus deviceDesc={lock}/>
        </DeviceListItem>
      );
    });
  }

  renderSwitches() {
    return this.props.deviceDescs.switches.map((switch_) => {
      return (
        <DeviceListItem key={switch_.deviceId} deviceDesc={switch_}>
          <SwitchStatus deviceDesc={switch_}/>
        </DeviceListItem>
      );
    });
  }

  renderContactSensors() {
    return this.props.deviceDescs.contactSensors.map((contactSensor) => {
      return (
        <DeviceListItem key={contactSensor.deviceId} deviceDesc={contactSensor}>
          <ContactSensorStatus deviceDesc={contactSensor}/>
        </DeviceListItem>
      );
    });
  }

  render() {
    return (
      <section>
        <h3>My Home</h3>
        {this.renderDoorLocks()}
        {this.renderSwitches()}
        {this.renderContactSensors()}
      </section>
    );
  }
}

Devices.propTypes = {
  deviceDescs: PropTypes.object,
  deviceStatus: PropTypes.object,
  dispatch: PropTypes.func
}

function mapStateToProps(state) {
  return {
    deviceDescs: state.devices.deviceDescs,
    deviceStatus: state.devices.deviceStatus
  };
}
export default connect(mapStateToProps)(Devices);