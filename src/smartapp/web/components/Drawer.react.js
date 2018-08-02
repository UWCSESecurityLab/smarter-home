import React from 'react';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import { SmartAppClient } from 'common';
import { CSSTransition } from 'react-transition-group';
import * as Actions from '../redux/actions';
import { store } from '../redux/reducers';

import '../css/drawer.scss';
let smartAppClient = new SmartAppClient();

class Drawer extends React.Component {
  constructor(props) {
    super(props);
    this.logout = this.logout.bind(this);
  }

  logout() {
    console.log('logout clicked');
    smartAppClient.logout().then(() => {
      store.dispatch(Actions.logout());
    });
  }

  render() {
    return (
      <div>
        <CSSTransition
          in={this.props.open}
          classNames={'drawer-shadow'}
          timeout={300}
          onClick={() => {this.props.closeFn()}}
          mountOnEnter unmountOnExit>
          <div className="drawer-shadow"></div>
        </CSSTransition>
        <CSSTransition
            in={this.props.open}
            classNames={'drawer'}
            timeout={300}
            mountOnEnter unmountOnExit>
          <div className="drawer">
            <div className="drawer-item drawer-header" ><h3>Options</h3></div>
            <div className="drawer-item" onClick={this.logout}><MaterialIcon icon="eject"/>Logout</div>
          </div>
        </CSSTransition>
      </div>
    );
  }
}

Drawer.propTypes = {
  open: PropTypes.bool,
  closeFn: PropTypes.func
}

export default Drawer;