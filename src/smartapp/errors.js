module.exports = {
  // Whenever Mongoose returns an error instead of a result
  DB_ERROR: 'DB_ERROR',
  // Whenever express session returns an error
  SESSION_ERROR: 'SESSION_ERROR',
  // If the given installedAppId doesn't match an installedApp
  APP_NOT_FOUND: 'APP_NOT_FOUND',
  // If the client makes a request but isn't authenticated
  NOT_LOGGED_IN: 'NOT_LOGGED_IN',
  // If a user doesn't have an associated installedApp
  USER_NOT_LINKED: 'USER_NOT_LINKED',
  // The client supplied a bad username or password
  LOGIN_BAD_USER_PW: 'LOGIN_BAD_USER_PW',
  // Missing a field when registering
  REGISTER_MISSING_FIELD: 'REGISTER_MISSING_FIELD',
  // Password doesn't match confirm password
  REGISTER_PW_MISMATCH: 'REGISTER_PW_MISMATCH',
  // Username exists
  REGISTER_USERNAME_TAKEN: 'REGISTER_USERNAME_TAKEN',
  // Attempted challenge but no user has this key
  CR_UNRECOGNIZED_KEY: 'CR_UNRECOGNIZED_KEY',
  // Attempted response before challenge
  CR_MISSING_CHALLENGE: 'CR_MISSING_CHALLENGE',
  // Couldn't verify signature of challenge
  CR_FAIL: 'CR_FAIL',
  // QR Code has already been scanned
  CR_CODE_USED: 'CR_CODE_USED',
  // Didn't pass flags when updating FCM token
  MISSING_FLAGS: 'MISSING_FLAGS',
  // SmartApp needs to refresh SmartThings token
  SMARTTHINGS_AUTH_ERROR: 'SMARTTHINGS_AUTH_ERROR',
  // Generic SmartThings
  SMARTTHINGS_ERROR: 'SMARTTHINGS_ERROR',
  // Client tried to add/remove a non-existent beacon
  BEACON_NOT_FOUND: 'BEACON_NOT_FOUND',
  // Couldn't find user in database
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  // Couldn't find device in database
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  // User does not have permission to make the request
  MISSING_PERMISSIONS: 'MISSING_PERMISSIONS',
  UNKNOWN: 'UNKNOWN',
}