import { NAVIGATE, Views } from './actions';
import { combineReducers } from 'redux';

const initialState = {
  view: Views.LOGIN
}

function view(state = Views.LOGIN, action) {
  switch (action.type) {
    case NAVIGATE:
      return action.view
    default:
      return state
  }
}

const reducers = combineReducers({ view: view });

export default reducers;