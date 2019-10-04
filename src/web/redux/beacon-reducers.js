import * as Actions from './actions';

export function activeBeaconRegions(state = JSON.parse(localStorage.getItem('beaconRegions')), action) {
  switch (action.type) {
    case Actions.ADD_BEACON_REGION: {
      const newState = Object.assign({}, state,
          { [action.beaconRegion.name]: action.beaconRegion });
      localStorage.setItem('beaconRegions', JSON.stringify(newState));
      return newState;
    }
    case Actions.REMOVE_BEACON_REGION: {
      const newState = Object.assign({}, state);
      delete newState[action.name];
      localStorage.setItem('beaconRegions', JSON.stringify(newState));
      return newState;
    }
    case Actions.REMOVE_ALL_BEACON_REGIONS: {
      localStorage.setItem('beaconRegions', JSON.stringify({}));
      return {};
    }
    default:
      return state;
  }
}

export function nearbyBeacons(state = {}, action) {
  switch (action.type) {
    case Actions.ADD_BEACON: {
      let res = Object.assign({}, state, { [action.region.identifier]: action.region });
      return res;
    }
    case Actions.REMOVE_BEACON: {
      let newState = Object.assign({}, state);
      delete newState[action.region.identifier];
      return newState;
    }
    case Actions.REMOVE_OLD_BEACONS: {
      let newState = Object.assign({}, state);
      let now = Date.now();
      for (let key in newState) {
        // Filter out beacons updated more than 30 seconds ago.
        let beacon = newState[key];
        if (beacon.timestamp + 5000 < now) {
          delete newState[key];
        }
      }
      return newState;
    }
    default:
      return state;
  }
}