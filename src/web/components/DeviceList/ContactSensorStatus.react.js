import React from 'react';
import PropTypes from 'prop-types';
import ContactSensor from '../../lib/capabilities/ContactSensor';
import { connect } from 'react-redux';

class ContactSensorStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    const buttonStyle = this.props.status === 'open'
      ? 'toggle-active'
      : 'toggle-inactive';
    return (
      <button className={'device-status ' + buttonStyle}>
        { this.props.status ? this.props.status : 'Unavailable' }
      </button>
    );
  }
}

ContactSensorStatus.propTypes = {
  deviceId: PropTypes.string,
  status: PropTypes.string
}

const mapStateToProps = (state, ownProps) => {
  return {
    status: ContactSensor.getStatus(state, ownProps.deviceId)
  }
}

export default connect(mapStateToProps)(ContactSensorStatus);
