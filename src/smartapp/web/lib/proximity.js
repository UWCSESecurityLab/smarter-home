import { store } from '../redux/reducers';

// Returns true if the user is near the given device. More precisely, returns
// true if the user's phone detected the beacon in the same room as the device,
// the last time the nearby beacon reducer was updated.
export function userIsNearDevice(deviceId) {
  const state = store.getState();
  const deviceDesc = state.devices.deviceDesc;
  const nearbyBeacons = state.beacons.nearbyBeacons;
  const rooms = state.devices.rooms;

  const roomOfDevice = Object.values(rooms).find((r) => {
    return r.devices.includes(deviceId);
  });

  const beaconsInRoomOfDevice = roomOfDevice.devices.filter((device) =>
    deviceDesc[device] && deviceDesc[device].deviceTypeName === 'beacon'
  );

  return beaconsInRoomOfDevice
    .filter((beacon) =>
      Object.keys(nearbyBeacons).includes(beacon)).length > 0;
}