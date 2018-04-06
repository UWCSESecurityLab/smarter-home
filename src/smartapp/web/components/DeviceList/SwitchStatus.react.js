import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { CommonActions, SmartAppClient } from 'common';

let smartAppClient = new SmartAppClient('http://localhost:5000');

class SwitchStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.toggle = this.toggle.bind(this);
  }

  async toggle() {
    const status = this.props.deviceStatus[this.props.deviceDesc.deviceId];
    if (!status) {
      return;
    }
    let command = ''
    if (status.components.main.switch.switch.value === 'on') {
      command = 'off';
    } else if (status.components.main.switch.switch.value === 'off') {
      command = 'on'
    } else {
      console.error('Invalid state: ' + status.components.main.switch.switch.value);
      return;
    }
    try {
      await smartAppClient.executeDeviceCommand({
        deviceId: this.props.deviceDesc.deviceId,
        command: {
          component: 'main',
          capability: 'switch',
          command: command
        }
      });

      let newStatus = await smartAppClient.getDeviceStatus(
        this.props.deviceDesc.deviceId
      );

      this.props.dispatch(
        CommonActions.updateDeviceStatus(newStatus.deviceId, newStatus.status)
      );
    } catch(e) {
      console.error(e.stack);
    }
  }

  render() {
    const status = this.props.deviceStatus[this.props.deviceDesc.deviceId];
    let buttonStyle;
    if (status && status.components.main.switch.switch.value === 'on') {
      buttonStyle = 'toggle-active';
    } else {
      buttonStyle = 'toggle-inactive';
    }
    return (
      <button onClick={this.toggle} className={'device-toggle ' + buttonStyle}>
        <span className="device-status">
          { status
            ? status.components.main.switch.switch.value
            : 'Unavailable'
          }
        </span>
      </button>
    );
  }
}

SwitchStatus.propTypes = {
  deviceDesc: PropTypes.object,
  deviceStatus: PropTypes.object,
  dispatch: PropTypes.func
}

function mapStateToProps(state) {
  return {
    deviceStatus: state.devices.deviceStatus
  }
}

export default connect(mapStateToProps)(SwitchStatus);