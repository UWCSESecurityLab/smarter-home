import React from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import StatusStyles from './StatusStyles';

class ContactSensorStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    const status = this.props.deviceStatus[this.props.deviceId];
    let buttonStyle;
    if (status && status.components.main.contactSensor.contact.value === 'open') {
      buttonStyle = StatusStyles.buttonActive;
    } else {
      buttonStyle = StatusStyles.buttonInactive;
    }
    return (
      <View style={buttonStyle}>
        <Text style={StatusStyles.status}>
          { status
            ? status.components.main.contactSensor.contact.value
            : 'Unavailable'
          }
        </Text>
      </View>
    );
  }
}

ContactSensorStatus.propTypes = {
  deviceId: PropTypes.string,
  deviceStatus: PropTypes.object,
  dispatch: PropTypes.func
}

function mapStateToProps(state) {
  return {
    deviceStatus: state.devices.deviceStatus
  }
}

export default connect(mapStateToProps)(ContactSensorStatus);