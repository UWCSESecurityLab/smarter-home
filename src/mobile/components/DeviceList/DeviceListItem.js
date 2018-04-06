import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

class DeviceListItem extends React.Component {
  constructor(props, context) {
    super(props, context);
  }
  render() {
    return (
      <View style={styles.device}>
        <Text style={styles.deviceName}>{this.props.deviceDesc.label}</Text>
        {this.props.children}
      </View>
    );
  }
}

DeviceListItem.propTypes = {
  children: PropTypes.node,
  deviceDesc: PropTypes.object,   // The SmartThings description for this device
  deviceStatus: PropTypes.object, // Bound to deviceStatus reducer
  dispatch: PropTypes.func        // Bound to Redux dispatch function
}

const styles = StyleSheet.create({
  device: {
    borderBottomColor: '#bbb',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  deviceName: {
    fontSize: 16
  }
});

const mapStateToProps = (state) => {
  return {
    deviceStatus: state.devices.deviceStatus
  }
};

export default connect(mapStateToProps)(DeviceListItem);