import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';
import Authenticate from './Authenticate.react';
import Home from './Home.react';
import PrivateRoute from './PrivateRoute.react';

import '../css/common.scss';

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <PrivateRoute path="/home" component={Home}/>
        <Route path="/" render={() => (
          this.props.authenticated
          ? <Redirect to='/home'/>
          : <Authenticate/>
        )}/>
      </Switch>
    );
  }
}

App.propTypes = {
  authenticated: PropTypes.bool,
  view: PropTypes.string
}

function mapStateToProps(state) {
  return {
    authenticated: state.authenticated,
    view: state.view
  }
}

export default withRouter(connect(mapStateToProps)(App));