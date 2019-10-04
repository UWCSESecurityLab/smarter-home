import React from 'react';
import PropTypes from 'prop-types';
import Switch from '../../lib/capabilities/Switch';
import toastError from '../../lib/error-toaster';
import { connect } from 'react-redux';

class SwitchStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.toggle = this.toggle.bind(this);
  }

  async toggle() {
    try {
      if (this.props.status === 'on') {
        Switch.off(this.props.deviceId);
      } else if (this.props.status === 'off') {
        Switch.on(this.props.deviceId);
      } else {
        console.error('Invalid state: ' + status);
      }
    } catch(e) {
      toastError(e);
    }
  }

  render() {
    const buttonStyle = this.props.status === 'on'
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
      <button onClick={this.toggle} className={'device-status device-status-toggle ' + buttonStyle}>
        {inner}
      </button>
    );
  }
}

SwitchStatus.propTypes = {
  deviceId: PropTypes.string,
  status: PropTypes.string,
  spinner: PropTypes.bool
}

function mapStateToProps(state, ownProps) {
  return {
    status: Switch.getStatus(state, ownProps.deviceId),
    spinner: state.devices.spinners[ownProps.deviceId]
  };
}

export default connect(mapStateToProps)(SwitchStatus);
