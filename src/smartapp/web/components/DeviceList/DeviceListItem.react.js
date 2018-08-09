import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Capability from '../../lib/capabilities/Capability';

class DeviceListItem extends React.Component {
  constructor(props, context) {
    super(props, context);
  }
  render() {
    let label = this.props.label;
    if (label && this.props.isBeacon) {
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
  draggable: PropTypes.bool,
  isBeacon: PropTypes.bool,
  label: PropTypes.string
}

const mapStateToProps = (state, ownProps) => {
  return {
    isBeacon: Capability.isBeacon(state, ownProps.deviceId),
    label: Capability.getLabel(state, ownProps.deviceId)
  }
};

export default connect(mapStateToProps)(DeviceListItem);
