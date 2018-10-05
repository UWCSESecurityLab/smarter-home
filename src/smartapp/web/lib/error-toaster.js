import { notify as toast } from 'react-notify-toast';
import { store } from '../redux/reducers';
import * as Actions from '../redux/actions';
import * as Errors from '../../errors';
import SmartAppClient from './SmartAppClient';

const smartAppClient = new SmartAppClient();

export default function(error) {
  console.error(error);
  if (error instanceof Error) {
    smartAppClient.sendClientLog('error', 'Client event handler error', { stack: error.stack });
  }

  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    toast.show('Couldn\'t connect to SmarterHome. Please try again later.', 'error');
  } else if (error instanceof Error) {
    toast.show(error.message, 'error');
  } else if (error.error) {
    switch (error.error) {
      case Errors.DB_ERROR:
        toast.show('SmarterHome database error. please try again later.',
                   'error');
        break;
      case Errors.SESSION_ERROR:
        toast.show('SmarterHome session error. Try logging in and out again.', 'error');
        break;
      case Errors.NOT_LOGGED_IN:
        toast.show('You\'ve been logged out.', 'error');
        store.dispatch(Actions.logout());
        break;
      case Errors.USER_NOT_LINKED:
        toast.show('This account hasn\'t been linked to a home. Please install SmarterHome in the SmartThings app.', 'error');
        break;
      case Errors.SMARTTHINGS_AUTH_ERROR:
        toast.show('Couldn\'t connect to SmartThings. Please try again later.', 'error');
        break;
      case Errors.SMARTTHINGS_ERROR:
        toast.show('There was a problem with SmartThings. Please try again later.', 'error');
        break;
      case Errors.MISSING_PERMISSIONS:
        toast.show('You do not have permission to change this.', 'error');
        break;
      case Errors.MISSING_FIELDS:
        toast.show('Please fill out all of the fields.', 'error');
        break;
      default:
        toast.show(error.error, 'error');
    }
  }
}