import React from 'react';
import { CSSTransition } from 'react-transition-group';
import PropTypes from 'prop-types';
import '../css/drawer.scss';

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
          timeout={500}
          onClick={() => {this.props.closeFn()}}
          mountOnEnter unmountOnExit>
          <div className="drawer-shadow"></div>
        </CSSTransition>
        <CSSTransition
            in={this.props.open}
            classNames={'drawer'}
            timeout={500}
            mountOnEnter unmountOnExit>
          <div className="drawer">
            Hello
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