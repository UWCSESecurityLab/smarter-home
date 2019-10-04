import React from 'react';
import Capability from '../../lib/capabilities/Capability';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';


class DeviceListItem extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.showDeviceModal = this.showDeviceModal.bind(this);
  }

  showDeviceModal() {
    this.props.history.push(
      `${this.props.history.location.pathname}/device/${this.props.deviceId}`
    );
  }

  render() {
    let label = this.props.label;
    if (label && this.props.isBeacon) {
      label = 'Beacon ' + label;
    }

    return (
      <div className="device-li">
        <span className="device-li-label" onClick={this.showDeviceModal}>
          {this.props.draggable
            ? <span className="device-li-edit">
                <MaterialIcon icon="reorder"/>
              </span>
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
  history: PropTypes.object,
  isBeacon: PropTypes.bool,
  label: PropTypes.string
}

const mapStateToProps = (state, ownProps) => {
  return {
    isBeacon: Capability.isBeacon(state, ownProps.deviceId),
    label: Capability.getLabel(state, ownProps.deviceId)
  }
};

export default withRouter(connect(mapStateToProps)(DeviceListItem));
