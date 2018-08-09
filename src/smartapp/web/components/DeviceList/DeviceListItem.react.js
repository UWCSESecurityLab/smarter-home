import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Capability from '../../lib/capabilities/Capability';

class DeviceListItem extends React.Component {
  constructor(props, context) {
    super(props, context);
  }
  render() {
    let label = Capability.getName(this.props.deviceId);
    if (label && Capability.isBeacon(this.props.deviceId)) {
      label = 'Beacon ' + label;
    }

    return (
      <div className="device-li">
        <span className="device-li-label">
          {this.props.draggable
            ? <span className="device-li-edit">☰</span>
            : null
          }
          <span className="device-li-name">{label}</span>
        </span>
        {this.props.children}
      </div>
    );
  }
}

DeviceListItem.propTypes = {
  children: PropTypes.node,
  deviceId: PropTypes.string,
  deviceDesc: PropTypes.object,   // The SmartThings description for this device
  dispatch: PropTypes.func,       // Bound to Redux dispatch function
  draggable: PropTypes.bool
}

const mapStateToProps = (state) => {
  return {
    deviceDesc: state.devices.deviceDesc
  }
};

export default connect(mapStateToProps)(DeviceListItem);