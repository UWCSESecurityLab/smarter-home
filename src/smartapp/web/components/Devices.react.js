import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
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
    this.onDragEnd = this.onDragEnd.bind(this);
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

  onDragEnd(result) {
    let { source, destination } = result;
    if (!destination) {
      return;
    }
    if (source.droppableId === destination.droppableId) {
      this.props.dispatch(CommonActions.reorderDeviceInRoom(
        source.droppableId,
        source.index,
        destination.index
      ));
      // TODO: remote reorder
    } else {
      this.props.dispatch(CommonActions.moveDeviceBetweenRooms(
        source.droppableId,
        destination.droppableId,
        source.index,
        destination.index
      ));
      // TODO: remote move
    }
  }

  renderDevice(deviceId, index) {
    let status = null;
    if (this.props.homeConfig.contactSensors.includes(deviceId)) {
      status = <ContactSensorStatus deviceId={deviceId}/>
    } else if (this.props.homeConfig.switches.includes(deviceId)) {
      status = <SwitchStatus deviceId={deviceId}/>
    } else if (this.props.homeConfig.doorLocks.includes(deviceId)) {
      status = <LockStatus deviceId={deviceId}/>
    }

    return (
      <Draggable draggableId={deviceId} index={index} key={deviceId}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}>
            <DeviceListItem deviceId={deviceId}>
            {status}
            </DeviceListItem>
          </div>
        )}
      </Draggable>
    );
  }

  renderRoom(room) {
    let devices = room.devices.map((deviceId, index) => {
      return this.renderDevice(deviceId, index);
    });

    return (
      <Droppable droppableId={room.roomId} key={room.roomId}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <div className="room-label">{room.name}</div>
            {devices}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  }

  renderAllDevices() {
    let rooms = Object.values(this.props.rooms)
      .map((room) => this.renderRoom(room));
    return (
      <div>{rooms}</div>
    )
  }

  render() {
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
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
      </DragDropContext>
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