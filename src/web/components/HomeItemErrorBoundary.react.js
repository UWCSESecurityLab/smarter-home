import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import SmartAppClient from '../lib/SmartAppClient';

const smartAppClient = new SmartAppClient();

class HomeItemErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
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
        <section className="home-item home-item-padded">
          <h3>Something went wrong</h3>
          <p>
            Sorry! An error report has been sent to SmarterHome. Please describe
            what you were doing using the&nbsp;
            <Link to="/feedback">feedback tool</Link>, or
            send an email to Eric (ericzeng@cs.washington.edu).
          </p>
        </section>
      );
    } else {
      return this.props.children;
    }
  }
}

HomeItemErrorBoundary.propTypes = {
  children: PropTypes.node
}

export default HomeItemErrorBoundary;