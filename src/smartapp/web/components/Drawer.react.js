import React from 'react';
import { CSSTransition } from 'react-transition-group';
import '../css/drawer.scss';

class Drawer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
  }

  render() {
    return (
      <div>
        {/* <div id="drawer-shadow"></div> */}
        <CSSTransition
            in={this.state.open}
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

export default Drawer;