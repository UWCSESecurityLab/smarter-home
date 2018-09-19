import React from 'react';
import Capability from '../lib/capabilities/Capability';
import Checkbox from './Checkbox.react';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import Radio from './Radio.react';
import SmartAppClient from '../lib/SmartAppClient';
import toastError from '../lib/error-toaster';
import * as Actions from '../redux/actions';
import { connect } from 'react-redux';
import { Link, Route, Switch, withRouter } from 'react-router-dom';
import { LocationRestrictions, ParentalRestrictions } from '../../permissions';

const smartAppClient = new SmartAppClient();

const LocationRestrictionsStrings = {
  [LocationRestrictions.NEARBY]: 'Only control if nearby',
  [LocationRestrictions.AT_HOME]: 'Only control if at home',
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
    this.renderBatteryStatus = this.renderBatteryStatus.bind(this);
    this.renderLocationRestrictions = this.renderLocationRestrictions.bind(this);
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
                label={user.displayName}
                onCheckboxChange={this.changeCheckbox}
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
          />
          <Radio
            name="parentalRestrictions"
            id={ParentalRestrictions.ALWAYS_ASK}
            checked={restrictions === ParentalRestrictions.ALWAYS_ASK}
            label={UserRestrictionsStrings[ParentalRestrictions.ALWAYS_ASK]}
            onRadioChange={this.changeRadio}
          />
          <Radio
            name="parentalRestrictions"
            id={ParentalRestrictions.DENY}
            checked={restrictions === ParentalRestrictions.DENY}
            label={UserRestrictionsStrings[ParentalRestrictions.DENY]}
            onRadioChange={this.changeRadio}
          />
        </div>
      </div>
    );
  }

  renderLocationRestrictions() {
    return (
      <div>
        <h4 className="device-modal-heading">Remote Control</h4>
        <div className="modal-content">
          <p>Restrict where this device can be controlled from.</p>
          <Radio
            name="locationRestrictions"
            id={LocationRestrictions.NEARBY}
            checked={this.props.permissions.locationRestrictions === LocationRestrictions.NEARBY}
            label={LocationRestrictionsStrings[LocationRestrictions.NEARBY]}
          />
          <Radio
            name="locationRestrictions"
            id={LocationRestrictions.AT_HOME}
            checked={this.props.permissions.locationRestrictions === LocationRestrictions.AT_HOME}
            label={LocationRestrictionsStrings[LocationRestrictions.AT_HOME]}
          />
          <Radio
            name="locationRestrictions"
            id={LocationRestrictions.ANYWHERE}
            checked={this.props.permissions.locationRestrictions === LocationRestrictions.ANYWHERE}
            label={LocationRestrictionsStrings[LocationRestrictions.ANYWHERE]}
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
        this.props.users[userId].displayName
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
                  {this.renderLockStatus()}
                  {this.renderSwitchStatus()}
                  {this.renderTemperature()}
                  {this.renderBatteryStatus()}
                  { isActuator ?
                     <div>
                      <h4 className="device-modal-heading">Settings</h4>
                      <Link to={`${this.props.match.url}/location`} className="link-plain">
                        <div className="device-modal-nav-item">
                          <div>
                            <div>Remote Control</div>
                            <div className="device-modal-nav-item-subtitle">
                              {LocationRestrictionsStrings[this.props.permissions.locationRestrictions]}
                            </div>
                          </div>
                          <MaterialIcon icon="chevron_right" style={{ color: '#8c8c8c' }}/>
                        </div>
                      </Link>
                      <Link to={`${this.props.match.url}/users`} className="link-plain">
                        <div className="device-modal-nav-item">
                          <div>
                            <div>Allowed Users</div>
                            <div className="device-modal-nav-item-subtitle">
                              {userSubtitle}
                            </div>
                            <div className="device-modal-nav-item-subtitle">
                              {userPolicySubtitle}
                            </div>
                          </div>
                          <MaterialIcon icon="chevron_right" style={{ color: '#8c8c8c' }}/>
                        </div>
                      </Link>
                    </div>
                    : null }
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
  desc: PropTypes.object,
  dispatch: PropTypes.func,
  history: PropTypes.object,
  label: PropTypes.string,
  match: PropTypes.object,
  nearbyBeacons: PropTypes.object,
  permissions: PropTypes.object,
  status: PropTypes.object,
  users: PropTypes.object,
}

const mapStateToProps = (state, ownProps) => {
  const deviceId = ownProps.match.params.deviceId;
  return {
    desc: Capability.getDesc(state, deviceId),
    label: Capability.getLabel(state, deviceId),
    permissions: Capability.getPermissions(state, deviceId),
    status: Capability.getStatus(state, deviceId),
    nearbyBeacons: state.beacons.nearbyBeacons,
    users: state.users,
  };
};

export default withRouter(connect(mapStateToProps)(DeviceModal));