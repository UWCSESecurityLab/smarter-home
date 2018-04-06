import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

class ContactSensorStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    const status = this.props.deviceStatus[this.props.deviceDesc.deviceId];
    let buttonStyle;
    if (status && !status.components) {
      console.log(status);
    }

    if (status && status.components.main.contactSensor.contact.value === 'open') {
      buttonStyle = 'toggle-active';
    } else {
      buttonStyle = 'toggle-inactive';
    }
    return (
      <button className={'device-toggle ' + buttonStyle}>
        <span className="device-status">
          { status
            ? status.components.main.contactSensor.contact.value
            : 'Unavailable'
          }
        </span>
      </button>
    );
  }
}

ContactSensorStatus.propTypes = {
  deviceDesc: PropTypes.object,
  deviceStatus: PropTypes.object,
  dispatch: PropTypes.func
}

function mapStateToProps(state) {
  return {
    deviceStatus: state.devices.deviceStatus
  }
}

export default connect(mapStateToProps)(ContactSensorStatus);