import React from 'react';
import Button from '@material/react-button';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import uuid from 'uuid/v4';

import { CommonActions, SmartAppClient } from 'common';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import ContactSensorStatus from './DeviceList/ContactSensorStatus.react';
import BeaconStatus from './DeviceList/BeaconStatus.react';
import DeviceListItem from './DeviceList/DeviceListItem.react';
import HomeState from '../lib/home-state';
import LockStatus from './DeviceList/LockStatus.react';
import SwitchStatus from './DeviceList/SwitchStatus.react';

import '../css/devices.scss';

const smartAppClient = new SmartAppClient();

class Devices extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      edit: false,
      error: '',
    }

    this.addBeacon = this.addBeacon.bind(this);
    this.addRoom = this.addRoom.bind(this);
    this.deleteBeacon = this.deleteBeacon.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onRoomNameChange = this.onRoomNameChange.bind(this);
    this.removeRoom = this.removeRoom.bind(this);
  }

  componentDidMount() {
    this.setState({error: '', edit: false});
  }

  componentWillUnmount() {
    clearInterval(this.state.pollInterval);
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

  removeRoom(roomId) {
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

  addBeacon() {
    this.props.history.push(this.props.history.location.pathname + '/addBeacon');
  }

  deleteBeacon(beaconName) {
    smartAppClient.removeBeacon(beaconName).then(() => {
      return HomeState.resetDevices();
    }).catch((err) => {
      console.error(err);
    });
  }

  renderDevice(deviceId, index) {
    let status = null;
    if (this.props.homeConfig.contactSensors.includes(deviceId)) {
      status = <ContactSensorStatus deviceId={deviceId}/>
    } else if (this.props.homeConfig.switches.includes(deviceId)) {
      status = <SwitchStatus deviceId={deviceId}/>
    } else if (this.props.homeConfig.doorLocks.includes(deviceId)) {
      status = <LockStatus deviceId={deviceId}/>
    } else if (this.props.deviceDesc[deviceId] &&
               this.props.deviceDesc[deviceId].deviceTypeName === 'beacon') {
      if (this.state.edit) {
        status = <MaterialIcon icon="clear" hasRipple
                               className={'beacon-remove'}
                               onClick={() => {this.deleteBeacon(deviceId)}}/>
      } else {
        status = <BeaconStatus deviceId={deviceId}/>
      }
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
                    <MaterialIcon hasRipple icon="clear"
                      style={{ color: '#3c98ca' }}
                      name={room.roomId}
                      onClick={() => this.removeRoom(room.roomId)}/>
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

  renderHeader() {
    if (this.state.edit) {
      return (
        <div className="devices-header-edit">
          <Button onClick={this.addRoom} className="devices-header-button"
                  icon={<MaterialIcon icon="home"/>}>
            Add Room
          </Button>
          <Button onClick={this.addBeacon} className="devices-header-button"
                  icon={<MaterialIcon icon="wifi_tethering"/>}>
            Add Beacon
          </Button>
          <Button className="mdc-button-green devices-header-button"
                  onClick={() => { this.setState({ edit: false })}}>
            Done
          </Button>
        </div>
      );
    } else {
      return (
        <div className="devices-header">
          <h3 className="devices-heading">My Home</h3>
          <Button className="mdc-button-green" id="edit-rooms"
                  onClick={() => { this.setState({ edit: true }) }}>
            Configure
          </Button>
        </div>
      );
    }
  }

  render() {
    return (
      <div>
        <DragDropContext onDragEnd={this.onDragEnd}>
          <section className="home-item">
            {this.renderHeader()}
            { this.state.error !== ''
              ? <div>
                  <div id="error-exclamation">!</div>
                  <div id="error-msg">
                    Error: This account is not linked to a home
                  </div>
                </div>
              : null
            }

            { Object.keys(this.props.homeConfig).length > 0
              ? this.renderAllDevices()
              : null
            }
          </section>
        </DragDropContext>
      </div>
    );
  }
}

Devices.propTypes = {
  deviceDesc: PropTypes.object,
  deviceStatus: PropTypes.object,
  dispatch: PropTypes.func,
  history: PropTypes.object,
  homeConfig: PropTypes.object,
  nearbyBeacons: PropTypes.object,
  rooms: PropTypes.object
}

function mapStateToProps(state) {
  return {
    deviceDesc: state.devices.deviceDesc,
    deviceStatus: state.devices.deviceStatus,
    homeConfig: state.devices.homeConfig,
    nearbyBeacons: state.nearbyBeacons,
    rooms: state.devices.rooms
  };
}
export default withRouter(connect(mapStateToProps)(Devices));