import React from 'react';
import PropTypes from 'prop-types';
import Switch from '../../lib/capabilities/Switch';

class SwitchStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.toggle = this.toggle.bind(this);
  }

  async toggle() {
    try {
      const switchStatus = Switch.getStatus(this.props.deviceId);
      if (switchStatus === 'on') {
        Switch.off(this.props.deviceId);
      } else if (switchStatus === 'off') {
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
    const status = Switch.getStatus(this.props.deviceId);
    const buttonStyle = status === 'on'
      ? 'toggle-active'
      : 'toggle-inactive';
    return (
      <button onClick={this.toggle} className={'device-status device-status-toggle ' + buttonStyle}>
        { status ? status : 'Unavailable' }
      </button>
    );
  }
}

SwitchStatus.propTypes = {
  deviceId: PropTypes.string,
}

export default SwitchStatus;