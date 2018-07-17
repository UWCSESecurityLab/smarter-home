import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Authenticate from './Authenticate.react';
import Home from './Home.react';
import * as Views from '../views';

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let activeView;
    switch (this.props.view) {
      case Views.AUTH:
        activeView = <Authenticate/>;
        break;
      case Views.DEVICES:
        activeView = <Home/>;
        break;
      default:
        activeView = <Authenticate/>;

    }

    return activeView;
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

export default connect(mapStateToProps)(App);