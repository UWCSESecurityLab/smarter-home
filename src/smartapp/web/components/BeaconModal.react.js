import React from 'react';
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
        <div className="add-modal">
          <h3>Add beacon</h3>
          <input type="text" value={this.state.beaconName} placeholder="Beacon Name (printed on beacon)" onChange={this.onNameChange}/>
          <button className="btn btn-blue" onClick={this.addBeacon}>Submit</button>
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