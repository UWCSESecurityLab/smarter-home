import { CommonActions, SmartAppClient } from 'common';
import { store } from '../redux/reducers';

const smartAppClient = new SmartAppClient();

class HomeState {
  // Fetches a fresh copy of the rooms and devices in the house, and replaces
  // everything in the Redux store.
  static async reset() {
    return Promise.all([smartAppClient.getHomeConfig(), this.fetchRooms()])
      .then(([config, rooms]) => {
        // Once homeConfig has been fetched, fetch device descs and statuses
        store.dispatch(CommonActions.updateHomeConfig(config));
        this.fetchAllDeviceDescriptions(rooms);
        this.fetchAllDeviceStatuses(rooms);
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
      if (window.cordova) {
        descs.filter((desc) => desc.deviceTypeName === 'beacon')
          .forEach((beacon) => {
            console.log('Adding region for beacon:');
            console.log(beacon);
            let region = new cordova.plugins.locationManager.BeaconRegion(
              beacon.name,
              beacon.uuid,
              beacon.major,
              beacon.minor
            );
            cordova.plugins.locationManager.startMonitoringForRegion(region)
              .fail((e) => { console.error(e) })
              .done();
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
      let idToRoom = rooms.map((room) => {
        return { [room.roomId]: room }
      })
      store.dispatch(CommonActions.setRooms(idToRoom));
      return Object.assign({}, ...idToRoom);
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
    console.log(rooms);
    return Object.values(rooms)
      .map((room => room.devices))
      .reduce((accumulator, current) => { return accumulator.concat(current) });
  }
}

export default HomeState;