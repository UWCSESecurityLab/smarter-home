import React from 'react';
import PropTypes from 'prop-types';

class BeaconModal extends React.Component {
  constructor() {
    super();
    this.state = {
      name: '',
      error: ''
    }
    this.onNameChange = this.onNameChange.bind(this);
    this.addBeacon = this.addBeacon.bind(this);
  }

  addBeacon() {
    this.setState({error: ''});
    fetch('https://kadara.cs.washington.edu/beacon/add', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: this.state.beaconName
      })
    }).then((response) => {
      if (response.ok) {
        this.setState({ name: '' });
        this.props.close();
      } else {
        response.json().then((err) => {
          if (err.error === 'BEACON_NOT_FOUND') {
            this.setState({ error: `No beacon named ${this.state.name}, did you mispell it?` });
          } else {
            this.setState({ error: JSON.stringify(err) });
          }
        });
      }
    }).catch((err) => {
      this.setState({ error: 'Couldn\'t connect to SmarterHome' });
    })
  }

  render() {
    return (
      <div>
        <div className="modal-bg" onClick={() => this.props.close()}/>
        <div className="add-modal">
          <h3>Add beacon</h3>
          <input type="text" value={this.state.beaconName} placeholder="Beacon Name (printed on beacon)" onChange={this.onNameChange}/>
          <button className="btn btn-blue" onClick={this.addBeacon}>Submit</button>
          { this.state.error ? <div className="error">this.state.error</div> : null }
        </div>
      </div>
    )
  }
}

BeaconModal.propTypes = {
  close: PropTypes.func
}

export default BeaconModal;