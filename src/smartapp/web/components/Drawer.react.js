import React from 'react';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import { SmartAppClient } from 'common';
import { CSSTransition } from 'react-transition-group';
import * as Actions from '../redux/actions';
import { store } from '../redux/reducers';

import withRipple from '@material/react-ripple';
import '../css/drawer.scss';
let smartAppClient = new SmartAppClient();

function logout() {
  console.log('logout clicked');
  smartAppClient.logout().then(() => {
    store.dispatch(Actions.logout());
  });
}

const Item = (props) => {
  const {
    children,
    className = '',
    // call `initRipple` from the root element's ref. This attaches the ripple
    // to the element.
    initRipple,
    // include `unbounded` to remove warnings when passing `otherProps` to the
    // root element.
    unbounded,
    ...otherProps
  } = props;

  // any classes needed on your component needs to be merged with
  // `className` passed from `props`.
  return (
    <div className={className} ref={initRipple} {...otherProps}>
      {children}
    </div>
  );
};
const RippleItem = withRipple(Item);

class Drawer extends React.Component {
  constructor(props) {
    super(props);
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
            <div className="drawer-header" ><h3>Options</h3></div>
            <RippleItem className="drawer-item" onClick={logout}>
              <MaterialIcon icon="eject"/>
              Logout
            </RippleItem>
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