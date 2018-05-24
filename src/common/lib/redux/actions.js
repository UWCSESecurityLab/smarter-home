export const UPDATE_DEVICE_DESC = 'UPDATE_DEVICE_DESC';
export const UPDATE_DEVICE_STATUS = 'UPDATE_DEVICE_STATUS';
export const UPDATE_HOME_CONFIG = 'UPDATE_HOME_CONFIG';

export function updateDeviceDescription(id, desc) {
  return { type: UPDATE_DEVICE_DESC, id: id, desc: desc };
}

export function updateDeviceStatus(id, status) {
  return { type: UPDATE_DEVICE_STATUS, id: id, status: status };
}

export function updateHomeConfig(config) {
  return { type: UPDATE_HOME_CONFIG, config: config };
}