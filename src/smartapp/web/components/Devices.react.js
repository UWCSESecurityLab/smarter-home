import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { CommonActions, SmartAppClient } from 'common';
import ContactSensorStatus from './DeviceList/ContactSensorStatus.react';
import DeviceListItem from './DeviceList/DeviceListItem.react';
import LockStatus from './DeviceList/LockStatus.react';
import MaterialIcon from '@material/react-material-icon';
import SwitchStatus from './DeviceList/SwitchStatus.react';
import uuid from 'uuid/v4';

const smartAppClient = new SmartAppClient();

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
    this.state = {
      edit: false,
      error: ''
    }
    this.addRoom = this.addRoom.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onRoomNameChange = this.onRoomNameChange.bind(this);
    this.removeRoom = this.removeRoom.bind(this);
  }

  componentDidMount() {
    this.setState({error: '', edit: false});
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
        if (err.error == 'USER_NOT_LINKED') {
          this.setState({ error: 'SmarterThings is not linked to a home!' });
        }
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
      this.props.dispatch(CommonActions.setRooms(rooms.map((room) => {
         return { [room.roomId]: room }
      })));
    });
  }

  addRoom() {
    const name = 'New Room'
    const roomId = uuid();
    this.props.dispatch(CommonActions.addRoom({
      [roomId]: {
        installedAppId: null,
        roomId: roomId,
        name: name,
        beaconNamespace: null,
        devices: []
      }
    }));
    smartAppClient.createRoom(name, roomId).catch((err) => {
      console.error(err);
      // TODO: display error
      this.fetchRooms();
    });
  }

  removeRoom(e) {
    const roomId = e.target.name;
    this.props.dispatch(CommonActions.removeRoom(roomId));
    smartAppClient.deleteRoom(roomId).catch((err) => {
      console.error(err);
      // TODO: display error
      this.fetchRooms();
    });
  }

  onRoomNameChange(e) {
    const roomId = e.target.name;
    const newName = e.target.value;
    this.props.dispatch(CommonActions.updateRoomName(roomId, newName));
    smartAppClient.updateRoomName(roomId, newName).catch((err) => {
      console.error(err);
      // TODO: display error
      this.fetchRooms();
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
      smartAppClient.reorderDeviceInRoom(
        source.droppableId,
        source.index,
        destination.index
      ).catch((err) => {
        console.error(err);
        // TODO: display error
        this.fetchRooms();
      });

    } else {
      this.props.dispatch(CommonActions.moveDeviceBetweenRooms(
        source.droppableId,
        destination.droppableId,
        source.index,
        destination.index
      ));
      smartAppClient.moveDeviceBetweenRooms(
        source.droppableId,
        destination.droppableId,
        source.index,
        destination.index
      ).catch((err) => {
        console.error(err);
        // TODO: display error
        this.fetchRooms();
      });
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
      <Draggable draggableId={deviceId} index={index} key={deviceId}
                 isDragDisabled={!this.state.edit}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}>
            <DeviceListItem deviceId={deviceId} draggable={this.state.edit}>
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
            { this.state.edit
              ? <div className="room-label">
                  <input name={room.roomId}
                         value={room.name}
                         onChange={this.onRoomNameChange}
                         className="room-label-edit">
                  </input>
                  { room.default ? null :
                    <button className="btn-transparent-round" onClick={this.removeRoom} name={room.roomId}>
                      <MaterialIcon icon="clear"/>
                      <span className="btn-hover-expand">Remove</span>
                    </button>
                  }
                </div>
              : <div className="room-label">{room.name}</div>
            }
            { devices.length > 0
              ? devices
              : <div>&nbsp;</div>
            }
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
    let headerButtons;
    if (this.state.edit) {
      headerButtons = (
        <div>
          <button className="btn btn-green"
                  onClick={this.addRoom}>
            Add +
          </button>
          <button className="btn btn-green"
                  onClick={() => { this.setState({ edit: false })}}>
            Done Editing
          </button>
        </div>
      );
    } else {
      headerButtons = (
        <button className="btn btn-green" id="edit-rooms"
                onClick={() => { this.setState({ edit: true }) }}>
          Edit Rooms
        </button>
      );
    }

    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <section className="home-item">
          <div className="devices-header">
            <h3>My Home</h3>
            { headerButtons }
          </div>
          { this.state.error !== ''
            ? <div>
                <div id="error-exclamation">!</div>
                <div id="error-msg">Error: This account is not linked to a home</div>
              </div>
            : null
          }

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