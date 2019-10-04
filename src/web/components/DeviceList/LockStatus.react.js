import React from 'react';
import PropTypes from 'prop-types';
import Lock from '../../lib/capabilities/Lock';
import toastError from '../../lib/error-toaster';
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
      toastError(e);
    }
  }

  render() {
    const buttonStyle = this.props.status === 'unlocked'
      ? 'toggle-active'
      : 'toggle-inactive';

    let inner;
    if (this.props.spinner) {
      inner = <span className="inline-spinner-white"></span>
    } else if (this.props.status) {
      inner = this.props.status;
    } else {
      inner = 'unavailable';
    }
    return (
      <button onClick={this.toggle}
              className={'device-status device-status-toggle ' + buttonStyle}
              disabled={this.props.spinner}>
        {inner}
      </button>
    );
  }
}

LockStatus.propTypes = {
  deviceId: PropTypes.string,
  status: PropTypes.string,
  spinner: PropTypes.bool
}
const mapStateToProps = (state, ownProps) => {
  return {
    status: Lock.getStatus(state, ownProps.deviceId),
    spinner: state.devices.spinners[ownProps.deviceId]
  };
}

export default connect(mapStateToProps)(LockStatus);
