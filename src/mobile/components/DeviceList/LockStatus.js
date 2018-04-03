import React from 'react';
import { TouchableHighlight, Text, View } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import StatusStyles from './StatusStyles';
import { SmartAppClient } from 'common';
import { updateDeviceStatus } from '../../redux/actions';

class LockStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.toggle = this.toggle.bind(this);
  }

  async toggle() {
    const status = this.props.deviceStatus[this.props.deviceDesc.deviceId];
    if (!status) {
      return;
    }
    let command = ''
    if (status.components.main.lock.lock.value === 'unlocked') {
      command = 'lock';
    } else if (status.components.main.lock.lock.value === 'locked') {
      command = 'unlock';
    } else {
      console.error('Invalid state: ' + status.components.main.lock.lock.value);
      return;
    }

    try {
      await SmartAppClient.executeDeviceCommand({
        deviceId: this.props.deviceDesc.deviceId,
        command: {
          component: 'main',
          capability: 'lock',
          command: command
        }
      });

      let newStatus = await SmartAppClient.getDeviceStatus(
        this.props.deviceDesc.deviceId
      );

      this.props.dispatch(
        updateDeviceStatus(newStatus.deviceId, newStatus.status)
      );
    } catch(e) {
      console.error(e.stack);
    }
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
      <TouchableHighlight onPress={this.toggle}>
        <View style={buttonStyle}>
          <Text style={StatusStyles.status}>
            { status
              ? status.components.main.lock.lock.value
              : 'Unavailable'
            }
          </Text>
        </View>
      </TouchableHighlight>
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