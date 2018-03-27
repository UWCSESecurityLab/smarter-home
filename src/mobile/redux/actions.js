export const NAVIGATE = 'NAVIGATE';
export const UPDATE_DEVICE_DESC = 'UPDATE_DEVICE_DESC';

export const Views = {
  LOGIN: 'LOGIN',
  HOME: 'HOME'
};

export function navigate(view) {
  return { type: NAVIGATE, view: view };
}

export function updateDeviceDescription(descriptions) {
  return { type: UPDATE_DEVICE_DESC, desc: descriptions };
}