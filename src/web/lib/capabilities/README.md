## Device Capability Helpers
This directory contains helpers for accessing the descriptions and states of
devices, and executing commands on devices.

### Usage
Each supported capability has a class, which contains static methods to access
its status, description, and commands that can be executed. You must pass in
the device id for each method call.

For example, the ```Switch``` class has the methods:
- ```Switch.on(deviceId)``` - command
- ```Switch.off(deviceId)``` - command
- ```Switch.status(deviceId)``` - status accessor
- ```Switch.name(deviceId)``` -- description accessor

### Implementation
All classes contain only static methods, because accessors read from the redux
store, and commands update the redux store, so that we can keep the single
source of truth in redux.

There are two super abstract classes that the others inherit from:
- Capability, which has common accessors for description like device name, etc.
- Actuatable, which contains common code for executing commands and updating redux

Each individual capability class will implement specific functions, like getting
the most important status (i.e. for displaying on the device toggles).

Subclasses of actuatable capabilities also implement
```cordova-plugin-local-notification``` event handlers for notification actions.