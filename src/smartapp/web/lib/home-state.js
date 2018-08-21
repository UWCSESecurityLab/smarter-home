import { CommonActions, SmartAppClient } from 'common';
import { store } from '../redux/reducers';
import * as Actions from '../redux/actions';
import * as Flags from '../../flags';

const smartAppClient = new SmartAppClient();

class HomeState {
  // Fetches a fresh copy of the rooms and devices in the house, and replaces
  // everything in the Redux store.
  static resetDevices() {
    return smartAppClient.refreshAccessToken().then(() => {
      return Promise.all([smartAppClient.getHomeConfig(), this.fetchRooms()])
        .then(([config, rooms]) => {
          store.dispatch(CommonActions.updateHomeConfig(config));
          return Promise.all([
            this.fetchAllDeviceDescriptions(rooms),
            this.fetchAllDeviceStatuses(rooms)
          ]);
        });
    });
  }

  static fetchUsers() {
    smartAppClient.listUsers().then((users) => {
      store.dispatch(Actions.setUsers(users));
    });
  }

  // Fetches the descriptions of all of the devices in the given rooms,
  // and stores them in the |deviceDesc| reducer.
  static fetchAllDeviceDescriptions(rooms) {
    Promise.all(this.getDeviceIdsFromRooms(rooms).map((deviceId) => {
      return smartAppClient.getDeviceDescription(deviceId);
    })).then((descs) => {
      descs.forEach((desc) => {
        store.dispatch(CommonActions.updateDeviceDescription(desc.deviceId, desc));
      });

      // Create beacon regions for each beacon device.
      // TODO: reevaluate whether this is the right place for this code.
      if (window.cordova &&
          store.getState().flags.nearbyNotifications ===
            Flags.NearbyNotifications.ON) {
        descs.filter((desc) => desc.deviceTypeName === 'beacon')
          .forEach((beacon) => {
            store.dispatch(Actions.addBeaconRegion(beacon));
          });
      }
    });
  }

  // Fetches the status of all of the devices in the given rooms,
  // and stores them in the |deviceStatus| reducer.
  static fetchAllDeviceStatuses(rooms) {
    Promise.all(this.getDeviceIdsFromRooms(rooms).map((deviceId) => {
      return smartAppClient.getDeviceStatus(deviceId);
    })).then((statuses) => {
      statuses.forEach((status) => {
        store.dispatch(CommonActions.updateDeviceStatus(status.deviceId, status.status));
      });
    });
  }

  // Fetches all rooms from the server, and replaces the |rooms| reducer with
  // the new rooms. Returns the rooms fetched.
  static fetchRooms() {
    return smartAppClient.getRooms().then((rooms) => {
      let idToRoom = Object.assign({}, ...rooms.map((room) => {
        return { [room.roomId]: room }
      }));
      store.dispatch(CommonActions.setRooms(idToRoom));
      return idToRoom;
    });
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
}

export default HomeState;