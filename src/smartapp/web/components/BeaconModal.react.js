import React from 'react';
import Button from '@material/react-button';
import PropTypes from 'prop-types';
import { SmartAppClient } from 'common';

let smartAppClient = new SmartAppClient();

class BeaconModal extends React.Component {
  constructor() {
    super();
    this.state = {
      beaconName: '',
      error: ''
    }
    this.onNameChange = this.onNameChange.bind(this);
    this.addBeacon = this.addBeacon.bind(this);
  }

  onNameChange(e) {
    this.setState({ beaconName: e.target.value });
  }

  addBeacon() {
    this.setState({error: ''});
    smartAppClient.addBeacon(this.state.beaconName).then(() => {
      this.setState({ name: '' });
      this.props.close();
    }).catch((err) => {
      if (err.error === 'BEACON_NOT_FOUND') {
        this.setState({ error: `No beacon named ${this.state.name}, did you mispell it?` });
      } else {
        this.setState({ error: JSON.stringify(err) });
      }
    });
  }

  render() {
    return (
      <div>
        <div className="modal-bg" onClick={() => this.props.close()}/>
        <div className="modal-window">
          <h3>Add beacon</h3>
          <p>
            Enter the name of the beacon. It should be a four letter code
            printed on the side of the beacon.
          </p>
          <input type="text" value={this.state.beaconName} placeholder="Beacon Name" onChange={this.onNameChange}/>
          <Button className="mdc-button-blue" raised onClick={this.addBeacon}>Submit</Button>
          { this.state.error ? <div className="error">{this.state.error}</div> : null }
        </div>
      </div>
    )
  }
}

BeaconModal.propTypes = {
  close: PropTypes.func
}

export default BeaconModal;