import React from 'react';
import PropTypes from 'prop-types';
import Radio from './Radio.react';
import Roles from '../../roles';
import SmartAppClient from '../lib/SmartAppClient';
import toastError from '../lib/error-toaster';
import * as Actions from '../redux/actions';
import { connect } from 'react-redux';

const smartAppClient = new SmartAppClient();

class UserRolePicker extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  onChange(_, role) {
    smartAppClient.updateUserRole(this.props.user.id, role).then(() => {
      this.props.dispatch(Actions.updateUserRole(this.props.user.id, role))
    }).catch(toastError);
  }

  render() {
    return (
      <div>
        <Radio name="roles"
              id={Roles.USER}
              checked={this.props.user.role === Roles.USER}
              label={'Standard User'}
              onRadioChange={this.onChange} />
        <Radio name="roles"
              id={Roles.CHILD}
              checked={this.props.user.role === Roles.CHILD}
              label={'Child: cannot change rooms, users, or permissions'}
              onRadioChange={this.onChange} />
        <Radio name="roles"
               id={Roles.GUEST}
               checked={this.props.user.role === Roles.GUEST}
               label={'Guest: cannot change rooms, users, or permissions'}
               onRadioChange={this.onChange} />
      </div>
    );
  }
}

UserRolePicker.propTypes = {
  dispatch: PropTypes.func,
  user: PropTypes.object,
}

export default connect()(UserRolePicker);