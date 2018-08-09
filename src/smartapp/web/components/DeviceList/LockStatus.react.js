import React from 'react';
import PropTypes from 'prop-types';
import Lock from '../../lib/capabilities/Lock';

class LockStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.toggle = this.toggle.bind(this);
  }

  async toggle() {
    try {
      const lockStatus = Lock.getStatus(this.props.deviceId);
      if (lockStatus === 'unlocked') {
        Lock.lock(this.props.deviceId);
      } else if (lockStatus === 'locked') {
        Lock.unlock(this.props.deviceId);
      } else {
        console.error('Invalid state: ' + lockStatus);
      }
    } catch(e) {
      // TODO: show visible error - toast?
      console.error(e.stack);
    }
  }

  render() {
    const status = Lock.getStatus(this.props.deviceId);
    const buttonStyle = status === 'unlocked'
      ? 'toggle-active'
      : 'toggle-inactive';
    return (
      <button onClick={this.toggle}
              className={'device-status device-status-toggle ' + buttonStyle}>
        { status ? status : 'Unavailable'}
      </button>
    );
  }
}

LockStatus.propTypes = {
  deviceId: PropTypes.string,
}

export default LockStatus;