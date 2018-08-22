import React from 'react';
import { SmartAppClient } from 'common';

let smartAppClient = new SmartAppClient();

import '../css/spinner.scss';

class SmartThingsOptions extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      refreshStatus: null,
      access_token: ''
    }
    this.refreshAccessToken = this.refreshAccessToken.bind(this);
  }

  async refreshAccessToken() {
    this.setState({ refreshStatus: 'loading' });
    try {
      let token = await smartAppClient.refreshAccessToken();
      this.setState({
        refreshStatus: 'success',
        accessToken: token.access_token
      });
    } catch (e) {
      this.setState({ refreshStatus: 'error' });
    }
  }

  render() {
    let refreshStatus;
    if (this.state.refreshStatus === 'loading') {
      refreshStatus = <span className="spinner" id="spinner" aria-hidden="true"></span>;
    } else if (this.state.refreshStatus === 'error') {
      refreshStatus = <span className="x-mark">✗</span>
    } else if (this.state.refreshStatus === 'success') {
      refreshStatus = <span className="check-mark">✓</span>
    } else {
      refreshStatus = null;
    }

    return (
      <section className="home-item">
        <h3>SmartThings Configuration</h3>
        <div>
          <button id="refresh" className="btn btn-green" onClick={this.refreshAccessToken}>⟳</button>
          <span id="refresh-label" >Refresh Access Token</span>
          {refreshStatus}
          { this.state.accessToken
            ? <div className="code-container" id="access-token">
                <code>{this.state.accessToken}</code>
              </div>
            : null
          }
        </div>
      </section>
    );
  }
}

export default SmartThingsOptions;