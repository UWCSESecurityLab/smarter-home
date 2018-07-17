import React from 'react';
import { connect, Provider } from 'react-redux';
import PropTypes from 'prop-types';
import { store } from '../redux/reducers';
import Authenticate from './Authenticate.react';
import Home from './Home.react';
import * as Views from '../views';

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let currentView = (() => {
      switch (this.props.view) {
        case Views.AUTH:
          return <Authenticate/>
        case Views.DEVICES:
          return <Home/>
        default:
          return <Authenticate/>
      }
    });

    return (
      <Provider store={store}>
        {currentView}
      </Provider>
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

export default connect(mapStateToProps)(App);