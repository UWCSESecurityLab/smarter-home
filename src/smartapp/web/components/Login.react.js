import React from 'react';
import xhr from 'xhr';

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

    xhr.post({
      url: `http://localhost:5000/login?username=${this.state.username}&password=${this.state.password}`
    }, (err, resp, body) => {
      if (err) {
        this.setState({ error: 'NETWORK', loading: false});
        return;
      }
      if (resp.statusCode === 401) {
        this.setState({ error: 'BAD_USER_PW', loading: false});
        return;
      } else if (resp.statusCode === 200) {
        window.location.href = '/home';
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
        <h3 className="login-text">Log into Smart Home</h3>
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
