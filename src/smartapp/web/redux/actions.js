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

export const SET_ALL_PERMISSIONS = 'SET_ALL_PERMISSIONS';
export function setAllPermissions(permissions) {
  return {
    type: SET_ALL_PERMISSIONS,
    permissions: permissions
  }
}

// Update the value of a permission for a single device.
// The |permission| param is an object, containing the key value pairs for each
// updated permission type -> permission value.
export const UPDATE_PERMISSION = 'UPDATE_PERMISSION';
export function updatePermission({ deviceId, ...permissions }) {
  return {
    type: UPDATE_PERMISSION,
    deviceId: deviceId,
    permissions: permissions,
  }
}

export const ADD_DEVICE_OWNER = 'ADD_DEVICE_OWNER';
export function addDeviceOwner(deviceId, userId) {
  return {
    type: ADD_DEVICE_OWNER,
    deviceId: deviceId,
    userId: userId
  }
}

export const REMOVE_DEVICE_OWNER = 'REMOVE_DEVICE_OWNER';
export function removeDeviceOwner(deviceId, userId) {
  return {
    type: REMOVE_DEVICE_OWNER,
    deviceId: deviceId,
    userId: userId
  }
}

export const ADD_LOCATION_PROMPT = 'ADD_LOCATION_PROMPT';
export function addLocationPrompt(deviceId, capability, command, policy) {
  return {
    type: ADD_LOCATION_PROMPT,
    deviceId: deviceId,
    capability: capability,
    command: command,
    policy: policy
  }
}

export const REMOVE_TOP_PROMPT = 'REMOVE_TOP_PROMPT';
export function removeTopPrompt() {
  return { type: REMOVE_TOP_PROMPT };
}

export const UPDATE_USER_ROLE = 'UPDATE_USER_ROLE';
export function updateUserRole(userId, role) {
  return { type: UPDATE_USER_ROLE, userId: userId, role: role };
}

export const SET_ME = 'SET_ME';
export function setMe(userId) {
  return { type: SET_ME, userId: userId };
}

export const SET_PENDING_COMMAND = 'SET_PENDING_COMMAND';
export function setPendingCommand({ decision, deviceId, command, capability, commandId, nearbyApproval, ownerApproval }) {
  return {
    type: SET_PENDING_COMMAND,
    pendingCommand: {
      capability: capability,
      command: command,
      commandId: commandId,
      decision: decision,
      deviceId: deviceId,
      nearbyApproval: nearbyApproval,
      ownerApproval: ownerApproval
    }
  };
}

export const CHANGE_APPROVAL = 'CHANGE_APPROVAL';
export function changeApproval(commandId, approvalType, approvalState) {
  return {
    type: CHANGE_APPROVAL,
    approvalType: approvalType,
    approvalState: approvalState,
    commandId: commandId,
  };
}

export const CHANGE_DECISION = 'CHANGE_DECISION';
export function changeDecision(commandId, decision) {
  return {
    type: CHANGE_DECISION,
    commandId: commandId,
    decision: decision
  }
}

export const CLEAR_PENDING_COMMAND = 'CLEAR_PENDING_COMMAND';
export function clearPendingCommand()  {
  return { type: CLEAR_PENDING_COMMAND };
}

export const SET_COMMAND_REQUESTS = 'SET_COMMAND_REQUESTS';
export function setCommandRequests(commands) {
  return {
    type: SET_COMMAND_REQUESTS,
    commands: commands
  };
}

export const REMOVE_COMMAND_REQUEST = 'REMOVE_COMMAND_REQUEST';
export function removeCommandRequest(commandId) {
  return { type: REMOVE_COMMAND_REQUEST, commandId: commandId };
}

export const CLEAR_COMMAND_REQUESTS = 'CLEAR_COMMAND_REQUESTS';
export function clearCommandRequests() {
  return { type: CLEAR_COMMAND_REQUESTS };
}

export const START_DEVICE_SPINNER = 'START_DEVICE_SPINNER';
export function startDeviceSpinner(deviceId) {
  return { type: START_DEVICE_SPINNER, deviceId: deviceId };
}

export const STOP_DEVICE_SPINNER = 'STOP_DEVICE_SPINNER';
export function stopDeviceSpinner(deviceId) {
  return { type: STOP_DEVICE_SPINNER, deviceId: deviceId };
}

export const RESET_DEVICE_SPINNERS = 'RESET_DEVICE_SPINNERS';
export function resetDeviceSpinners() {
  return { type: RESET_DEVICE_SPINNERS };
}

export const START_REFRESH_SPINNER = 'START_REFRESH_SPINNER';
export function startRefreshSpinner() {
  return { type: START_REFRESH_SPINNER };
}

export const STOP_REFRESH_SPINNER = 'STOP_REFRESH_SPINNER';
export function stopRefreshSpinner() {
  return { type: STOP_REFRESH_SPINNER };
}
