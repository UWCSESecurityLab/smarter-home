export const UPDATE_FCM_TOKEN = 'UPDATE_FCM_TOKEN';
export function updateFcmToken(fcmToken) {
  return { type: UPDATE_FCM_TOKEN, fcmToken: fcmToken };
}

export const UPDATE_NOTIFICATION_DATA = 'UPDATE_NOTIFICATION_DATA';
export function updateNotificationData(data) {
  return { type: UPDATE_NOTIFICATION_DATA, data: data}
}

export const UPDATE_NOTIFICATIONS_ENABLED = 'UPDATE_NOTIFICATIONS_ENABLED';
export function updateNotificationsEnabled(enabled) {
  return { type: UPDATE_NOTIFICATIONS_ENABLED, enabled: enabled };
}

export const SILENCE_NOTIFICATION_PROMPT = 'SILENCE_NOTIFICATION_PROMPT';
export function silenceNotificationPrompt() {
  return { type: SILENCE_NOTIFICATION_PROMPT };
}

export const ADD_BEACON = 'ADD_BEACON';
export function addNearbyBeacon(region) {
  return { type: ADD_BEACON, region: region };
}

export const REMOVE_BEACON = 'REMOVE_BEACON';
export function removeNearbyBeacon(region) {
  return { type: REMOVE_BEACON, region: region };
}

export const REMOVE_OLD_BEACONS = 'REMOVE_OLD_BEACONS';
export function removeOldBeacons() {
  return { type: REMOVE_OLD_BEACONS };
}

export const LOGIN = 'LOGIN';
export function login() {
  return { type: LOGIN };
}

export const LOGOUT = 'LOGOUT';
export function logout() {
  return { type: LOGOUT };
}

export const SET_USERS = 'SET_USERS';
export function setUsers(users) {
  return { type: SET_USERS, users: users };
}

export const SET_ALL_FLAGS = 'SET_ALL_FLAGS';
export function setAllFlags(flags) {
  return { type: SET_ALL_FLAGS, flags: flags };
}

export const SET_FLAG = 'SET_FLAG';
export function setFlag(flag) {
  return { type: SET_FLAG, flag: flag };
}

export const ADD_BEACON_REGION = 'ADD_BEACON_REGION';
export function addBeaconRegion(beaconRegion) {
  return { type: ADD_BEACON_REGION, beaconRegion: beaconRegion };
}

export const REMOVE_BEACON_REGION = 'REMOVE_BEACON_REGION';
export function removeBeaconRegion(name) {
  return { type: REMOVE_BEACON_REGION, name: name };
}

export const REMOVE_ALL_BEACON_REGIONS = 'REMOVE_ALL_BEACON_REGIONS';
export function removeAllBeaconRegions() {
  return { type: REMOVE_ALL_BEACON_REGIONS };
}

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

export const SET_ROOMS = 'SET_ROOMS'
export function setRooms(rooms) {
  return { type: SET_ROOMS, rooms: rooms };
}

export const ADD_ROOM = 'ADD_ROOM';
export function addRoom(room) {
  return { type: ADD_ROOM, room: room };
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
