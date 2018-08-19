import React from 'react';
import Button from '@material/react-button';
import HomeState from '../lib/home-state';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import strToColor from '../lib/strToColor';
import { SmartAppClient } from 'common';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

let smartAppClient = new SmartAppClient();

class AddUserModal extends React.Component {
  constructor() {
    super();
    this.state = {
      error: '',
      key: {},
      newName: '',
      scanning: true
    }
    this.addKeyToUser = this.addKeyToUser.bind(this);
    this.addNewUser = this.addNewUser.bind(this);
    this.close = this.close.bind(this);
    this.onNameChange = this.onNameChange.bind(this);
    this.stopScan = this.stopScan.bind(this);
  }

  componentDidMount() {
    if (window.cordova) {
      QRScanner.scan((err, text) => {
        if (err) {
          console.error(err);
          this.stopScan();
        } else {
          this.stopScan();
          this.setState({ scanning: false, key: JSON.parse(text) });
        }
      });
      QRScanner.show();
      document.getElementsByTagName('body')[0].style.background = 'transparent';
      this.props.setVisibility(false);
    }
  }
  componentWillUnmount() {
    if (window.cordova) {
      this.stopScan();
    }
  }

  stopScan() {
    QRScanner.destroy();
    this.props.setVisibility(true);
    document.getElementsByTagName('body')[0].style.background = '#5FC4FA';
  }

  close() {
    this.props.history.push(this.props.history.location.pathname.split('/addUser')[0]);
  }

  async addNewUser() {
    try {
      await smartAppClient.addNewUser(this.state.key, this.state.newName);
      await HomeState.fetchUsers();
      this.close();
    } catch(err) {
      this.setState({ error: err.error });
    }
  }
  async addKeyToUser(userId) {
    try {
      await smartAppClient.addKeyToUser(this.state.key, userId);
      this.close();
    } catch(err) {
      this.setState({ error: err.error });
    }
  }

  onNameChange(e) {
    this.setState({ newName: e.target.value });
  }

  renderScanner() {
    return (
      <div>
        { !window.cordova
          ? <div className="modal-bg" onClick={this.close}/>
          : null
        }
        <div className="modal-window" style={{visibility: 'visible'}}>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <h3>Add user</h3>
            <MaterialIcon icon="close" onClick={this.close}/>
          </div>
          { window.cordova
            ? <p>Scan the QR code shown on the new user's phone.</p>
            : <p>Sorry, you can only add users with the mobile app.</p>
          }
        </div>
      </div>
    );
  }

  renderUserPicker() {
    return (
      <div>
        <div className="modal-bg" onClick={this.close}/>
        <div className="modal-window">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <h3 className="modal-heading">Add User</h3>
            <MaterialIcon icon="close" onClick={this.close}/>
          </div>
          <p>
            Add this device to an existing user
          </p>
          { Object.values(this.props.users).map((user) =>
            <div className="user-li" key={user.id} onClick={() => {
              this.addKeyToUser(user.id)
            }}>
              <MaterialIcon icon="mood" style={{ color: strToColor(user.id)}}/>
              <span className="user-li-label">
                {user.displayName}
              </span>
            </div>
          )}
          <p>
            Or, create a new user
          </p>
          <input type="text"
                value={this.state.newName}
                placeholder="Name"
                onChange={this.onNameChange}/>
          <Button className="mdc-button-blue" onClick={this.addNewUser}>
            Add
          </Button>
          { this.state.error
            ? <div className="error">{this.state.error}</div>
            : null
          }
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        { this.state.scanning ? this.renderScanner() : this.renderUserPicker() }
      </div>
    )
  }
}

AddUserModal.propTypes = {
  history: PropTypes.object,
  setVisibility: PropTypes.func,
  users: PropTypes.object
}

const mapStateToProps = (state) => {
  return {
    users: state.users
  };
}

export default withRouter(connect(mapStateToProps)(AddUserModal));