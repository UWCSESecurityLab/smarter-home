import React from 'react';
import PropTypes from 'prop-types';
import { SmartAppClient } from 'common';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import * as Actions from '../redux/actions';

const smartAppClient = new SmartAppClient();

class Users extends React.Component {
  componentDidMount() {
    // TODO: move to HomeState
    smartAppClient.listUsers().then((users) => {
      this.props.dispatch(Actions.setUsers(users));
    });
    this.addUser = this.addUser.bind(this);
  }

  addUser() {
    console.log('Users.addUser');
    this.props.history.push(this.props.history.location.pathname + '/addUser');
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
        <div className="device-li" onClick={this.addUser}>
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
  setVisibility: PropTypes.func,
  users: PropTypes.object
}

const mapStateToProps = (state) => {
  return {
    users: state.users
  }
}

export default withRouter(connect(mapStateToProps)(Users));

