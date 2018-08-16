import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SmartAppClient } from 'common';
import * as Actions from '../redux/actions';

const smartAppClient = new SmartAppClient();

class Users extends React.Component {
  componentDidMount() {
    smartAppClient.getUsers().then((users) => {
      this.props.dispatch(Actions.setUsers(users));
    });
  }

  render() {
    return (
      <section className="home-item">
        <h3>Users</h3>
        { Object.values(this.props.users).map((user) =>
            <div className="device-li" key={user.id}>
              <span className="device-li-label">
                {user.displayName}
              </span>
            </div>
          )
        }
        <div className="device-li">
          <span className="device-li-label">
            + Add User
          </span>
        </div>
      </section>
    );
  }
}

Users.propTypes = {
  dispatch: PropTypes.func,
  users: PropTypes.object
}

const mapStateToProps = (state) => {
  return {
    users: state.users
  }
}

export default connect(mapStateToProps)(Users);

