import React from 'react';
import Login from './Login.react';
import Register from './Register.react';
import Button from '@material/react-button';

class Authenticate extends React.Component {
  constructor(props) {
    super(props);
    this.state = { mode: 'LOGIN' };
    this.switchToRegister = this.switchToRegister.bind(this);
    this.switchToLogin = this.switchToLogin.bind(this);
    this.switchToSuccess = this.switchToSuccess.bind(this);
  }

  switchToRegister() {
    this.setState({ mode: 'REGISTER' });
  }

  switchToLogin() {
    this.setState({ mode: 'LOGIN' });
  }

  switchToSuccess() {
    this.setState({ mode: 'REGISTER_SUCCESS' });
  }

  render() {
    if (this.state.mode === 'LOGIN') {
      return (
        <div id="authenticate">
          <Login oauth={false} switchToRegister={this.switchToRegister}>

          </Login>
        </div>
      );
    } else if (this.state.mode === 'REGISTER') {
      return (
        <div id="authenticate">
          <Register onSuccess={this.switchToSuccess}>
            <a className="switch-mode" onClick={this.switchToLogin}>Already have an account? Log in</a>
          </Register>
        </div>
      );
    } else if (this.state.mode === 'REGISTER_SUCCESS') {
      return (
        <div id="authenticate">
          <div id="big-check">✓</div>
          <h2>Registration Successful</h2>
          <div>To continue, install the SmarterHome app in SmartThings.</div>
          <div>
            <Button onClick={this.switchToLogin}>
              Back to Login
            </Button>
          </div>
        </div>
      )
    } else {
      console.log(this.state.mode);
    }
  }
}

export default Authenticate;