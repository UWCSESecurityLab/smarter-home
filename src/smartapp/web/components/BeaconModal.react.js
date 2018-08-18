import React from 'react';
import Button from '@material/react-button';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import { SmartAppClient } from 'common';
import { withRouter } from 'react-router-dom';

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
    this.close = this.close.bind(this);
  }

  onNameChange(e) {
    this.setState({ beaconName: e.target.value });
  }

  addBeacon() {
    this.setState({error: ''});
    smartAppClient.addBeacon(this.state.beaconName).then(() => {
      this.setState({ name: '' });
      this.close();
    }).catch((err) => {
      if (err.error === 'BEACON_NOT_FOUND') {
        this.setState({ error: `No beacon named ${this.state.name}, did you mispell it?` });
      } else {
        this.setState({ error: JSON.stringify(err) });
      }
    });
  }

  close() {
    this.props.history.push(this.props.parentUrl);
  }

  render() {
    return (
      <div>
        <div className="modal-bg" onClick={this.close}/>
        <div className="modal-window">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <h3>Add beacon</h3>
            <MaterialIcon icon="close" onClick={this.close}/>
          </div>
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
  history: PropTypes.object,
  parentUrl: PropTypes.string
}


export default withRouter(BeaconModal);