import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

class BeaconStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    const nearby = this.props.nearbyBeacons[this.props.deviceId];
    let buttonStyle;
    let buttonText;
    if (window.cordova) {
      buttonStyle = nearby ? 'toggle-active' : 'toggle-inactive';
      buttonText = nearby ? 'nearby' : 'not nearby';
    } else {
      buttonStyle = 'toggle-inactive';
      buttonText = 'Unavailable';
    }
    return (
      <button className={'device-status ' + buttonStyle}>
        {buttonText}
      </button>
    );
  }
}

BeaconStatus.propTypes = {
  deviceId: PropTypes.string,
  nearbyBeacons: PropTypes.object
}

function mapStateToProps(state) {
  return {
    nearbyBeacons: state.beacons.nearbyBeacons,
  }
}

export default connect(mapStateToProps)(BeaconStatus);