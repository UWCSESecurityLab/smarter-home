import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { CommonActions, SmartAppClient } from 'common';

let smartAppClient = new SmartAppClient();

class LockStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.toggle = this.toggle.bind(this);
  }

  async toggle() {
    const status = this.props.deviceStatus[this.props.deviceId];
    if (!status) {
      return;
    }
    let command = ''
    if (status.components.main.lock.lock.value === 'unlocked') {
      command = 'lock';
    } else if (status.components.main.lock.lock.value === 'locked') {
      command = 'unlock';
    } else {
      console.error('Invalid state: ' + status.components.main.lock.lock.value);
      return;
    }

    try {
      await smartAppClient.executeDeviceCommand({
        deviceId: this.props.deviceId,
        command: {
          component: 'main',
          capability: 'lock',
          command: command
        }
      });

      let newStatus = await smartAppClient.getDeviceStatus(this.props.deviceId);
      this.props.dispatch(
        CommonActions.updateDeviceStatus(newStatus.deviceId, newStatus.status)
      );
    } catch(e) {
      console.error(e.stack);
    }
  }

  render() {
    const status = this.props.deviceStatus[this.props.deviceId];

    let buttonStyle;
    if (status && status.components.main.lock.lock.value === 'unlocked') {
      buttonStyle = 'toggle-active';
    } else {
      buttonStyle = 'toggle-inactive';
    }

    return (
      <button onClick={this.toggle} className={'device-toggle ' + buttonStyle}>
        <span className="device-status">
          { status
            ? status.components.main.lock.lock.value
            : 'Unavailable'
          }
        </span>
      </button>
    );
  }
}

LockStatus.propTypes = {
  deviceId: PropTypes.string,
  deviceStatus: PropTypes.object,
  dispatch: PropTypes.func
}

function mapStateToProps(state) {
  return {
    deviceStatus: state.devices.deviceStatus
  }
}

export default connect(mapStateToProps)(LockStatus);