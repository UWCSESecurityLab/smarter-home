import React from 'react';
import xhr from 'xhr';
import qs from 'querystring';

class Login extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      username: '',
      password: '',
      loading: false,
      error: null
    };

    this.login = this.login.bind(this);
    this.updateUsername = this.updateUsername.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
  }

  login(e) {
    e.preventDefault();
    this.setState({ loading: true });

    let query = qs.stringify({
      username: this.state.username,
      password: this.state.password,
      oauth: this.props.oauth
    });

    xhr.post({
      url: 'http://localhost:5000/login?' + query
    }, (err, res, body) => {
      if (err) {
        this.setState({ error: 'NETWORK', loading: false});
        return;
      }
      if (res.statusCode === 401) {
        this.setState({ error: 'BAD_USER_PW', loading: false});
        return;
      } else if (res.statusCode === 200) {
        try {
          if (this.props.oauth) {
            // Shouldn't get here... should just receive a 302 redirect?
            // window.location.href =
            //   'https://api.smartthings.com/oauth/callback?token=' +
            //   JSON.parse(body).token;
          } else {
            window.location.href = '/deviceStatus';
          }
        } catch (e) {
          this.setState({ error: 'UNKNOWN', loading: false});
        }
      } else {
        this.setState({ error: 'UNKNOWN', loading: false});
      }
    });
  }

  updateUsername(e) {
    this.setState({ username: e.target.value });
  }

  updatePassword(e) {
    this.setState({ password: e.target.value });
  }

  render() {
    let errorMessage;
    if (this.state.error) {
      switch (this.state.error) {
        case 'NETWORK':
          errorMessage = 'Couldn\'t connect to the SmartApp server.';
          break;
        case 'BAD_USER_PW':
          errorMessage = 'Incorrect email/username or password - please try again.';
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
        <h2 className="login-text">Log into Smart Notifications</h2>
        <form id="login-form" onSubmit={this.login}>
          <div className="form-group">
            <input value={this.state.username}
              onChange={this.updateUsername}
              type="text"
              className="form-control"
              placeholder="Username"
              required/>
          </div>
          <div className="form-group">
            <input value={this.state.password}
              onChange={this.updatePassword}
              type="password"
              className="form-control"
              id="password"
              placeholder="Password"
              required/>
          </div>
        </form>
        <div>
          <button className="btn btn-primary" type="submit" form="login-form" disabled={this.state.loading}>
            { this.state.loading
              ? 'Signing In...'
              : 'Sign In'
            }
          </button>
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

module.exports = Login;
