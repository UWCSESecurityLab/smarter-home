import React from 'react';
import Button from '@material/react-button';
import HomeState from '../lib/home-state';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import SmartAppClient from '../lib/SmartAppClient';
import { withRouter } from 'react-router-dom';
import * as Errors from '../../errors';

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
      HomeState.resetDevices();
      this.close();
    }).catch((err) => {
      console.log(err);
      this.setState({ error: err })
    });
  }

  close() {
    this.props.history.push(
      this.props.history.location.pathname.split('/addBeacon')[0]);
  }

  render() {
    let errorMessage = null;
    if (this.state.error.error === Errors.BEACON_NOT_FOUND) {
      errorMessage = `No beacon named ${this.state.name}, did you mispell it?`
    } else if (this.state.error.error === Errors.DB_ERROR) {
      errorMessage = 'SmarterHome database error. Please try again later.';
    } else if (this.state.error.name === 'TypeError') {
      errorMessage = 'Couldn\'t connect to SmarterHome.';
    } else if (this.state.error) {
      errorMessage = 'Unknown error: ' + JSON.stringify(this.state.error);
    }

    return (
      <div>
        <div className="modal-bg fade" onClick={this.close}/>
        <div className="modal-window fade">
          <div className="modal-heading-container">
            <h3 className="modal-heading">Add beacon</h3>
            <MaterialIcon icon="close" onClick={this.close}/>
          </div>
          <div className="modal-content">
            <p>
              Enter the name of the beacon. It should be a four letter code
              printed on the side of the beacon.
            </p>
            <input type="text"
                  value={this.state.beaconName}
                  placeholder="Beacon Name"
                  onChange={this.onNameChange}/>
            <Button className="mdc-button-blue" raised onClick={this.addBeacon}>
              Submit
            </Button>
            { this.state.error
              ? <div className="error">{errorMessage}</div>
              : null
            }
          </div>
        </div>
      </div>
    )
  }
}

BeaconModal.propTypes = {
  history: PropTypes.object
}

export default withRouter(BeaconModal);