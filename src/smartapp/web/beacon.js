import React from 'react';
import ReactDOM from 'react-dom';
import xhr from 'xhr';

class BeaconSimulator extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = { transmit: false , error: null };
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    let newState;
    if (this.state.transmit) {
      newState = 'off';
    } else {
      newState = 'on';
    }

    xhr.get({
      url: `http://localhost:5000/beacon/${newState}`
    }, (err, res, body) => {
      if (err) {
        this.setState({ error: err });
      } else if (res.statusCode !== 200) {
        this.setState({ error: body });
      } else {
        let transmitState = this.state.transmit;
        this.setState({ transmit: !transmitState, error: null});
      }
    });
  }

  render() {
    return (
      <div id="container">
        <h1>Bluetooth Beacon Simulator</h1>
        <p>
          Namespace ID: 00010203040506070809 &nbsp;&nbsp;
          Instance ID: aabbccddeeff
        </p>
        <button onClick={this.toggle}
                className={this.state.transmit ? 'button-on' : 'button-off'}>
          { this.state.transmit
            ? 'ON'
            : 'OFF'
          }
        </button>
        { this.state.error
          ? <div>{this.state.error}</div>
          : null
        }
      </div>
    );
  }
}



ReactDOM.render(<BeaconSimulator/>, document.getElementById('react'));