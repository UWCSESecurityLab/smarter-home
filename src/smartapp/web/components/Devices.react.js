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
      .then(() => {
        // Fetch rooms and homeConfig, in parallel
        this.fetchRooms();
        return smartAppClient.getHomeConfig();
      }).then((config) => {
        // Once homeConfig has been fetched, fetch device descs and statuses
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

  fetchRooms() {
    smartAppClient.getRooms().then((rooms) => {
      this.props.dispatch(CommonActions.addRooms(rooms.map((room) => {
         return { [room.roomId]: room }
      })));
    });
  }

  renderDevice(deviceId) {
    let status = null;
    if (this.props.homeConfig.contactSensors.includes(deviceId)) {
      status = <ContactSensorStatus deviceId={deviceId}/>
    } else if (this.props.homeConfig.switches.includes(deviceId)) {
      status = <SwitchStatus deviceId={deviceId}/>
    } else if (this.props.homeConfig.doorLocks.includes(deviceId)) {
      status = <LockStatus deviceId={deviceId}/>
    }

    return (
      <DeviceListItem key={deviceId} deviceId={deviceId}>
        {status}
      </DeviceListItem>
    );
  }

  renderRoom(room) {
    let devices = room.devices.map((deviceId) => {
      return this.renderDevice(deviceId);
    });

    return (
      <div>
        <div className="room-label" key={room.roomId}>{room.name}</div>
        {devices}
      </div>
    );
  }

  renderAllDevices() {
    let rooms = Object.values(this.props.rooms).map((room) => this.renderRoom(room));
    let devicesInRooms = Object.values(this.props.rooms).length > 0
      ? Object.values(this.props.rooms)
          .map((room) => room.devices)
          .reduce((accumulator, devices) => accumulator.concat(devices))
      : [];

    let allDevices = getDeviceIds(this.props.homeConfig);
    let unorganizedDevices = allDevices.filter((deviceId) => {
      return !devicesInRooms.includes(deviceId);
    });
    rooms.push(this.renderRoom({
      name: 'Unorganized Devices',
      devices: unorganizedDevices,
      roomId: 'Unorganized'
    }));
    return (
      <div>{rooms}</div>
    )
  }

  render() {
    return (
      <section>
        <div className="devices-header">
          <h3>My Home</h3>
          <button className="btn btn-green" id="edit-rooms">Edit Rooms</button>
        </div>
        { Object.keys(this.props.homeConfig).length > 0
          ? this.renderAllDevices()
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
  homeConfig: PropTypes.object,
  rooms: PropTypes.object
}

function mapStateToProps(state) {
  return {
    deviceDesc: state.devices.deviceDesc,
    deviceStatus: state.devices.deviceStatus,
    homeConfig: state.devices.homeConfig,
    rooms: state.devices.rooms,
  };
}
export default connect(mapStateToProps)(Devices);