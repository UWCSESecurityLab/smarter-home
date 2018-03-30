import React from 'react';
import { TouchableHighlight, Text, View } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import StatusStyles from './StatusStyles';
import ORIGIN from '../../origin';
import { updateDeviceStatus } from '../../redux/actions';

class SwitchStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    const status = this.props.deviceStatus[this.props.deviceDesc.deviceId];
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

    fetch(`${ORIGIN}/devices/${this.props.deviceDesc.deviceId}/commands`, {
      method: 'POST',
      headers: {
        'credentials': 'same-origin',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        component: 'main',
        capability: 'switch',
        command: command
      })
    }).then(() => {
      fetch(
        `${ORIGIN}/devices/${this.props.deviceDesc.deviceId}/status`, {
          credentials: 'same-origin'
      }).then((response) => response.json())
      .then((status) => {
        this.props.dispatch(updateDeviceStatus(status.deviceId, status.status));
      });
    }).catch((err) => {
      console.error(err);
    });
  }

  render() {
    const status = this.props.deviceStatus[this.props.deviceDesc.deviceId];
    let buttonStyle;
    if (status && status.components.main.switch.switch.value === 'on') {
      buttonStyle = StatusStyles.buttonActive;
    } else {
      buttonStyle = StatusStyles.buttonInactive;
    }
    return (
      <TouchableHighlight onPress={this.toggle}>
        <View style={buttonStyle} onClick={this.toggle}>
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
  deviceDesc: PropTypes.object,
  deviceStatus: PropTypes.object,
  dispatch: PropTypes.func
}

function mapStateToProps(state) {
  return {
    deviceStatus: state.deviceStatus
  }
}

export default connect(mapStateToProps)(SwitchStatus);