import { notify as toast } from 'react-notify-toast';

export default function(error) {
  if (error instanceof Error) {
    toast.show(error.stack, 'error');
  } else {
    if (error.error === 'DB_ERROR') {
      toast.show('SmarterHome database error - please try again later (DB_ERROR)',
                'error');
    } else {
      toast.show(error.error, 'error');
    }
  }
}