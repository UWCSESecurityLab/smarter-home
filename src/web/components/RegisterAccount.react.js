import React from 'react';
import Button from '@material/react-button';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import SmartAppClient from '../lib/SmartAppClient';
import { Link, Redirect } from 'react-router-dom';
import * as Errors from '../../errors';

import '../css/spinner.scss';

let smartAppClient = new SmartAppClient();

class RegisterAccount extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      username: '',
      displayName: '',
      password: '',
      confirmPassword: '',
      loading: false,
      error: null,
      success: false
    };

    this.register = this.register.bind(this);
    this.updateUsername = this.updateUsername.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
    this.updateDisplayName = this.updateDisplayName.bind(this);
    this.updateConfirmPassword = this.updateConfirmPassword.bind(this);
  }

  register(e) {
    e.preventDefault();
    this.setState({ loading: true });

    if (this.state.password !== this.state.confirmPassword) {
      this.setState({ error: Errors.REGISTER_PW_MISMATCH, loading: false });
      return;
    }

    if (this.state.password.length < 8) {
      this.setState({ error: Errors.REGISTER_PW_TOO_SHORT, loading: false });
      return;
    }

    smartAppClient.register(
        this.state.username,
        this.state.displayName,
        this.state.password,
        this.state.confirmPassword)
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

  updateDisplayName(e) {
    this.setState({ displayName: e.target.value });
  }

  updatePassword(e) {
    this.setState({ password: e.target.value });
  }

  updateConfirmPassword(e) {
    this.setState({ confirmPassword: e.target.value });
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
        { this.state.success ? <Redirect to="/registerSuccess"/> : null}
        <Link to="/" className="link-plain">
          <Button className="back-button"
                  icon={<MaterialIcon icon="arrow_back"/>}>
              Back
          </Button>
        </Link>
        <h3>Create a SmarterHome Account</h3>
        <form id="register-form" onSubmit={this.register}>
          <div>
            <input value={this.state.username}
              onChange={this.updateUsername}
              type="text"
              placeholder="Username"
              autoComplete="username"
              required/>
          </div>
          <div>
            <input value={this.state.displayName}
              onChange={this.updateDisplayName}
              type="text"
              placeholder="Name"
              autoCapitalize="on"
              required/>
          </div>
          <div>
            <input value={this.state.password}
              onChange={this.updatePassword}
              type="password"
              placeholder="Password"
              autoComplete="new-password"
              required/>
          </div>
          <div>
            <input value={this.state.confirmPassword}
              onChange={this.updateConfirmPassword}
              type="password"
              placeholder="Confirm Password"
              autoComplete="new-password"
              required/>
          </div>
        </form>
        <div>
          <Button className="mdc-button-blue auth-button" raised type="submit" form="register-form" disabled={this.state.loading}>
            { this.state.loading
              ? 'Registering...'
              : 'Register'
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

RegisterAccount.propTypes = {
  children: PropTypes.node
}

export default RegisterAccount;