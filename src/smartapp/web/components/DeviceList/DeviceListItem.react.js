import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

class DeviceListItem extends React.Component {
  constructor(props, context) {
    super(props, context);
  }
  render() {
    let label = ''
    if (this.props.deviceDesc[this.props.deviceId]) {
      label = this.props.deviceDesc[this.props.deviceId].label;
    }

    return (
      <div className="device-li">
        <span className="device-li-name">
          {label}
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
  dispatch: PropTypes.func        // Bound to Redux dispatch function
}

const mapStateToProps = (state) => {
  return {
    deviceDesc: state.devices.deviceDesc
  }
};

export default connect(mapStateToProps)(DeviceListItem);