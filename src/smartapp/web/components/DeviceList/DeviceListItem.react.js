import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

class DeviceListItem extends React.Component {
  constructor(props, context) {
    super(props, context);
  }
  render() {
    return (
      <div className="device-li">
        <span className="device-li-name">{this.props.deviceDesc.label}</span>
        {this.props.children}
      </div>
    );
  }
}

DeviceListItem.propTypes = {
  children: PropTypes.node,
  deviceDesc: PropTypes.object,   // The SmartThings description for this device
  deviceStatus: PropTypes.object, // Bound to deviceStatus reducer
  dispatch: PropTypes.func        // Bound to Redux dispatch function
}

const mapStateToProps = (state) => {
  return {
    deviceStatus: state.devices.deviceStatus
  }
};

export default connect(mapStateToProps)(DeviceListItem);