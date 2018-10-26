import React from 'react';
import Button from '@material/react-button';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import SmartAppClient from '../lib/SmartAppClient';
import { Link, Redirect } from 'react-router-dom';
import * as Errors from '../../errors';

import '../css/spinner.scss';

let smartAppClient = new SmartAppClient();

class ChangePassword extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      username: '',
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
      loading: false,
      error: null,
      success: false
    };

    this.change = this.change.bind(this);
    this.updateUsername = this.updateUsername.bind(this);
    this.updateOldPassword = this.updateOldPassword.bind(this);
    this.updateNewPassword = this.updateNewPassword.bind(this);
    this.updateConfirmNewPassword = this.updateConfirmNewPassword.bind(this);
  }

  change(e) {
    e.preventDefault();
    this.setState({ loading: true });

    if (this.state.newPassword !== this.state.confirmNewPassword) {
      this.setState({ error: Errors.REGISTER_PW_MISMATCH, loading: false });
      return;
    }

    if (this.state.newPassword.length < 8) {
      this.setState({ error: Errors.REGISTER_PW_TOO_SHORT, loading: false });
      return;
    }

    if (this.state.newPassword === this.state.oldPassword) {
      this.setState({ error: Errors.REUSE_OLD_PASSWORD, loading: false });
      return;
    }

    smartAppClient.changePassword(
        this.state.username,
        this.state.oldPassword,
        this.state.newPassword,
        this.state.confirmNewPassword)
    .then(() => {
      this.setState({ success: true });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
      if (err.error) {
        this.setState({ error: err.error });
      } else if (err.name === 'TypeError') {
        this.setState({ error: 'NETWORK' });
      } else {
        this.setState({ error: 'UNKNOWN' });
      }
    });
  }

  updateUsername(e) {
    this.setState({ username: e.target.value });
  }

  updateOldPassword(e) {
    this.setState({ oldPassword: e.target.value });
  }

  updateNewPassword(e) {
    this.setState({ newPassword: e.target.value });
  }

  updateConfirmNewPassword(e) {
    this.setState({ confirmNewPassword: e.target.value });
  }

  render() {
    let errorMessage;
    if (this.state.error) {
      switch (this.state.error) {
        case 'NETWORK':
          errorMessage = 'Couldn\'t connect to the SmartApp server.';
          break;
        case Errors.REGISTER_MISSING_FIELD:
          errorMessage = 'Missing a field; please fill out all fields.';
          break;
        case Errors.REGISTER_PW_MISMATCH:
          errorMessage = 'Passwords don\'t match. Please try again.';
          break;
        case Errors.REGISTER_USERNAME_TAKEN:
          errorMessage = 'Username has already been taken';
          break;
        case Errors.REGISTER_PW_TOO_SHORT:
          errorMessage = 'Password is too short. It must be at least 8 characters long.';
          break;
        case Errors.DB_ERROR:
          errorMessage = 'SmartApp database error. Please try again later.';
          break;
        case Errors.REUSE_OLD_PASSWORD:
          errorMessage = 'You cannot reuse your old password. Please choose a new password.';
          break;
        default:
          errorMessage = 'Unknown error: ' + this.state.error;
      }
    }

    let error = this.state.error ? (
      <div className="alert alert-danger" role="alert" id="error">
        {errorMessage}
      </div>
    ) : null;

    return (
      <div className="container">
        { this.state.success ? <Redirect to="/passwordChanged"/> : null}
        <Link to="/" className="link-plain">
          <Button className="back-button"
                  icon={<MaterialIcon icon="arrow_back"/>}>
              Back
          </Button>
        </Link>
        <h3>Change your SmarterHome password</h3>
        <form id="change-password" onSubmit={this.change}>
          <div>
            <input value={this.state.username}
              onChange={this.updateUsername}
              type="text"
              placeholder="Username"
              autoComplete="username"
              required/>
          </div>
          <div>
            <input value={this.state.oldPassword}
              onChange={this.updateOldPassword}
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              required/>
          </div>
          <div>
            <input value={this.state.newPassword}
              onChange={this.updateNewPassword}
              type="password"
              placeholder="Password"
              autoComplete="new-password"
              required/>
          </div>
          <div>
            <input value={this.state.confirmNewPassword}
              onChange={this.updateConfirmNewPassword}
              type="password"
              placeholder="Confirm Password"
              autoComplete="new-password"
              required/>
          </div>
        </form>
        <div>
          <Button className="mdc-button-blue auth-button" raised type="submit" form="change-password" disabled={this.state.loading}>
            { this.state.loading
              ? 'Changing...'
              : 'Submit'
            }
          </Button>
          { this.state.loading
            ? <span className="spinner" id="spinner" aria-hidden="true"></span>
            : null
          }
          </div>
          {error}
      </div>
    );
  }
}

ChangePassword.propTypes = {
  children: PropTypes.node
}

export default ChangePassword;