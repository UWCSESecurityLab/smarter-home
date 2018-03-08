import React from 'react';
import { connect } from 'react-redux';
import Home from './Home';
import Login from './Login';
import { Views } from '../redux/actions';
import '../notifications';

const mapStateToProps = (state) => {
  return {
    view: state.view
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    console.log('App.render(), current view prop = ');
    console.log(this.props.view);
    let activeView;
    switch (this.props.view) {
      case Views.LOGIN:
        activeView = <Login/>
        break;
      case Views.HOME:
        activeView = <Home/>
        break;
      default:
        activeView = <Login/>
    }
    return activeView;
  }
}

export default connect(mapStateToProps)(App);