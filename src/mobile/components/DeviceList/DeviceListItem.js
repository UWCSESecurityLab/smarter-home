import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
      <View style={styles.device}>
        <Text style={styles.deviceName}>{label}</Text>
        {this.props.children}
      </View>
    );
  }
}

DeviceListItem.propTypes = {
  children: PropTypes.node,
  deviceDesc: PropTypes.object,   // The SmartThings description for this device
  deviceId: PropTypes.string,
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
    deviceDesc: state.devices.deviceDesc
  }
};

export default connect(mapStateToProps)(DeviceListItem);