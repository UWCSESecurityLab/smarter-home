import React from 'react';
import Button from '@material/react-button';
import ChangePassword from './ChangePassword.react';
import Login from './Login.react';
import MaterialIcon from '@material/react-material-icon';
import RegisterAccount from './RegisterAccount.react';
import RegisterKey from './RegisterKey.react';
import { Route, Link } from 'react-router-dom';

import '../css/authenticate.scss';

class Authenticate extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id="authenticate">
        <Route exact path="/" render={() => (
          <div>
            <h3>Welcome to SmarterHome</h3>
            <div id="intro-text">To get started, pick an option below.</div>
            <Link to="/register" className="link-plain">
              <div className="option">
                <MaterialIcon className="intro-icon" icon="home" style={{fontSize: '36px', color: '#59A2EC'}}/>
                <div>
                  <h4>Set Up SmarterHome</h4>
                  <div className="subtitle">
                    Get SmarterHome running in your home.
                  </div>
                </div>
              </div>
            </Link>
            <Link to="/join" className="link-plain">
              <div className="option">
                <MaterialIcon className="intro-icon" icon="person_add" style={{fontSize: '36px', color: '#679960'}}/>
                <div>
                  <h4>Join an Existing Home</h4>
                  <div className="subtitle">
                    Join a SmarterHome that has already been set up.
                  </div>
                </div>
              </div>
            </Link>
            <Link to="/login" className="link-plain">
              <div className="option">
                <MaterialIcon className="intro-icon" icon="input" style={{fontSize: '36px', color: '#593F8E'}}/>
                <div>
                  <h4>Log In</h4>
                  <div className="subtitle">
                    If you made a password when setting up, log in here.
                  </div>
                </div>
              </div>
            </Link>
            <Link to="/changePassword" className="link-plain">
              <div className="option option-bottom">
                <MaterialIcon className="intro-icon" icon="lock" style={{fontSize: '36px', color: '#E34232'}}/>
                <div>
                  <h4>Change Password</h4>
                </div>
              </div>
            </Link>
          </div>
        )} />
        <Route path="/login" render={() => (
          <Login oauth={false}/>
        )}/>
        <Route path="/register" component={RegisterAccount}/>
        <Route path="/join" component={RegisterKey}/>
        <Route path="/changePassword" component={ChangePassword}/>
        <Route path="/registerSuccess" render={() => (
          <div>
            <div id="big-check">✓</div>
            <h2>Registration Successful</h2>
            <div>To continue, install the SmarterHome SmartApp in the SmartThings app.</div>
            <div style={{marginTop: '10px'}}>
              <Link to="/" className="link-plain">
                <Button className="back-button"
                        icon={<MaterialIcon icon="arrow_back"/>}>
                    Back
                </Button>
              </Link>
            </div>
          </div>
        )}/>
        <Route path="/passwordChanged" render={() => (
          <div>
            <div id="big-check">✓</div>
            <h2>Password Changed</h2>
            <div>Please log in again on all of your devices.</div>
            <div style={{marginTop: '10px'}}>
              <Link to="/" className="link-plain">
                <Button className="back-button"
                        icon={<MaterialIcon icon="arrow_back"/>}>
                    Back
                </Button>
              </Link>
            </div>
          </div>
        )}/>
        { process.env.NODE_ENV === 'development'
          ? <div id="dev-flag">Running in Dev Environment</div>
          : null
        }
      </div>
    );
  }
}

export default Authenticate;