import React from 'react';
import '../css/common.scss';
import '../css/home.scss';

class BeaconConfig extends React.Component {
  constructor() {
    super();
    this.state = {
      error: null,
      beacons: [],
      add: false,
      beaconNamespace: '',
      beaconId: '',
      beaconName: '',
    }

    this.fetchBeacons = this.fetchBeacons.bind(this);
    this.onNameChange = this.onNameChange.bind(this);
    this.onIdChange = this.onIdChange.bind(this);
    this.onNamespaceChange = this.onNamespaceChange.bind(this);
    this.addBeacon = this.addBeacon.bind(this);

  }

  componentDidMount() {
    this.fetchBeacons();
  }

  fetchBeacons() {
    fetch('https://kadara.cs.washington.edu/beacon/list').then((response) => {
      if (!response.ok) {
        this.setState({error: response.status});
        return;
      }
      return response.json();
    }).then((beacons) => {
      this.setState({beacons: beacons });
    }).catch((err) => {
      this.setState({error: err})
    });
  }

  onNameChange(e) {
    this.setState({ beaconName: e.target.value });
  }
  onIdChange(e) {
    this.setState({ beaconId: e.target.value });
  }
  onNamespaceChange(e) {
    this.setState({ beaconNamespace: e.target.value });
  }

  addBeacon() {
    fetch('https://kadara.cs.washington.edu/beacon/new', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        namespace: this.state.beaconNamespace,
        id: this.state.beaconId,
        name: this.state.beaconName
      })
    }).then((response) => {
      if (response.ok) {
        this.setState({ add: false, beaconNamespace: '', beaconId: '', beaconName: '' });
        this.fetchBeacons();
      } else {
        response.json().then((err) => {
          this.setState({ add: false, error: err });
        });
      }
    }).catch((err) => {
      this.setState({ add: false, error: JSON.stringify(err) });
    })
  }

  render() {
    return (
      <div>
        { this.state.add ?
          <div>
            <div className="modal-bg" onClick={() => this.setState({add: false})}/>
            <div className="add-modal">
              <h3>Add beacon</h3>
              <input type="text" value={this.state.beaconName} placeholder="Name" onChange={this.onNameChange}/>
              <input type="text" value={this.state.beaconId} placeholder="ID" onChange={this.onIdChange}/>
              <input type="text" value={this.state.beaconNamespace} placeholder="Namespace" onChange={this.onNamespaceChange}/>
              <button className="btn btn-blue" onClick={this.addBeacon}>Submit</button>
            </div>
          </div>
        : null }
        <div className="container">
          <section className="home-item">
            <h3>Beacon Configuration</h3>
            { this.state.error ? <span>{this.state.error}</span> : null}
            <div>
              Beacons in DB
            </div>
            <div className="code-container">
              <code>
                {JSON.stringify(this.state.beacons, null, 2)}
              </code>
            </div>
            <button className="btn btn-blue" onClick={() => this.setState({ add: true})}>
              Add Beacon
            </button>
          </section>
        </div>
      </div>
    );
  }
}

export default BeaconConfig;