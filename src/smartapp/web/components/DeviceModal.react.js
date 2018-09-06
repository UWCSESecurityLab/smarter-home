import React from 'react';
import Capability from '../lib/capabilities/Capability';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import SmartAppClient from '../lib/SmartAppClient';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

class DeviceModal extends React.Component {
  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
    this.renderBatteryStatus = this.renderBatteryStatus.bind(this);
  }
  close() {
    this.props.history.push(
      this.props.history.location.pathname.split('/device/')[0]);
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
            {this.renderTemperature()}
            {this.renderBatteryStatus()}
          </div>
        </div>
      </div>
    );
  }
}

DeviceModal.propTypes = {
  history: PropTypes.object,
  label: PropTypes.string,
  match: PropTypes.object,
  status: PropTypes.object
}

const mapStateToProps = (state, ownProps) => {
  const deviceId = ownProps.match.params.deviceId;
  return {
    desc: Capability.getDesc(state, deviceId),
    label: Capability.getLabel(state, deviceId),
    status: Capability.getStatus(state, deviceId)
    // permissions: Capability.getPermissions(state, ownProps.deviceId)
  };
};

export default withRouter(connect(mapStateToProps)(DeviceModal));