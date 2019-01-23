import React from 'react';
import Capability from '../lib/capabilities/Capability';
import Checkbox from './Checkbox.react';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import Radio from './Radio.react';
import Roles from '../../roles';
import SmartAppClient from '../lib/SmartAppClient';
import strToColor from '../lib/strToColor';
import toastError from '../lib/error-toaster';
import * as Actions from '../redux/actions';
import { ActivityNotifications } from '../../flags';
import { connect } from 'react-redux';
import { notify as toast } from 'react-notify-toast';
import { Link, Route, Switch, withRouter } from 'react-router-dom';
import { LocationRestrictions, ParentalRestrictions } from '../../permissions';

const smartAppClient = new SmartAppClient();

const NotificationStrings = {
  [ActivityNotifications.ON]: 'On',
  [ActivityNotifications.PROXIMITY]: 'On if nearby',
  [ActivityNotifications.OFF]: 'Off'
}

const LocationRestrictionsStrings = {
  [LocationRestrictions.NEARBY]: 'Control if nearby, otherwise ask someone nearby',
  [LocationRestrictions.AT_HOME]: 'Control if at home, otherwise ask someone at home',
  [LocationRestrictions.ANYWHERE]: 'Control from anywhere'
}

const UserRestrictionsStrings = {
  [ParentalRestrictions.ALLOW_IF_NEARBY]: 'Allow, if an owner is nearby, otherwise ask an owner',
  [ParentalRestrictions.ALWAYS_ASK]: 'Ask an owner (via a notification)',
  [ParentalRestrictions.DENY]: 'Block'
}

const UserRestrictionsSubtitleStrings = {
  [ParentalRestrictions.ALLOW_IF_NEARBY]: 'Everyone else can control this device if an owner is nearby',
  [ParentalRestrictions.ALWAYS_ASK]: 'Everyone else must ask an owner to control this device',
  [ParentalRestrictions.DENY]: 'Nobody else can control this device'
}

class DeviceModal extends React.Component {
  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
    this.changeCheckbox = this.changeCheckbox.bind(this);
    this.changeRadio = this.changeRadio.bind(this);
    this.changeLocationRadio = this.changeLocationRadio.bind(this);
    this.changeNotificationRadio = this.changeNotificationRadio.bind(this);
    this.renderBatteryStatus = this.renderBatteryStatus.bind(this);
    this.renderLocationRestrictions = this.renderLocationRestrictions.bind(this);
    this.renderUserLocationRestrictions = this.renderUserLocationRestrictions.bind(this);
    this.renderNotifications = this.renderNotifications.bind(this);
    this.renderTemperature = this.renderTemperature.bind(this);
  }

  close() {
    this.props.history.push(
      this.props.history.location.pathname.split('/device/')[0]);
  }

  renderStatus(name, value) {
    return (
      <div className="device-modal-item">
        <span>{name}</span>
        <span>{value}</span>
      </div>
    )
  }

  renderBatteryStatus() {
    const batteryStatus = this.props.status.components.main.battery;
    if (batteryStatus) {
      return this.renderStatus('Battery Level', `${batteryStatus.battery.value}%`);
    }
  }

  renderSwitchStatus() {
    const switchStatus = this.props.status.components.main.switch;
    if (switchStatus) {
      return this.renderStatus('Switch', switchStatus.switch.value);
    }
  }
  renderLockStatus() {
    const lockStatus = this.props.status.components.main.lock;
    if (lockStatus) {
      return this.renderStatus('Lock', lockStatus.lock.value);
    }
  }

  renderContactStatus() {
    const contactStatus = this.props.status.components.main.contactSensor;
    if (contactStatus) {
      return this.renderStatus('Contact Sensor', contactStatus.contact.value);
    }
  }

  renderMotionSensorStatus() {
    const motionSensorStatus = this.props.status.components.main.motionSensor;
    if (motionSensorStatus) {
      return this.renderStatus('Motion Sensor', motionSensorStatus.motion.value);
    }
  }

  renderBeaconStatus() {
    if (this.props.desc.deviceTypeName !== 'beacon') {
      return null;
    }
    if (!window.cordova) {
      return this.renderStatus('Beacon', 'Only available in the mobile app')
    }
    return this.renderStatus(
      'Beacon',
      this.props.nearbyBeacons[this.props.match.params.deviceId] ? 'Nearby' : 'Not Nearby'
    );
  }

  renderTemperature() {
    const temperature = this.props.status.components.main.temperatureMeasurement;
    if (temperature) {
      return this.renderStatus(
        'Temperature',
        temperature.temperature.value + temperature.temperature.unit
      );
    }
  }

  changeRadio(permission, value) {
    const params = {
      deviceId: this.props.match.params.deviceId,
      [permission]: value
    };

    smartAppClient.modifyPermission(params).then(() => {
      this.props.dispatch(Actions.updatePermission(params));
    }).catch(toastError);
  }

  changeCheckbox(_, userId) {
    const deviceId = this.props.match.params.deviceId;
    const addOwner = !this.props.permissions.owners.includes(userId);
    if (!addOwner && this.props.permissions.owners.length === 1) {
      toast.show('You can\'t remove the last owner!', 'error');
      return;
    }

    smartAppClient.modifyPermission({
      deviceId: deviceId,
      addOwner: addOwner ? userId : undefined,
      removeOwner: addOwner ? undefined: userId
    }).then(() => {
      if (addOwner) {
        this.props.dispatch(Actions.addDeviceOwner(deviceId, userId));
      } else {
        this.props.dispatch(Actions.removeDeviceOwner(deviceId, userId));
      }
    }).catch(toastError);
  }

  renderAccessControlHeader(accessControlSubpath) {
    return (
      <div className="modal-heading-container">
        <Link to={this.props.match.url.split(accessControlSubpath)[0]} className="link-plain">
          <h3 className="modal-heading">
            <MaterialIcon icon="arrow_back"/>
            {this.props.label}
          </h3>
        </Link>
        <MaterialIcon icon="close" onClick={this.close}/>
      </div>
    );
  }

  renderUserRestrictions() {
    const restrictions = this.props.permissions.parentalRestrictions;
    const disable = this.props.me.role === Roles.CHILD || this.props.me.role === Roles.GUEST;
    return (
      <div>
        <h4 className="device-modal-heading">Allowed Users</h4>
        <div className="modal-content">
          <p>Device Owners</p>
          { Object.values(this.props.users).map((user) => (
              <Checkbox
                name="owners"
                id={user.id}
                key={user.id}
                checked={this.props.permissions.owners.includes(user.id)}
                label={[
                  <MaterialIcon key={`${user.id}-icon`} icon="mood" style={{ color: strToColor(user.id)}}/>,
                  <span key={`${user.id}-label`} className="user-li-label">{user.displayName}</span>
                ]}
                onCheckboxChange={this.changeCheckbox}
                disable={disable}
              />
            ))
          }
          <p>What happens when non-owners want to use this device?</p>
          <Radio
            name="parentalRestrictions"
            id={ParentalRestrictions.ALLOW_IF_NEARBY}
            checked={restrictions === ParentalRestrictions.ALLOW_IF_NEARBY}
            label={UserRestrictionsStrings[ParentalRestrictions.ALLOW_IF_NEARBY]}
            onRadioChange={this.changeRadio}
            disable={disable}
          />
          <Radio
            name="parentalRestrictions"
            id={ParentalRestrictions.ALWAYS_ASK}
            checked={restrictions === ParentalRestrictions.ALWAYS_ASK}
            label={UserRestrictionsStrings[ParentalRestrictions.ALWAYS_ASK]}
            onRadioChange={this.changeRadio}
            disable={disable}
          />
          <Radio
            name="parentalRestrictions"
            id={ParentalRestrictions.DENY}
            checked={restrictions === ParentalRestrictions.DENY}
            label={UserRestrictionsStrings[ParentalRestrictions.DENY]}
            onRadioChange={this.changeRadio}
            disable={disable}
          />
        </div>
      </div>
    );
  }

  changeLocationRadio(userId, value) {
    const params = {
      deviceId: this.props.match.params.deviceId,
      locationRestrictions: Object.assign({},
        this.props.permissions.locationRestrictions,
        { [userId]: value })
    };
    smartAppClient.modifyPermission(params).then(() => {
      this.props.dispatch(Actions.updatePermission(params));
    }).catch(toastError);
  }

  renderUserLocationRestrictions(user) {
    const disable = this.props.me.role === Roles.CHILD || this.props.me.role === Roles.GUEST;
    return (
      <tr key={user.id}>
        <td>{user.displayName}</td>
        <td>
          <Radio
            name={user.id}
            id={LocationRestrictions.ANYWHERE}
            checked={this.props.permissions.locationRestrictions[user.id] === LocationRestrictions.ANYWHERE}
            onRadioChange={this.changeLocationRadio}
            disable={disable}
          />
        </td>
        <td>
          <Radio
              name={user.id}
              id={LocationRestrictions.AT_HOME}
              checked={this.props.permissions.locationRestrictions[user.id] === LocationRestrictions.AT_HOME}
              onRadioChange={this.changeLocationRadio}
              disable={disable}
            />
        </td>
        <td>
          <Radio
              name={user.id}
              id={LocationRestrictions.NEARBY}
              checked={this.props.permissions.locationRestrictions[user.id] === LocationRestrictions.NEARBY}
              onRadioChange={this.changeLocationRadio}
              disable={disable}
            />
        </td>
      </tr>
    );
  }

  renderLocationRestrictions() {
    return (
      <div>
        <h4 className="device-modal-heading">Remote Control</h4>
        <div className="modal-content">
          <p>Restrict where this device can be controlled from.</p>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Can control anywhere</th>
                <th>Can control if at home</th>
                <th>Can control if nearby</th>
              </tr>
            </thead>
            <tbody>
              { Object.values(this.props.users).map(this.renderUserLocationRestrictions)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  changeNotificationRadio(_, newPref) {
    const deviceId = this.props.match.params.deviceId;
    smartAppClient.updateNotificationPrefs(
      Object.assign({}, this.props.notificationPrefs, { [deviceId]: newPref })
    ).then(() => {
      this.props.dispatch(Actions.changeNotificationPref(deviceId, newPref));
    }).catch(toastError);
  }

  renderNotifications() {
    const devicePref = this.props.notificationPrefs[this.props.match.params.deviceId];
    return (
      <div>
        <h4 className="device-modal-heading">Activity Notifications</h4>
        <div className="modal-content">
          <p>Get notifications when this device changes.</p>
          <Radio
            name="notifications"
            id={ActivityNotifications.ON}
            checked={devicePref === ActivityNotifications.ON}
            label="Enabled"
            onRadioChange={this.changeNotificationRadio}
          />
          <Radio
            name="notifications"
            id={ActivityNotifications.PROXIMITY}
            checked={devicePref === ActivityNotifications.PROXIMITY}
            label="Enabled, but only when I'm nearby"
            onRadioChange={this.changeNotificationRadio}
          />
          <Radio
            name="notifications"
            id={ActivityNotifications.OFF}
            checked={devicePref === ActivityNotifications.OFF}
            label="Disabled"
            onRadioChange={this.changeNotificationRadio}
          />
        </div>
      </div>
    );
  }

  render() {
    let isActuator = this.props.desc.components &&
      !!this.props.desc.components.find((component) => {
        return component.capabilities.find((capability) => {
          return capability.id === 'actuator';
        });
      });

    let userSubtitle;
    let userPolicySubtitle;
    if (this.props.permissions.owners.length === Object.keys(this.props.users).length) {
      userSubtitle = 'Everyone'
    } else {
      userSubtitle = this.props.permissions.owners.map((userId) => {
        return this.props.users[userId].displayName;
      }).join(', ');
      userPolicySubtitle = UserRestrictionsSubtitleStrings[this.props.permissions.parentalRestrictions];
    }

    return (
      <div>
        <div className="modal-bg fade" onClick={this.close}/>
        <div className="modal-window fade">
          <Switch>
            <Route path={`${this.props.match.path}/location`} render={() => (
              <div>
                {this.renderAccessControlHeader('/location')}
                {this.renderLocationRestrictions()}
              </div>
            )}/>
            <Route path={`${this.props.match.path}/users`} render={() => (
              <div>
                {this.renderAccessControlHeader('/users')}
                {this.renderUserRestrictions()}
              </div>
            )}/>
             <Route path={`${this.props.match.path}/notifications`} render={() => (
              <div>
                {this.renderAccessControlHeader('/notifications')}
                {this.renderNotifications()}
              </div>
            )}/>
            <Route path={this.props.match.path} render={() => (
              <div>
                <div className="modal-heading-container">
                  <h3 className="modal-heading">{this.props.label}</h3>
                  <MaterialIcon icon="close" onClick={this.close}/>
                </div>
                <div>
                  <h4 className="device-modal-heading">Status</h4>
                  {this.renderBeaconStatus()}
                  {this.renderContactStatus()}
                  {this.renderMotionSensorStatus()}
                  {this.renderLockStatus()}
                  {this.renderSwitchStatus()}
                  {this.renderTemperature()}
                  {this.renderBatteryStatus()}
                  <div>
                    { this.props.desc.deviceTypeName !== 'beacon' ?
                      <div>
                        <h4 className="device-modal-heading">Settings</h4>
                        <div className="device-modal-nav-item"  onClick={() => {
                          if (this.props.canModifySettings ) {
                            this.props.history.push(`${this.props.match.url}/notifications`);
                          }
                        }}>
                          <div>
                            <div>Activity Notifications</div>
                            <div className="device-modal-nav-item-subtitle">
                              {NotificationStrings[this.props.notificationPrefs[this.props.match.params.deviceId]]}
                            </div>
                          </div>
                          { this.props.canModifySettings ?
                            <MaterialIcon icon="chevron_right" style={{ color: '#8c8c8c' }}/>
                            : null }
                        </div>
                      </div>
                      : null
                    }

                    { isActuator ?
                      <div>
                      <div className="device-modal-nav-item"  onClick={() => {
                        if (this.props.canModifySettings ) {
                          this.props.history.push(`${this.props.match.url}/location`);
                        }
                      }}>
                        <div>
                          <div>Remote Control</div>
                          <div className="device-modal-nav-item-subtitle">
                            {LocationRestrictionsStrings[this.props.permissions.locationRestrictions]}
                          </div>
                        </div>
                        { this.props.canModifySettings ?
                            <MaterialIcon icon="chevron_right" style={{ color: '#8c8c8c' }}/>
                          : null }
                        </div>

                        <div className="device-modal-nav-item" onClick={() => {
                          if (this.props.canModifySettings) {
                            this.props.history.push(`${this.props.match.url}/users`);
                          }
                        }}>
                          <div>
                            <div>Allowed Users</div>
                            <div className="device-modal-nav-item-subtitle">
                              {userSubtitle}
                            </div>
                            <div className="device-modal-nav-item-subtitle">
                              {userPolicySubtitle}
                            </div>
                          </div>
                          { this.props.canModifySettings ?
                              <MaterialIcon icon="chevron_right" style={{ color: '#8c8c8c' }}/>
                            : null }
                        </div>
                      </div>
                      : null }
                    </div>
              </div>
             </div>
            )}/>
          </Switch>
        </div>
      </div>
    );
  }
}

DeviceModal.propTypes = {
  canModifySettings: PropTypes.bool,
  desc: PropTypes.object,
  dispatch: PropTypes.func,
  history: PropTypes.object,
  label: PropTypes.string,
  match: PropTypes.object,
  me: PropTypes.object,
  nearbyBeacons: PropTypes.object,
  notificationPrefs: PropTypes.object,
  permissions: PropTypes.object,
  status: PropTypes.object,
  users: PropTypes.object,
}

const mapStateToProps = (state, ownProps) => {
  const deviceId = ownProps.match.params.deviceId;
  const canModifySettings = state.users[state.me]
    ? state.users[state.me].role === Roles.USER ||
      Capability.getPermissions(state, deviceId).owners.includes(state.me)
    : false;

  return {
    canModifySettings: canModifySettings,
    desc: Capability.getDesc(state, deviceId),
    label: Capability.getLabel(state, deviceId),
    notificationPrefs: state.notificationPrefs,
    permissions: Capability.getPermissions(state, deviceId),
    status: Capability.getStatus(state, deviceId),
    nearbyBeacons: state.beacons.nearbyBeacons,
    users: state.users,
    me: state.users[state.me] ? state.users[state.me] : {}
  };
};

export default withRouter(connect(mapStateToProps)(DeviceModal));