import React from 'react';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import * as Actions from '../redux/actions';
import { ApprovalState, LocationRestrictions } from '../../permissions';
import { connect } from 'react-redux';
import { CSSTransition } from 'react-transition-group';

class PendingCommand extends React.Component {
  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
    this.renderOwnerApproval = this.renderOwnerApproval.bind(this);
    this.renderNearbyApproval = this.renderNearbyApproval.bind(this);
    this.renderApprovalSymbol = this.renderApprovalSymbol.bind(this);
  }

  close() {
    this.props.dispatch(Actions.clearPendingCommand());
  }

  renderOwnerApproval() {
    if (this.props.permissions.owners.includes(this.props.me)) {
      return null;
    }
    const ownerNames = this.props.permissions.owners.map((ownerId) => {
      return this.props.users[ownerId].displayName
    }).join(', ');
    return (
      <div className="approval sub-approval">
        {this.renderApprovalSymbol(this.props.pendingCommand.ownerApproval)}
        <div>
          <div>A device owner</div>
          <div className="device-modal-nav-item-subtitle">{ownerNames}</div>
        </div>
      </div>
    );
  }

  renderNearbyApproval() {
    if (this.props.permissions.locationRestrictions === LocationRestrictions.ANYWHERE) {
      return null;
    }
    let locText;
    if (this.props.permissions.locationRestrictions === LocationRestrictions.AT_HOME) {
      locText = 'at home';
    } else if (this.props.permissions.locationRestrictions === LocationRestrictions.NEARBY) {
      locText = 'nearby';
    }

    return (
      <div className="approval sub-approval">
        {this.renderApprovalSymbol(this.props.pendingCommand.nearbyApproval)}
        <span>Someone {locText}</span>
      </div>
    );
  }

  renderApprovalSymbol(approvalState) {
    switch (approvalState) {
      case ApprovalState.ALLOW:
        return <span style={{color: '#57BC45'}}>✓</span>
      case ApprovalState.DENY:
        return <span style={{color: '#E34232'}}>✗</span>
      case ApprovalState.PENDING:
        return <span className="inline-spinner"></span>
      default:
        return <span>{this.props.pendingCommand.ownerApproval}</span>
    }
  }

  renderOverallApproval() {
    const pendingCommand = this.props.pendingCommand;
    if (!pendingCommand.decided) {
      return (
        <div className="approval overall-approval">
          <span className="inline-spinner"></span>
          Waiting for permission from...
        </div>
      );
    }
    if (pendingCommand.ownerApproval === ApprovalState.ALLOW &&
        pendingCommand.nearbyApproval === ApprovalState.ALLOW) {
      return (
        <div>
          <MaterialIcon icon="done" style={{color: '#57BC45'}}/>
          <span>Success!</span>
        </div>
      );
    } else if (pendingCommand.ownerApproval === ApprovalState.DENY ||
               pendingCommand.nearbyApproval === ApprovalState.DENY) {
      return (
        <div>
          <MaterialIcon icon="error_outline" style={{color: '#E34232'}} />
          <span>Permission denied</span>
        </div>
      );
    } else if (pendingCommand.nearbyApproval === ApprovalState.TIMEOUT) {
      return (
        <div>
          <MaterialIcon icon="error_outline" style={{color: '#E34232'}}/>
          <span>Timed out</span>
        </div>
      );
    }
  }

  render() {
    const { deviceDesc, pendingCommand } = this.props;

    const show = !!pendingCommand;
    const action = deviceDesc && show
      ? `${deviceDesc.label} | ${pendingCommand.capability} → ${pendingCommand.command}`
      : null;

    return (
      <CSSTransition in={show} timeout={75} classNames={'fade'} mountOnEnter unmountOnExit>
        <div>
          <div className="modal-bg fade" onClick={this.deny}/>
          <div className="modal-window fade">
            { show ?
              <div>
                <div className="modal-heading-container">
                  <h3 className="modal-heading">Asking for Permission</h3>
                  <MaterialIcon icon="close" onClick={this.close}/>
                </div>
                <div className="modal-content">
                  <p>{action}</p>
                  {this.renderOverallApproval()}
                  {this.renderNearbyApproval()}
                  {this.renderOwnerApproval()}
                </div>
              </div>
              : null
            }
          </div>
        </div>
      </CSSTransition>
    );
  }
}

PendingCommand.propTypes = {
  deviceDesc: PropTypes.object,
  permissions: PropTypes.object,
  pendingCommand: PropTypes.object,
  users: PropTypes.object,
  me: PropTypes.string,
}

const mapStateToProps = (state) => {
  if (state.pendingCommand) {
    return {
      deviceDesc: state.devices.deviceDesc[state.pendingCommand.deviceId],
      permissions: state.devices.permissions[state.pendingCommand.deviceId],
      pendingCommand: state.pendingCommand,
      users: state.users,
      me: state.me,
    };
  } else {
    return {
      deviceDesc: null,
      permissions: null,
      pendingCommand: null,
      users: state.users,
      me: state.me,
    };
  }
}

export default connect(mapStateToProps)(PendingCommand);
