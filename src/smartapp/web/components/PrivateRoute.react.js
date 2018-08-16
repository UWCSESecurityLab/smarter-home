import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route } from 'react-router-dom';
import { connect } from 'react-redux';

const PrivateRoute = ({ component: Component, authenticated: authenticated, ...rest }) => (
  <Route {...rest} render={(props) => (
    authenticated === true
      ? <Component {...props} />
      : <Redirect to="/"/>
  )} />
);

PrivateRoute.propTypes = {
  component: PropTypes.func,
  authenticated: PropTypes.bool
}

const mapStateToProps = (state) => {
  return { authenticated: state.authenticated };
}

export default connect(mapStateToProps)(PrivateRoute);