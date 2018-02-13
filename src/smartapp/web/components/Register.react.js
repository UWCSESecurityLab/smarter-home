import React from 'react';
import xhr from 'xhr';

class Register extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      username: '',
      password: '',
      confirmPassword: '',
      loading: false,
      error: null
    };

    this.register = this.register.bind(this);
    this.updateUsername = this.updateUsername.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
    this.updateConfirmPassword = this.updateConfirmPassword.bind(this);
  }

  register(e) {
    e.preventDefault();
    this.setState({ loading: true });

    if (this.state.password !== this.state.confirmPassword) {
      this.setState({ error: 'PW_MISMATCH', loading: false });
    }

    if (this.state.password.length < 8) {
      this.setState({ error: 'PW_TOO_SHORT', loading: false });
    }

    xhr.post({
      url: `http://localhost:5000/register?username=${this.state.username}&password=${this.state.password}&confirm=${this.state.confirmPassword}`
    }, (err, resp, body) => {
      if (err) {
        this.setState({ error: 'NETWORK', loading: false});
        return;
      } else if (resp.statusCode === 400) {
        if (body.message == 'ACCOUNT_EXISTS') {
          this.setState({ error: 'ACCOUNT_EXISTS', loading: false});
        }
      } else if (resp.statusCode == 200) {
        xhr.post({
          url: `http://localhost:5000/login?username=${this.state.username}&password=${this.state.password}`
        }, (err, resp) => {
          if (err || resp.statusCode !== 200) {
            this.setState({ error: 'UNKNOWN', loading: false });
          }
          window.location.href = '/home';
        });
      } else {
        this.setState({ error: 'UNKNOWN', loading: false });
      }
    });
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
      <div>
        <h3 className="login-text">Register for Smart Home</h3>
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
              placeholder="Type your password again to confirm"
              required/>
          </div>
        </form>
        <div>
          <button type="submit" form="register-form" disabled={this.state.loading}>
            { this.state.loading
              ? 'Registering...'
              : 'Register'
            }
          </button>
          { this.state.loading
            ? <span className="spinner" id="spinner" aria-hidden="true"></span>
            : null
          }
        </div>
      </div>
    );
  }
}

module.exports = Register;