import React from 'react';
import Button from '@material/react-button';
import HomeState from '../lib/home-state';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import strToColor from '../lib/strToColor';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

class Users extends React.Component {
  constructor(props) {
    super(props);
    this.addUser = this.addUser.bind(this);
  }

  componentDidMount() {
    HomeState.fetchUsers();
  }

  addUser() {
    this.props.history.push(this.props.history.location.pathname + '/addUser');
  }

  render() {
    return (
      <section className="home-item">
        <h3>Users</h3>
        { Object.values(this.props.users).map((user) =>
            <div className="user-li" key={user.id}>
              <MaterialIcon icon="mood" style={{ color: strToColor(user.id)}}/>
              <span className="user-li-label">
                {user.displayName}
              </span>
            </div>
          )}
        <Button onClick={this.addUser}>
          + Add User
        </Button>
      </section>
    );
  }
}

Users.propTypes = {
  dispatch: PropTypes.func,
  history: PropTypes.object,
  setVisibility: PropTypes.func,
  users: PropTypes.object
}

const mapStateToProps = (state) => {
  return {
    users: state.users
  }
}

export default withRouter(connect(mapStateToProps)(Users));

