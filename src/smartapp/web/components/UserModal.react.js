import React from 'react';
import Button from '@material/react-button';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import SmartAppClient from '../lib/SmartAppClient';
import toastError from '../lib/error-toaster';
import Roles from '../../roles';
import UserRolePicker from './UserRolePicker.react';
import * as Actions from '../redux/actions';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

const roleToSubtitle = {
  [Roles.USER]: 'Can control and configure all devices and permissions',
  [Roles.CHILD]: 'Can control devices, but cannot configure devices or permissions',
  [Roles.GUEST]: 'Can control devices, but cannot configure devices or permissions'
}

const smartAppClient = new SmartAppClient();

class UserModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { view: 'overview' };

    this.close = this.close.bind(this);
    this.onChange = this.onChange.bind(this);
    this.renderOverview = this.renderOverview.bind(this);
    this.updateName = this.updateName.bind(this);
  }

  close() {
    this.props.history.push(this.props.history.location.pathname.split('/user')[0]);
  }

  onChange(_, role) {
    smartAppClient.updateUserRole(this.props.user.id, role).then(() => {
      this.props.dispatch(Actions.updateUserRole(this.props.user.id, role))
    }).catch(toastError);
  }

  updateName() {
    smartAppClient.updateDisplayName(this.props.user.id, this.state.newName).then(() => {
      this.props.dispatch(Actions.updateDisplayName(this.props.user.id, this.state.newName));
      this.setState({ view: 'overview' });
    }).catch(toastError);
  }

  renderOverview() {
    return (
      <div>
        <div className="device-modal-nav-item">
          <div>
            Role: {this.props.user.role}
            <div className="device-modal-nav-item-subtitle">
              {roleToSubtitle[this.props.user.role]}
            </div>
          </div>
        </div>
        { this.props.me.role === Roles.USER ?
          <div className="device-modal-nav-item" onClick={() => this.setState({ view: 'editRole' })}>
            Change Role
            <MaterialIcon icon="chevron_right" style={{ color: '#8c8c8c' }}/>
          </div>
          : null }
        <div className="device-modal-nav-item"  onClick={() =>
            this.setState({ view: 'editName', newName: this.props.user.displayName})}>
          Change Name
          <MaterialIcon icon="chevron_right" style={{ color: '#8c8c8c' }}/>
        </div>
      </div>
    );
  }
  render() {
    const isMe = this.props.me.id === this.props.user.id;
    let content;
    if (this.state.view == 'overview') {
      content = this.renderOverview();
    } else if (this.state.view == 'editRole') {
      content = (
        <div className="modal-content">
          <h4>Change {this.props.user.displayName}'s Role</h4>
          <UserRolePicker user={this.props.user} onChange={this.onChange}/>
        </div>
      );
    } else if (this.state.view == 'editName') {
      content = (
        <div className="modal-content">
          <h4>Change name</h4>
          <input value={this.state.newName}
              onChange={(e) => this.setState({ newName: e.target.value })}
              type="text"
              placeholder="New Name"
              required/>
          <Button onClick={this.updateName} className="mdc-button-blue auth-button">
            Save
          </Button>
        </div>
      )
    }
    return (
      <div>
        <div className="modal-bg fade" onClick={this.close}/>
        <div className="modal-window fade">
          <div className="modal-heading-container">
            <h3 className="modal-heading">
              { this.state.view === 'editRole' || this.state.view === 'editName' ?
                <MaterialIcon icon="arrow_back" onClick={
                  () => this.setState({ view: 'overview' })}/>
                : null}
              { `${this.props.user.displayName}${isMe ? ' (You)' : ''}` }
            </h3>
            <MaterialIcon icon="close" onClick={this.close}/>
          </div>
          {content}
        </div>
      </div>
    );
  }
}

UserModal.propTypes = {
  dispatch: PropTypes.func,
  history: PropTypes.object,
  match: PropTypes.object,
  me: PropTypes.object,
  user: PropTypes.object
}

const mapStateToProps = (state, ownProps) => {
  return {
    me: state.users[state.me],
    user: state.users[ownProps.match.params.userId]
  }
};

export default withRouter(connect(mapStateToProps)(UserModal));