import * as Views from '../views';

export const NAVIGATE = 'NAVIGATE';

export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export function loginSuccess() {
  return { type: NAVIGATE, view: Views.DEVICES }
}