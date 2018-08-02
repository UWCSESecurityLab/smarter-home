import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';
import Authenticate from './Authenticate.react';
import Home from './Home.react';

import '../css/common.scss';

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <Route exact path="/" render={() => (
          <Redirect to='/login'/>
        )}/>
        <Route path="/login" render={(props) => (
          this.props.authenticated
          ? <Redirect to='/home'/>
          : <Authenticate/>
        )}/>
        <Route path="/oauth" component={Authenticate}/>
        <Route path="/home" render={(props) => (
          this.props.authenticated
          ? <Home/>
          : <Redirect to='/login'/>
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