import React from 'react';
import Button from '@material/react-button';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import { SmartAppClient } from 'common';
import { Link, Redirect } from 'react-router-dom';

let smartAppClient = new SmartAppClient();

class RegisterAccount extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      username: '',
      password: '',
      confirmPassword: '',
      loading: false,
      error: null,
      success: false
    };

    this.register = this.register.bind(this);
    this.updateUsername = this.updateUsername.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
    this.updateConfirmPassword = this.updateConfirmPassword.bind(this);
  }

  async register(e) {
    e.preventDefault();
    this.setState({ loading: true });

    if (this.state.password !== this.state.confirmPassword) {
      this.setState({ error: 'PW_MISMATCH', loading: false });
    }

    if (this.state.password.length < 8) {
      this.setState({ error: 'PW_TOO_SHORT', loading: false });
    }

    try {
      let res = await smartAppClient.register(
        this.state.username,
        this.state.password,
        this.state.confirmPassword);

      if (res.status === 400) {
        let body = await res.json();
        this.setState({ error: body.message, loading: false });
        return;
      }

      if (res.status !== 200) {
        this.setState({ error: 'UNKNOWN', loading: false });
        return;
      }
      this.setState({ success: true });
    } catch (e) {
      this.setState({ error: 'NETWORK', loading: false});
    }
  }

  updateUsername(e) {
    this.setState({ username: e.target.value });
  }

  updatePassword(e) {
    this.setState({ password: e.target.value });
  }

  updateConfirmPassword(e) {
    this.setState({ confirmPassword: e.target.value });
  }

  render() {
    return (
      <div className="container">
        { this.state.success ? <Redirect to="/registerSuccess"/> : null}
        <Link to="/" className="link-plain">
          <Button className="back-button">
            <MaterialIcon icon="arrow_back"/>
            &nbsp;Back
          </Button>
        </Link>
        <h3>Create a SmarterHome Account</h3>
        <form id="register-form" onSubmit={this.register}>
          <div>
            <input value={this.state.username}
              onChange={this.updateUsername}
              type="text"
              placeholder="Username"
              required/>
          </div>
          <div>
            <input value={this.state.password}
              onChange={this.updatePassword}
              type="password"
              placeholder="Password"
              required/>
          </div>
          <div>
            <input value={this.state.confirmPassword}
              onChange={this.updateConfirmPassword}
              type="password"
              placeholder="Confirm Password"
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
      </div>
    );
  }
}

RegisterAccount.propTypes = {
  children: PropTypes.node
}

export default RegisterAccount;