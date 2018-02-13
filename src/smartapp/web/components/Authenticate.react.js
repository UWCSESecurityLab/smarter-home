import React from 'react';
import Login from './Login.react';
import Register from './Register.react';

class Authenticate extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = { mode: 'LOGIN' };

    this.switchToRegister = this.switchToRegister.bind(this);
    this.switchToLogin = this.switchToLogin.bind(this);
  }

  switchToRegister() {
    this.setState({ mode: 'REGISTER' });
  }

  switchToLogin() {
    this.setState({ mode: 'LOGIN' });
  }

  render() {
    if (this.state.mode === 'LOGIN') {
      return (
        <div>
          <Login/>
          <a onClick={this.switchToRegister}>Create an account</a>
        </div>
      );
    } else if (this.state.mode === 'REGISTER') {
      return (
        <div>
          <Register/>
          <a onClick={this.switchToLogin}>Already have an account? Log in</a>
        </div>
      );
    } else {
      console.log(this.state.mode);
    }
  }
}

module.exports = Authenticate;