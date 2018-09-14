import React from 'react';
import Capability from '../lib/capabilities/Capability';
import MaterialIcon from '@material/react-material-icon';
import Permissions from '../../permissions';
import PropTypes from 'prop-types';
import SmartAppClient from '../lib/SmartAppClient';
import toastError from '../lib/error-toaster';
import * as Actions from '../redux/actions';
import { connect } from 'react-redux';
import { Link, Route, Switch, withRouter } from 'react-router-dom';

const smartAppClient = new SmartAppClient();

class DeviceModal extends React.Component {
  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
    this.changeRadio = this.changeRadio.bind(this);
    this.renderBatteryStatus = this.renderBatteryStatus.bind(this);
    this.renderPermissions = this.renderPermissions.bind(this);
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

  renderRadio({id, checked, label, name}) {
    return (
      <div className="mdc-form-field">
        <div className={'mdc-radio'}>
          <input className="mdc-radio__native-control"
                 type="radio" id={id} name={name}
                 checked={checked}
                 onChange={() => {
                    this.changeRadio(name, id)
                 }}/>
          <div className="mdc-radio__background">
            <div className="mdc-radio__outer-circle"></div>
            <div className="mdc-radio__inner-circle"></div>
          </div>
        </div>
        <label htmlFor={id}>{label}</label>
      </div>
    );
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

  renderPermissions() {
    return (
      <div>
        <p>Restrict where this device can be controlled from.</p>
        { this.renderRadio({
            name: 'locationRestrictions',
            id: Permissions.LocationRestrictions.NEARBY,
            checked: this.props.permissions.locationRestrictions === Permissions.LocationRestrictions.NEARBY,
            label: 'Only control if nearby'
        })}
        { this.renderRadio({
            name: 'locationRestrictions',
            id: Permissions.LocationRestrictions.AT_HOME,
            checked: this.props.permissions.locationRestrictions === Permissions.LocationRestrictions.AT_HOME,
            label: 'Only control if at home'
        })}
        { this.renderRadio({
            name: 'locationRestrictions',
            id: Permissions.LocationRestrictions.ANYWHERE,
            checked: this.props.permissions.locationRestrictions === Permissions.LocationRestrictions.ANYWHERE,
            label: 'Control from anywhere'
        })}
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
    return (
      <div>
        <div className="modal-bg fade" onClick={this.close}/>
        <div className="modal-window fade">
          <Switch>
            <Route path={`${this.props.match.path}/location`} render={() => (
              <div>
                <div className="modal-heading-container">
                  <Link to={this.props.match.url.split('/location')[0]} className="link-plain">
                    <h3 className="modal-heading">
                      <MaterialIcon icon="arrow_back"/>
                      {this.props.label}
                    </h3>
                  </Link>
                  <MaterialIcon icon="close" onClick={this.close}/>
                </div>
                <h4 className="device-modal-heading">Remote Control</h4>
                {this.renderPermissions()}
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
                      <h4 className="device-modal-heading">Access Controls</h4>
                      <Link to={`${this.props.match.url}/location`} className="link-plain">
                        <div className="device-modal-nav-item">
                          <span>Remote Control</span>
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
  status: PropTypes.object
}

const mapStateToProps = (state, ownProps) => {
  const deviceId = ownProps.match.params.deviceId;
  return {
    desc: Capability.getDesc(state, deviceId),
    label: Capability.getLabel(state, deviceId),
    permissions: Capability.getPermissions(state, deviceId),
    status: Capability.getStatus(state, deviceId),
    nearbyBeacons: state.beacons.nearbyBeacons
  };
};

export default withRouter(connect(mapStateToProps)(DeviceModal));