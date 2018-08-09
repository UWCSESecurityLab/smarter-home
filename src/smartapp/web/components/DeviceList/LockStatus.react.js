import React from 'react';
import PropTypes from 'prop-types';
import Lock from '../../lib/capabilities/Lock';
import { connect } from 'react-redux';

class LockStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.toggle = this.toggle.bind(this);
  }

  async toggle() {
    try {
      if (this.props.status === 'unlocked') {
        Lock.lock(this.props.deviceId);
      } else if (this.props.status === 'locked') {
        Lock.unlock(this.props.deviceId);
      } else {
        console.error('Invalid state: ' + this.props.status);
      }
    } catch(e) {
      // TODO: show visible error - toast?
      console.error(e.stack);
    }
  }

  render() {
    const buttonStyle = this.props.status === 'unlocked'
      ? 'toggle-active'
      : 'toggle-inactive';
    return (
      <button onClick={this.toggle}
              className={'device-status device-status-toggle ' + buttonStyle}>
        { this.props.status ? this.props.status : 'Unavailable'}
      </button>
    );
  }
}

LockStatus.propTypes = {
  deviceId: PropTypes.string,
  status: PropTypes.string
}
const mapStateToProps = (state, ownProps) => {
  return {
    status: Lock.getStatus(state, ownProps.deviceId)
  };
}

export default connect(mapStateToProps)(LockStatus);
