export const UPDATE_DEVICE_DESC = 'UPDATE_DEVICE_DESC';
export function updateDeviceDescription(id, desc) {
  return { type: UPDATE_DEVICE_DESC, id: id, desc: desc };
}

export const UPDATE_DEVICE_STATUS = 'UPDATE_DEVICE_STATUS';
export function updateDeviceStatus(id, status) {
  return { type: UPDATE_DEVICE_STATUS, id: id, status: status };
}

export const UPDATE_HOME_CONFIG = 'UPDATE_HOME_CONFIG';
export function updateHomeConfig(config) {
  return { type: UPDATE_HOME_CONFIG, config: config };
}

export const ADD_ROOMS = 'ADD_ROOMS';
export function addRooms(rooms) {
  return { type: ADD_ROOMS, rooms: rooms };
}

export const REMOVE_ROOM = 'REMOVE_ROOM';
export function removeRoom(roomId) {
  return { type: REMOVE_ROOM, roomId: roomId };
}

export const UPDATE_ROOM_NAME = 'UPDATE_ROOM_NAME';
export function updateRoomName(roomId, name) {
  return { type: UPDATE_ROOM_NAME, roomId: roomId, name: name };
}

export const REORDER_DEVICE_IN_ROOM = 'REORDER_DEVICE_IN_ROOM';
export function reorderDeviceInRoom(roomId, startIndex, endIndex) {
  return {
    type: REORDER_DEVICE_IN_ROOM,
    roomId: roomId,
    startIndex: startIndex,
    endIndex: endIndex };
}

export const MOVE_DEVICE_BETWEEN_ROOMS = 'MOVE_DEVICE_BETWEEN_ROOMS';
export function moveDeviceBetweenRooms(
    srcRoomId, destRoomId, srcIndex, destIndex) {
  return {
    type: MOVE_DEVICE_BETWEEN_ROOMS,
    srcRoomId: srcRoomId,
    destRoomId: destRoomId,
    srcIndex: srcIndex,
    destIndex: destIndex
  };
}