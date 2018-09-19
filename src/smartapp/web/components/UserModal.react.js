import React from 'react';
import Button from '@material/react-button';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import SmartAppClient from '../lib/SmartAppClient';
import toastError from '../lib/error-toaster';
import UserRolePicker from './UserRolePicker.react';
import * as Actions from '../redux/actions';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

const smartAppClient = new SmartAppClient();

class UserModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { view: 'overview' };

    this.close = this.close.bind(this);
    this.onChange = this.onChange.bind(this);
    this.renderOverview = this.renderOverview.bind(this);
  }

  close() {
    this.props.history.push(this.props.history.location.pathname.split('/user')[0]);
  }

  onChange(_, role) {
    smartAppClient.updateUserRole(this.props.user.id, role).then(() => {
      this.props.dispatch(Actions.updateUserRole(this.props.user.id, role))
    }).catch(toastError);
  }

  renderOverview() {
    return (
      <div className="device-modal-item">
        <span>{this.props.user.role}</span>
        <Button onClick={() => this.setState({ view: 'editRole' })}>
          Edit Role
        </Button>
      </div>
    );
  }

  render() {
    const isMe = this.props.me === this.props.user.id;
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
    }
    return (
      <div>
        <div className="modal-bg fade" onClick={this.close}/>
        <div className="modal-window fade">
          <div className="modal-heading-container">
            <h3 className="modal-heading">
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
  me: PropTypes.string,
  user: PropTypes.object
}

const mapStateToProps = (state, ownProps) => {
  return {
    me: state.me,
    user: state.users[ownProps.match.params.userId]
  }
};

export default withRouter(connect(mapStateToProps)(UserModal));