import toastError from '../lib/error-toaster';
import SmartAppClient from './SmartAppClient';
import { store } from '../redux/reducers';
import * as Actions from '../redux/actions';
import Notifications from './notifications/notifications';

const smartAppClient = new SmartAppClient();

class HomeState {
  // Fetches a fresh copy of the rooms and devices in the house, and replaces
  // everything in the Redux store.
  static resetDevices() {
    store.dispatch(Actions.startRefreshSpinner());
    return Promise.all([smartAppClient.getHomeConfig(), this.fetchRooms()])
      .then(([config, rooms]) => {
        store.dispatch(Actions.updateHomeConfig(config));
        return Promise.all([
          this.fetchAllDeviceDescriptions(rooms),
          this.fetchAllDeviceStatuses(rooms),
          this.fetchAllDevicePermissions(rooms)
        ]);
      }).catch(toastError)
      .finally(() => {
        store.dispatch(Actions.stopRefreshSpinner());
      });
  }

  static fetchUsers() {
    smartAppClient.listUsers().then((users) => {
      store.dispatch(Actions.setUsers(users));
    }).catch(toastError);

    smartAppClient.getUser('me').then((user) => {
      store.dispatch(Actions.setMe(user.id));
    });
  }

  // Fetches the descriptions of all of the devices in the given rooms,
  // and stores them in the |deviceDesc| reducer.
  static fetchAllDeviceDescriptions(rooms) {
    return Promise.all(this.getDeviceIdsFromRooms(rooms).map((deviceId) => {
      return smartAppClient.getDeviceDescription(deviceId);
    })).then((descs) => {
      descs.forEach((desc) => {
        store.dispatch(Actions.updateDeviceDescription(desc.deviceId, desc));
      });
      this.resetBeaconRegions();
    }).catch(toastError);
  }

  // Ensure beacon regions exist for each beacon device.
  // Safe to call even if beacon regions exist
  static resetBeaconRegions() {
    console.log('resetBeaconRegions called');
    if (window.cordova) {
      console.log(store.getState().devices.deviceDesc);
      Object.values(store.getState().devices.deviceDesc)
        .filter((desc) => desc.deviceTypeName === 'beacon')
        .forEach((beacon) => {
          console.log(beacon);
          store.dispatch(Actions.addBeaconRegion(beacon));
        });
    }
  }

  // Fetches the status of all of the devices in the given rooms,
  // and stores them in the |deviceStatus| reducer.
  static fetchAllDeviceStatuses(rooms) {
    const deviceIds = this.getDeviceIdsFromRooms(rooms);
    return Promise.all(deviceIds.map((deviceId) => {
      store.dispatch(Actions.startDeviceSpinner(deviceId));
      return smartAppClient.getDeviceStatus(deviceId);
    })).then((statuses) => {
      statuses.forEach((status) => {
        store.dispatch(Actions.stopDeviceSpinner(status.deviceId));
        store.dispatch(Actions.updateDeviceStatus(status.deviceId, status.status));
      });
    }).catch((err) => {
      deviceIds.forEach((deviceId) => {
        store.dispatch(Actions.stopDeviceSpinner(deviceId));
      });
      toastError(err);
    });
  }

  // Fetches all rooms from the server, and replaces the |rooms| reducer with
  // the new rooms. Returns the rooms fetched.
  static fetchRooms() {
    return smartAppClient.getRooms().then((rooms) => {
      let idToRoom = Object.assign({}, ...rooms.map((room) => {
        return { [room.roomId]: room }
      }));
      store.dispatch(Actions.setRooms(idToRoom));
      return idToRoom;
    });
  }

  static fetchAllDevicePermissions(rooms) {
    return Promise.all(this.getDeviceIdsFromRooms(rooms).map((deviceId) => {
      return smartAppClient.getPermissions(deviceId);
    })).then((permissions) => {
      const idToPermission = Object.assign({}, ...permissions.map((permission) => {
        return { [permission.deviceId]: permission };
      }));
      store.dispatch(Actions.setAllPermissions(idToPermission));
    }).catch(toastError);
  }

  // Flattens |homeConfig|, an object of arrays, into a single array containing
  // all the deviceIds of the devices in the home.
  static getDeviceIdsFromHomeConfig(homeConfig) {
    return Object.values(homeConfig).reduce((accumulator, current) => {
      return accumulator.concat(current)
    });
  }

  // Flattens the rooms object from Redux into a single array containing
  // all the deviceIds of the devices in the home.
  static getDeviceIdsFromRooms(rooms) {
    return Object.values(rooms)
      .map((room => room.devices))
      .reduce((accumulator, current) => { return accumulator.concat(current) });
  }

  static fetchPendingCommands() {
    smartAppClient.getPendingCommands().then((commands) => {
      let relevantCommands = commands.filter((command) => {
        return Notifications.shouldAskUser(command);
      });

      let map = relevantCommands.reduce((accumulator, current) => {
        accumulator[current.id] = current;
        return accumulator;
      }, {});

      store.dispatch(Actions.setCommandRequests(map));
    });
  }
}

export default HomeState;