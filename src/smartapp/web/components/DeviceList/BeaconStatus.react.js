import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

class BeaconStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    const beacon = this.props.deviceDesc[this.props.deviceId];

    let nearby = Object.values(this.props.nearbyBeacons)
      .map((nearby) => Buffer.from(nearby.bid).toString('hex'))
      .includes(beacon.deviceId)

    let buttonStyle = nearby ? 'toggle-active' : 'toggle-inactive';
    let buttonText = nearby ? 'nearby' : 'not nearby';

    return (
      <button className={'device-status ' + buttonStyle}>
        {buttonText}
      </button>
    );
  }
}

BeaconStatus.propTypes = {
  deviceId: PropTypes.string,
  deviceDesc: PropTypes.object,
  dispatch: PropTypes.func,
  nearbyBeacons: PropTypes.object
}

function mapStateToProps(state) {
  return {
    nearbyBeacons: state.nearbyBeacons,
    deviceDesc: state.devices.deviceDesc
  }
}

export default connect(mapStateToProps)(BeaconStatus);