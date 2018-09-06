import React from 'react';
import Capability from '../lib/capabilities/Capability';
import MaterialIcon from '@material/react-material-icon';
import Permissions from '../../permissions';
import PropTypes from 'prop-types';
import SmartAppClient from '../lib/SmartAppClient';
import toastError from '../lib/error-toaster';
import * as Actions from '../redux/actions';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

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

  changeRadio(permission, value) {
    const params = {
      deviceId: this.props.match.params.deviceId,
      [permission]: value
    };

    smartAppClient.modifyPermission(params).then(() => {
      this.props.dispatch(Actions.updatePermission(params));
    }).catch(toastError);
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

  renderBatteryStatus() {
    const batteryStatus = this.props.status.components.main.battery;
    if (batteryStatus) {
      const val = batteryStatus.battery.value + '%';
      return (
        <div className="device-modal-item">
          <span>Battery Level</span>
          <span>{val}</span>
        </div>
      );
    } else {
      return null
    }
  }

  renderPermissions() {
    let isActuator = this.props.desc.components &&
      !!this.props.desc.components.find((component) => {
        return component.capabilities.find((capability) => {
          return capability.id === 'actuator';
        });
      });
    if (isActuator) {
      return (
        <div>
          <h4 className="device-modal-heading">Access Controls</h4>
          <p>
            <span className="access-control-subheading">Remote Control</span>
            <br/>
            Restrict where this device can be controlled from.
          </p>
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
    } else {
      return null;
    }
  }

  renderTemperature() {
    const temperature = this.props.status.components.main.temperatureMeasurement;
    if (temperature) {
      return (
        <div className="device-modal-item">
          <span>Temperature</span>
          <span>
            {temperature.temperature.value + temperature.temperature.unit}
          </span>
        </div>
      )
    } else {
      return null;
    }
  }

  render() {
    return (
      <div>
        <div className="modal-bg" onClick={this.close}/>
        <div className="modal-window">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <h3 className="modal-heading">{this.props.label}</h3>
            <MaterialIcon icon="close" onClick={this.close}/>
          </div>
          <div>
            <h4 className="device-modal-heading">Status</h4>
            {this.renderTemperature()}
            {this.renderBatteryStatus()}
            {this.renderPermissions()}
          </div>
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
  };
};

export default withRouter(connect(mapStateToProps)(DeviceModal));