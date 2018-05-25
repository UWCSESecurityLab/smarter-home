import React from 'react';
import { TouchableHighlight, Text, View } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import StatusStyles from './StatusStyles';
import { CommonActions, SmartAppClient } from 'common';
import smartAppHost from '../../getSmartAppHost';

let smartAppClient = new SmartAppClient(smartAppHost);

class SwitchStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.toggle = this.toggle.bind(this);
  }

  async toggle() {
    const status = this.props.deviceStatus[this.props.deviceId];
    if (!status) {
      return;
    }
    let command = ''
    if (status.components.main.switch.switch.value === 'on') {
      command = 'off';
    } else if (status.components.main.switch.switch.value === 'off') {
      command = 'on'
    } else {
      console.error('Invalid state: ' + status.components.main.switch.switch.value);
      return;
    }
    try {
      await smartAppClient.executeDeviceCommand({
        deviceId: this.props.deviceId,
        command: {
          component: 'main',
          capability: 'switch',
          command: command
        }
      });

      let newStatus = await smartAppClient.getDeviceStatus(this.props.deviceId);

      this.props.dispatch(
        CommonActions.updateDeviceStatus(newStatus.deviceId, newStatus.status)
      );
    } catch(e) {
      console.error(e.stack);
    }
  }

  render() {
    const status = this.props.deviceStatus[this.props.deviceId];
    let buttonStyle;
    if (status && status.components.main.switch.switch.value === 'on') {
      buttonStyle = StatusStyles.buttonActive;
    } else {
      buttonStyle = StatusStyles.buttonInactive;
    }
    return (
      <TouchableHighlight onPress={this.toggle}>
        <View style={buttonStyle}>
          <Text style={StatusStyles.status}>
            { status
              ? status.components.main.switch.switch.value
              : 'Unavailable'
            }
          </Text>
        </View>
      </TouchableHighlight>
    );
  }
}

SwitchStatus.propTypes = {
  deviceId: PropTypes.string,
  deviceStatus: PropTypes.object,
  dispatch: PropTypes.func
}

function mapStateToProps(state) {
  return {
    deviceStatus: state.devices.deviceStatus
  }
}

export default connect(mapStateToProps)(SwitchStatus);