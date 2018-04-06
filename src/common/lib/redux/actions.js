export const UPDATE_DEVICE_DESC = 'UPDATE_DEVICE_DESC';
export const UPDATE_DEVICE_STATUS = 'UPDATE_DEVICE_STATUS';

export function updateDeviceDescription(descriptions) {
  return { type: UPDATE_DEVICE_DESC, desc: descriptions };
}

export function updateDeviceStatus(id, status) {
  return { type: UPDATE_DEVICE_STATUS, id: id, status: status };
}