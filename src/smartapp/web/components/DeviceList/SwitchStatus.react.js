import React from 'react';
import PropTypes from 'prop-types';
import Switch from '../../lib/capabilities/Switch';
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
      // TODO: show visible error - toast?
      console.error(e.stack);
    }
  }

  render() {
    const buttonStyle = this.props.status === 'on'
      ? 'toggle-active'
      : 'toggle-inactive';
    return (
      <button onClick={this.toggle} className={'device-status device-status-toggle ' + buttonStyle}>
        { this.props.status ? this.props.status : 'Unavailable' }
      </button>
    );
  }
}

SwitchStatus.propTypes = {
  deviceId: PropTypes.string,
  status: PropTypes.string
}

function mapStateToProps(state, ownProps) {
  return {
    status: Switch.getStatus(state, ownProps.deviceId)
  };
}

export default connect(mapStateToProps)(SwitchStatus);
