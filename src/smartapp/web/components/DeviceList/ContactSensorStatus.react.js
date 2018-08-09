import React from 'react';
import PropTypes from 'prop-types';
import ContactSensor from '../../lib/capabilities/ContactSensor';

class ContactSensorStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    const status = ContactSensor.getStatus(this.props.deviceId);
    const buttonStyle = status === 'open'
      ? 'toggle-active'
      : 'toggle-inactive';
    return (
      <button className={'device-status ' + buttonStyle}>
        { status ? status : 'Unavailable' }
      </button>
    );
  }
}

ContactSensorStatus.propTypes = {
  deviceId: PropTypes.string,
}

export default ContactSensorStatus;