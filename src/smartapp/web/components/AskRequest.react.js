import React from 'react';
import Actuatable from '../lib/capabilities/Actuatable';
import Button from '@material/react-button';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import * as Actions from '../redux/actions';
import * as Roles from '../../roles';
import { ApprovalState, LocationRestrictions } from '../../permissions';
import { connect } from 'react-redux';
import { CSSTransition } from 'react-transition-group';

class AskRequest extends React.Component {
  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
    this.override = this.override.bind(this);
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
        return <MaterialIcon className="approval-icon approval-icon-allow" icon="done"/>
      case ApprovalState.DENY:
        return <MaterialIcon className="approval-icon approval-icon-deny" icon="error_outline"/>
      case ApprovalState.PENDING:
        return <span className="inline-spinner"></span>
      case ApprovalState.TIMEOUT:
        return <MaterialIcon className="approval-icon approval-icon-unknown" icon="help_outline"/>
      default:
        return <span>{approvalState}</span>
    }
  }

  renderOverallApproval() {
    const pendingCommand = this.props.pendingCommand;
    if (pendingCommand.decision === ApprovalState.PENDING) {
      return (
        <div className="approval overall-approval">
          <span className="inline-spinner"></span>
          Waiting for permission from...
        </div>
      );
    }
    if (pendingCommand.decision === ApprovalState.ALLOW) {
      return (
        <div className="approval overall-approval">
          <MaterialIcon className="approval-icon approval-icon-allow" icon="done"/>
          <span>Success!</span>
        </div>
      );
    } else if (pendingCommand.decision === ApprovalState.DENY) {
      return (
        <div className="approval overall-approval">
          <MaterialIcon className="approval-icon approval-icon-deny" icon="error_outline" />
          <span>Permission denied</span>
        </div>
      );
    } else if (pendingCommand.decision === ApprovalState.PROMPT) {
      return (
        <div className="approval overall-approval">
          <MaterialIcon className="approval-icon approval-icon-unknown" icon="help_outline"/>
          <span>Nobody responded</span>
        </div>
      );
    }
  }

  override() {
    const { deviceId, capability, command } = this.props.pendingCommand;
    Actuatable.actuallyActuate(deviceId, capability, command).then(() => {
      this.close();
    });
  }

  renderOverride() {
    if (this.props.pendingCommand.decision !== ApprovalState.PROMPT) {
      return null;
    }
    if (this.props.users[this.props.me].role !== Roles.USER) {
      return null;
    }
    return (
      <div>
        <div style={{ marginBottom: '10px' }}>
          Do you want to do this anyways?
        </div>
        <Button className="prompt-button" onClick={this.override}>
          Yes
        </Button>
        <Button className="prompt-button mdc-button-blue" raised onClick={this.close}>
          No
        </Button>
      </div>
    );
  }

  render() {
    const { deviceDesc, pendingCommand } = this.props;

    const show = !!pendingCommand;

    let action = null;
    if (show && deviceDesc) {
      const label = deviceDesc.label ? deviceDesc.label : deviceDesc.name;
      action = deviceDesc && show
      ? `${label} | ${pendingCommand.capability} → ${pendingCommand.command}`
      : null;
    }

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
                  {this.renderOverride()}
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

AskRequest.propTypes = {
  deviceDesc: PropTypes.object,
  dispatch: PropTypes.func,
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

export default connect(mapStateToProps)(AskRequest);
