import React from 'react';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import SmartAppClient from '../lib/SmartAppClient';
import { Link, withRouter } from 'react-router-dom';
import { store } from '../redux/reducers';

const smartAppClient = new SmartAppClient();

class ModalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.close = this.close.bind(this);
  }

  close() {
    if (this.props.action) {
      store.dispatch(this.props.action);
    } else if (this.props.route) {
      this.props.history.push(
        this.props.history.location.pathname.split(this.props.route)[0]);
    }
  }

  componentDidCatch(error, info) {
    smartAppClient.sendClientLog('error', 'Client render error', {
      stack: error.stack,
      componentStack: info.componentStack
    });
    this.setState({ hasError: true, error: error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <div className="modal-bg fade" onClick={this.close}/>
          <div className="modal-window fade">
            <div className="modal-heading-container">
              <h3 className="modal-heading">Something went wrong</h3>
              <MaterialIcon icon="close" onClick={this.close}/>
            </div>
            <div className="modal-content">
              <p>
                Sorry! An error report has been sent to SmarterHome. Please describe
                what you were doing using the&nbsp;
                <Link to="/feedback">feedback tool</Link>, or
                send an email to Eric (ericzeng@cs.washington.edu).
              </p>
            </div>
          </div>
        </div>
      );
    } else {
      return this.props.children;
    }
  }
}

ModalErrorBoundary.propTypes = {
  action: PropTypes.object,
  children: PropTypes.node,
  history: PropTypes.object,
  route: PropTypes.string,
}

export default withRouter(ModalErrorBoundary);