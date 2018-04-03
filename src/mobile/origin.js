// The scheme + hostname + port of the SmartApp server.

// This IP allows the Android emulator to connect to the SmartApp server on the
// host machine.
const EMULATOR_ORIGIN = 'http://10.0.2.2:5000'

// This hostname exposes selenium's SmartApp server to other hosts on CSE-Local.
// Used for physical phone devices.
const DEVICE_ORIGIN = 'http://selenium.dyn.cs.washington.edu:5000'

export default DEVICE_ORIGIN;