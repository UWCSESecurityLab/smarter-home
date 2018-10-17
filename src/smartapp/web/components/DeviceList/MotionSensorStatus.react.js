import React from 'react';
import PropTypes from 'prop-types';
import MotionSensor from '../../lib/capabilities/MotionSensor';
import { connect } from 'react-redux';

class MotionSensorStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    const buttonStyle = this.props.status === 'active'
      ? 'toggle-active'
      : 'toggle-inactive';
    return (
      <button className={'device-status ' + buttonStyle}>
        { this.props.status ? this.props.status : 'Unavailable' }
      </button>
    );
  }
}

MotionSensorStatus.propTypes = {
  deviceId: PropTypes.string,
  status: PropTypes.string
}

const mapStateToProps = (state, ownProps) => {
  return {
    status: MotionSensor.getStatus(state, ownProps.deviceId)
  }
}

export default connect(mapStateToProps)(MotionSensorStatus);
