export const UPDATE_DEVICE_DESC = 'UPDATE_DEVICE_DESC';
export const UPDATE_DEVICE_STATUS = 'UPDATE_DEVICE_STATUS';
export const UPDATE_HOME_CONFIG = 'UPDATE_HOME_CONFIG';
export const ADD_DEVICE_TO_ROOM = 'ADD_DEVICE_TO_ROOM';
export const REMOVE_DEVICE_FROM_ROOM = 'UPDATE_ROOM_DEVICES';
export const UPDATE_ROOM_NAME = 'UPDATE_ROOM_NAME';

export function updateDeviceDescription(id, desc) {
  return { type: UPDATE_DEVICE_DESC, id: id, desc: desc };
}

export function updateDeviceStatus(id, status) {
  return { type: UPDATE_DEVICE_STATUS, id: id, status: status };
}

export function updateHomeConfig(config) {
  return { type: UPDATE_HOME_CONFIG, config: config };
}

export function updateRoomName(roomId, name) {
  return { type: UPDATE_ROOM_NAME, roomId: roomId, name: name };
}

export function addDeviceToRoom(roomId, deviceId) {
  return { type: ADD_DEVICE_TO_ROOM, roomId: roomId, deviceId: deviceId };
}

export function removeDeviceFromRoom(roomId, deviceId) {
  return { type: REMOVE_DEVICE_FROM_ROOM, roomId: roomId, deviceId: deviceId };
}