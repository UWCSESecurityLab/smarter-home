import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

class BeaconStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    const beacon = this.props.deviceDesc[this.props.deviceId];
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

BeaconStatus.propTypes = {
  deviceId: PropTypes.string,
  deviceDesc: PropTypes.object,
  dispatch: PropTypes.func
}

function mapStateToProps(state) {
  return {
    deviceDesc: state.devices.deviceDesc
  }
}

export default connect(mapStateToProps)(BeaconStatus);