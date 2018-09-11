import React from 'react';
import Button from '@material/react-button';
import HomeState from '../lib/home-state';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import Roles from '../../roles';
import strToColor from '../lib/strToColor';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

class Users extends React.Component {
  constructor(props) {
    super(props);
    this.addUser = this.addUser.bind(this);
    this.showUserModal = this.showUserModal.bind(this);
  }

  componentDidMount() {
    HomeState.fetchUsers();
  }

  addUser() {
    this.props.history.push(this.props.history.location.pathname + '/addUser');
  }

  showUserModal(userId) {
    if (this.props.me && this.props.me.role === Roles.USER) {
      this.props.history.push(
        `${this.props.history.location.pathname}/user/${userId}`
      );
    }
  }

  render() {
    return (
      <section className="home-item">
        <h3>Users</h3>
        { Object.values(this.props.users).map((user) =>
            <div className="user-li"
                 key={user.id}
                 onClick={() => { this.showUserModal(user.id) }}>
              <span style={{display: 'flex', alignItems: 'center'}}>
                <MaterialIcon icon="mood" style={{ color: strToColor(user.id)}}/>
                <span className="user-li-label">
                  {user.displayName}
                </span>
                { user.id === this.props.me.id
                  ? <span className="user-you-label">You</span>
                  : null
                }
              </span>
              { this.props.me.role === Roles.USER
                ? <MaterialIcon icon="chevron_right" style={{ color: '#8c8c8c'}} />
                : null
              }
            </div>
          )}
        { this.props.me.role === Roles.USER
          ? <Button onClick={this.addUser}>
              + Add User
            </Button>
          : null
        }
      </section>
    );
  }
}

Users.propTypes = {
  dispatch: PropTypes.func,
  history: PropTypes.object,
  setVisibility: PropTypes.func,
  users: PropTypes.object,
  me: PropTypes.object,
}

const mapStateToProps = (state) => {
  return {
    users: state.users,
    me: state.users[state.me] ? state.users[state.me] : {}
  }
}

export default withRouter(connect(mapStateToProps)(Users));

