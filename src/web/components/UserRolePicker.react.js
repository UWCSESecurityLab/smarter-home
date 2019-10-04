import React from 'react';
import PropTypes from 'prop-types';
import Radio from './Radio.react';
import Roles from '../../roles';

class UserRolePicker extends React.Component {
  render() {
    return (
      <div>
        <Radio name="roles"
              id={Roles.USER}
              checked={this.props.user.role === Roles.USER}
              label={'Standard'}
              onRadioChange={this.props.onChange} />
        <Radio name="roles"
              id={Roles.CHILD}
              checked={this.props.user.role === Roles.CHILD}
              label={'Child: cannot change rooms, users, or permissions'}
              onRadioChange={this.props.onChange} />
        <Radio name="roles"
               id={Roles.GUEST}
               checked={this.props.user.role === Roles.GUEST}
               label={'Guest: cannot change rooms, users, or permissions'}
               onRadioChange={this.props.onChange} />
      </div>
    );
  }
}

UserRolePicker.propTypes = {
  onChange: PropTypes.func,
  user: PropTypes.object,
}

export default UserRolePicker;