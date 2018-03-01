export const NAVIGATE = 'NAVIGATE';

export const Views = {
  LOGIN: 'LOGIN',
  HOME: 'HOME'
};

export function navigate(view) {
  return { type: NAVIGATE, view: view };
}