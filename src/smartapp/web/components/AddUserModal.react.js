import React from 'react';
import Button from '@material/react-button';
import HomeState from '../lib/home-state';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import strToColor from '../lib/strToColor';
import Radio from './Radio.react';
import SmartAppClient from '../lib/SmartAppClient';
import UserRolePicker from './UserRolePicker.react';
import * as Errors from '../../errors';
import { connect } from 'react-redux';
import { notify as toast } from 'react-notify-toast';
import { withRouter } from 'react-router-dom';

const smartAppClient = new SmartAppClient();
const NEW_USER = '_NEW_USER';

class AddUserModal extends React.Component {
  constructor() {
    super();
    this.state = {
      error: '',
      key: {},
      newName: '',
      newUserRole: '',
      scanning: true,
      picked: null,
    }
    this.addKeyToUser = this.addKeyToUser.bind(this);
    this.addNewUser = this.addNewUser.bind(this);
    this.changePicked = this.changePicked.bind(this);
    this.close = this.close.bind(this);
    this.onNameChange = this.onNameChange.bind(this);
    this.onRoleChange = this.onRoleChange.bind(this);
    this.stopScan = this.stopScan.bind(this);
    this.submit = this.submit.bind(this);
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

  submit(e) {
    e.preventDefault();
    if (this.state.picked === NEW_USER) {
      this.addNewUser();
    } else if (this.state.picked === '') {
      toast.show('Please pick a user.', 'error');
    } else {
      this.addKeyToUser(this.state.picked);
    }
  }

  async addNewUser() {
    try {
      await smartAppClient.addNewUser(this.state.key, this.state.newName, this.state.newUserRole);
      await HomeState.fetchUsers();
      this.close();
    } catch(err) {
      this.setState({ error: err });
    }
  }
  async addKeyToUser(userId) {
    try {
      await smartAppClient.addKeyToUser(this.state.key, userId);
      this.close();
    } catch(err) {
      this.setState({ error: err });
    }
  }

  onNameChange(e) {
    this.setState({ newName: e.target.value });
  }

  changePicked(_, userId) {
    this.setState({ picked: userId });
  }

  onRoleChange(_, role) {
    this.setState({ newUserRole: role });
  }

  renderScanner() {
    return (
      <div>
        { !window.cordova
          ? <div className="modal-bg fade" onClick={this.close}/>
          : null
        }
        <div className="modal-window fade" style={{visibility: 'visible'}}>
          <div className="modal-heading-container">
            <h3 className="modal-heading">Add user</h3>
            <MaterialIcon icon="close" onClick={this.close}/>
          </div>
          <div className="modal-content">
            { window.cordova
              ? <p>Scan the QR code shown on the new user's phone.</p>
              : <p>Sorry, you can only add users with the mobile app.</p>
            }
          </div>
        </div>
      </div>
    );
  }

  renderUserPicker() {
    let errorMessage = null;
    if (this.state.error.error === Errors.DB_ERROR) {
      errorMessage = 'SmarterHome database error. Please try again later.';
    } else if (this.state.error.error === Errors.CR_CODE_USED) {
      errorMessage = 'Someone has already scanned this QR code before. If the new user can\'t log in, try having them reinstall their app.';
    } else if (this.state.error.name === 'TypeError') {
      errorMessage = 'Couldn\'t connect to SmarterHome. Please try again later';
    } else if (this.state.error.error === Errors.MISSING_FIELDS) {
      errorMessage = 'Please fill out all of the fields.'
    } else if (this.state.error) {
      errorMessage = 'Unknown error: ' + JSON.stringify(this.state.error);
    }

    return (
      <div>
        <div className="modal-bg fade" onClick={this.close}/>
        <div className="modal-window fade">
          <div className="modal-heading-container">
            <h3 className="modal-heading">Add User</h3>
            <MaterialIcon icon="close" onClick={this.close}/>
          </div>
          <div className="modal-content">
            <p>
              Add this device to an existing user
            </p>
            { Object.values(this.props.users).map((user) =>
              <Radio name="users"
                    id={user.id}
                    key={user.id}
                    checked={this.state.picked === user.id}
                    label={[
                      <MaterialIcon key={`${user.id}-icon`} icon="mood" style={{ color: strToColor(user.id)}}/>,
                      <span key={`${user.id}-label`} className="user-li-label">{user.displayName}</span>
                    ]}
                    onRadioChange={this.changePicked}/>
            )}
            <p>
              Or, create a new user
            </p>
            <Radio name="users"
                  id={NEW_USER}
                  checked={this.state.picked === NEW_USER}
                  label={
                    <input type="text"
                      value={this.state.newName}
                      placeholder="Name"
                      onChange={this.onNameChange}/>
                  }
                  onRadioChange={this.changePicked}/>
            <br/>
            { this.state.picked === NEW_USER
              ? <div>
                  <p>Choose {this.state.newName}'s role</p>
                  <UserRolePicker onChange={this.onRoleChange}
                                  user={{role: this.state.newUserRole}} />
                </div>
              : null
            }
            <Button id="new-user-btn" className="mdc-button-blue" raised onClick={this.submit} type="submit">
              Add User
            </Button>
            { this.state.error
              ? <div className="error">{errorMessage}</div>
              : null
            }
          </div>
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