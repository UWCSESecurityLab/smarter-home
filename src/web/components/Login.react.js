import React from 'react';
import Button from '@material/react-button';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import SmartAppClient from '../lib/SmartAppClient';
import * as Actions from '../redux/actions';
import * as Errors from '../../errors';

import '../css/authenticate.scss';
import '../css/spinner.scss';

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      loading: false,
      error: null,
      authenticated: false,
      dispatch: null,
      link: null,
    };

    this.login = this.login.bind(this);
    this.updateUsername = this.updateUsername.bind(this);
    this.updatePassword = this.updatePassword.bind(this);

    this.smartAppClient = new SmartAppClient(this.props.oauth);
  }

  componentDidMount() {
    if (!this.props.oauth) {
      import('../redux/reducers').then((module) => {
        this.setState({ dispatch: module.store.dispatch });
      });
      import('react-router-dom').then((module) => {
        this.setState({ link: module.Link });
      });
    }
  }

  login(e) {
    e.preventDefault();
    this.setState({ loading: true });

    this.smartAppClient.login(
      this.state.username,
      this.state.password,
      this.props.oauth,
      this.props.oauthState
    ).then((response) => {
      if (this.props.oauth) {
        window.location.href = response.redirect;
      } else {
        this.state.dispatch(Actions.login());
      }
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

  updatePassword(e) {
    this.setState({ password: e.target.value });
  }

  render() {
    let errorMessage;
    let Link = this.state.link;

    if (this.state.error) {
      switch (this.state.error) {
        case 'NETWORK':
          errorMessage = 'Couldn\'t connect to the SmartApp server.';
          break;
        case Errors.LOGIN_BAD_USER_PW:
          errorMessage = 'Incorrect email/username or password - please try again.';
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
        { this.props.oauth || !Link ? null :
          <Link to="/" className="link-plain">
            <Button className="back-button"
                  icon={<MaterialIcon icon="arrow_back"/>}>
              Back
            </Button>
          </Link>
        }
        <h3 className="login-text">Log In to SmarterHome</h3>
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
          <Button className="mdc-button-blue auth-button" raised type="submit" form="login-form" disabled={this.state.loading}>
            { this.state.loading
              ? 'Signing In...'
              : 'Sign In'
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

Login.propTypes = {
  children: PropTypes.node,
  oauth: PropTypes.bool,
  oauthState: PropTypes.string,
}

export default Login;
