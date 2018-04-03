import DeviceInfo from 'react-native-device-info';

let host;
if (DeviceInfo.isEmulator()) {
  host = 'http://10.0.2.2:5000';
} else {
  host = 'http://selenium.dyn.cs.washington.edu:5000';
}
console.log('HOST = ' + host);
export default host;