import React from 'react';
import Login from './Login.react';
import Register from './Register.react';
import Button from '@material/react-button';
import { Route, Link } from 'react-router-dom';

class Authenticate extends React.Component {
  constructor(props) {
    super(props);
    this.state = { redirect: null };
    this.switchToRegister = this.switchToRegister.bind(this);
    this.switchToLogin = this.switchToLogin.bind(this);
    this.switchToSuccess = this.switchToSuccess.bind(this);
  }

  switchToRegister() {
    this.setState({ redirect: '/register' });
  }

  switchToLogin() {
    this.setState({ redirect: '/login' });
  }

  switchToSuccess() {
    this.setState({ redirect: '/registerSuccess' });
  }

  render() {
    return (
      <div id="authenticate">
        <Route path="/login" render={() => (
          <Login oauth={false} switchToRegister={this.switchToRegister}/>
        )}/>
        <Route path="/register" render={() => (
          <Register onSuccess={this.switchToSuccess}>
            <Link className="switch-mode" to="/login">Already have an account? Log in</Link>
          </Register>
        )}/>
        <Route path="/registerSuccess" render={() => (
          <div>
            <div id="big-check">✓</div>
            <h2>Registration Successful</h2>
            <div>To continue, install the SmarterHome app in SmartThings.</div>
            <div style={{marginTop: '10px'}}>
              <Link to="/login" style={{textDecoration: 'none'}}>
                <Button onClick={this.switchToLogin} raised>
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        )}/>
      </div>
    );
  }
}

export default Authenticate;