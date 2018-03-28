import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

class DeviceListItem extends React.Component {
  constructor(props, context) {
    super(props, context);
  }
  render() {
    const status = this.props.deviceStatus[this.props.deviceDesc.deviceId];
    let buttonStyle;
    if (status && status.components.main[this.props.capability][this.props.capability].value === this.props.activeState) {
      buttonStyle = styles.buttonActive;
    } else {
      buttonStyle = styles.buttonInactive;
    }
    return (
      <View style={styles.device}>
        <Text style={styles.deviceName}>{this.props.deviceDesc.label}</Text>
        <View style={buttonStyle}>
          <Text style={styles.status}>
            { status
              ? status.components.main[this.props.capability][this.props.capability].value
              : 'Unavailable'
            }
          </Text>
        </View>
      </View>
    );
  }
}

DeviceListItem.propTypes = {
  capability: PropTypes.string,   // The capability to show in the list
  activeState: PropTypes.string,  // The state of the capability that should be styled as 'active'
  deviceDesc: PropTypes.object,   // The description for this device
  deviceStatus: PropTypes.object, // Bound to deviceStatus reducer
  dispatch: PropTypes.func        // Bound to Redux dispatch function
}

const styles = StyleSheet.create({
  device: {
    borderBottomColor: '#bbb',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 15,
    paddingHorizontal: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  deviceName: {
    fontSize: 18
  },
  buttonActive: {
    backgroundColor: '#73C046',
    borderColor: '#dddddd',
    borderWidth: 0.5,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: 130
  },
  buttonInactive: {
    borderColor: '#dddddd',
    borderWidth: 0.5,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: 130,
  },
  status: {
    fontSize: 16,
    textAlign: 'center'
  }
});

const mapStateToProps = (state) => {
  return {
    deviceStatus: state.deviceStatus
  }
};

export default connect(mapStateToProps)(DeviceListItem);