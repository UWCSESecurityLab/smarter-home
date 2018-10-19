import React from 'react';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import toastError from '../lib/error-toaster';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as Flags from '../../flags';
import * as Actions from '../redux/actions';
import SmartAppClient from '../lib/SmartAppClient';

const smartAppClient = new SmartAppClient();

class ActivityNotificationSettings extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.renderDevicePrefs = this.renderDevicePrefs.bind(this);
    this.renderRoom = this.renderRoom.bind(this);
    this.allPrefsAreTheSame = this.allPrefsAreTheSame.bind(this);
  }

  onChange(id, prefs) {
    smartAppClient.updateNotificationPrefs(
      Object.assign({}, this.props.notificationPrefs, { [id]: prefs })
    ).then(() => {
      this.props.dispatch(Actions.changeNotificationPref(id, prefs));
    }).catch(toastError);
  }

  onRoomChange(roomId, prefs) {
    const newPrefs = Object.assign({}, this.props.notificationPrefs);
    this.props.rooms[roomId].devices.forEach((deviceId) => {
      newPrefs[deviceId] = prefs;
    });
    smartAppClient.updateNotificationPrefs(newPrefs).then(() => {
      this.props.dispatch(Actions.setNotificationPrefs(newPrefs));
    }).catch(toastError);
  }

  renderRoom(room) {
    return (
      <div key={room.roomId}>
        <div className="room-label">{room.name}</div>
        <table className="settings-table">
          <thead>
            <tr>
              <th className="activity-device-label">Device</th>
              <th>On</th>
              <th>On, if nearby</th>
              <th className="settings-last">Off</th>
            </tr>
          </thead>
          <tbody>
            { this.renderRoomToggle(room) }
            { room.devices.map(this.renderDevicePrefs) }
          </tbody>
        </table>
      </div>
    );
  }

  allPrefsAreTheSame(room, prefType) {
    return room.devices
      .map((deviceId) => this.props.notificationPrefs[deviceId])
      .every((pref) => pref === prefType);
  }

  renderRoomToggle(room) {
    return (
      <tr>
        <td className="activity-device-label"><i>All Devices</i></td>
        <td>
          <div className="mdc-form-field">
            <div className="mdc-radio activity-radio">
              <input className="mdc-radio__native-control"
                     type="radio"
                     id={Flags.ActivityNotifications.ON}
                     name={room.roomId}
                     checked={this.allPrefsAreTheSame(room, Flags.ActivityNotifications.ON)}
                     onChange={() => this.onRoomChange(room.roomId, Flags.ActivityNotifications.ON)}/>
              <div className="mdc-radio__background">
                <div className="mdc-radio__outer-circle"></div>
                <div className="mdc-radio__inner-circle"></div>
              </div>
            </div>
          </div>
        </td>
        <td>
          <div className="mdc-form-field">
            <div className="mdc-radio activity-radio">
              <input className="mdc-radio__native-control"
                     type="radio"
                     id={Flags.ActivityNotifications.PROXIMITY}
                     name={room.roomId}
                     checked={this.allPrefsAreTheSame(room, Flags.ActivityNotifications.PROXIMITY)}
                     onChange={() => this.onRoomChange(room.roomId, Flags.ActivityNotifications.PROXIMITY)}/>
              <div className="mdc-radio__background">
                <div className="mdc-radio__outer-circle"></div>
                <div className="mdc-radio__inner-circle"></div>
              </div>
            </div>
          </div>
        </td>
        <td className="settings-last">
          <div className="mdc-form-field">
            <div className="mdc-radio activity-radio">
              <input className="mdc-radio__native-control"
                     type="radio"
                     id={Flags.ActivityNotifications.OFF}
                     name={room.roomId}
                     checked={this.allPrefsAreTheSame(room, Flags.ActivityNotifications.OFF)}
                     onChange={() => this.onRoomChange(room.roomId, Flags.ActivityNotifications.OFF)}/>
              <div className="mdc-radio__background">
                <div className="mdc-radio__outer-circle"></div>
                <div className="mdc-radio__inner-circle"></div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  renderDevicePrefs(deviceId) {
    let name = '';
    if (this.props.deviceDesc[deviceId]) {
      if (this.props.deviceDesc[deviceId].deviceTypeName === 'beacon') {
        return null;
      }
      name = this.props.deviceDesc[deviceId].label
        ? this.props.deviceDesc[deviceId].label
        : this.props.deviceDesc[deviceId].name;
    }


    let prefs = this.props.notificationPrefs[deviceId];
    return (
      <tr key={deviceId}>
        <td className="activity-device-label">{name}</td>
        <td>
          <div className="mdc-form-field">
            <div className="mdc-radio activity-radio">
              <input className="mdc-radio__native-control"
                     type="radio"
                     id={Flags.ActivityNotifications.ON}
                     name={deviceId}
                     checked={prefs === Flags.ActivityNotifications.ON}
                     onChange={() => this.onChange(deviceId, Flags.ActivityNotifications.ON)}/>
              <div className="mdc-radio__background">
                <div className="mdc-radio__outer-circle"></div>
                <div className="mdc-radio__inner-circle"></div>
              </div>
            </div>
          </div>
        </td>
        <td>
          <div className="mdc-form-field">
            <div className="mdc-radio activity-radio">
              <input className="mdc-radio__native-control"
                     type="radio"
                     id={Flags.ActivityNotifications.PROXIMITY}
                     name={deviceId}
                     checked={prefs === Flags.ActivityNotifications.PROXIMITY}
                     onChange={() => this.onChange(deviceId, Flags.ActivityNotifications.PROXIMITY)}/>
              <div className="mdc-radio__background">
                <div className="mdc-radio__outer-circle"></div>
                <div className="mdc-radio__inner-circle"></div>
              </div>
            </div>
          </div>
        </td>
        <td className="settings-last">
          <div className="mdc-form-field">
            <div className="mdc-radio activity-radio">
              <input className="mdc-radio__native-control"
                     type="radio"
                     id={Flags.ActivityNotifications.OFF}
                     name={deviceId}
                     checked={prefs === Flags.ActivityNotifications.OFF}
                     onChange={() => this.onChange(deviceId, Flags.ActivityNotifications.OFF)}/>
              <div className="mdc-radio__background">
                <div className="mdc-radio__outer-circle"></div>
                <div className="mdc-radio__inner-circle"></div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  render() {
    return (
      <div className="home-item">
        <div className="settings-padding" style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/notificationSettings" className="link-plain">
            <MaterialIcon icon="arrow_back" className="back-arrow" hasRipple/>
          </Link>
          <h3>Activity Notifications</h3>
        </div>
        <p className="settings-padding">
          Get notifications when devices in your home change.
        </p>
        { Object.values(this.props.rooms).map((room) => this.renderRoom(room)) }
      </div>
    );
  }
}

ActivityNotificationSettings.propTypes = {
  deviceDesc: PropTypes.object,
  dispatch: PropTypes.func,
  notificationPrefs: PropTypes.object,
  rooms: PropTypes.object,
}

const mapStateToProps = (state) => {
  return {
    deviceDesc: state.devices.deviceDesc,
    notificationPrefs: state.notificationPrefs,
    rooms: state.devices.rooms,
  }
}

export default connect(mapStateToProps)(ActivityNotificationSettings);