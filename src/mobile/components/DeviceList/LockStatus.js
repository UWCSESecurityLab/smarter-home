import React from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import StatusStyles from './StatusStyles';

class LockStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    const status = this.props.deviceStatus[this.props.deviceDesc.deviceId];
    let buttonStyle;
    if (status && status.components.main.lock.lock.value === 'unlocked') {
      buttonStyle = StatusStyles.buttonActive;
    } else {
      buttonStyle = StatusStyles.buttonInactive;
    }
    return (
      <View style={buttonStyle}>
        <Text style={StatusStyles.status}>
          { status
            ? status.components.main.lock.lock.value
            : 'Unavailable'
          }
        </Text>
      </View>
    );
  }
}

LockStatus.propTypes = {
  deviceDesc: PropTypes.object,
  deviceStatus: PropTypes.object,
  dispatch: PropTypes.func
}

function mapStateToProps(state) {
  return {
    deviceStatus: state.deviceStatus
  }
}

export default connect(mapStateToProps)(LockStatus);