import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';
import Authenticate from './Authenticate.react';
import Home from './Home.react';
// import * as Views from '../views';

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
        <Route path="/login" component={Authenticate}/>
        <Route path="/oauth" component={Authenticate}/>
        <Route path="/home" component={Home}/>
      </Switch>
    );
  }
}

App.propTypes = {
  view: PropTypes.string
}

function mapStateToProps(state) {
  return {
    view: state.view
  }
}

export default withRouter(connect(mapStateToProps)(App));