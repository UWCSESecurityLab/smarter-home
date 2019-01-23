import React from 'react';
import Button from '@material/react-button';
import Capability from '../lib/capabilities/Capability';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import * as Actions from '../redux/actions';
import { ApprovalState, ApprovalType , LocationRestrictions } from '../../permissions';
import { connect } from 'react-redux';
import SmartAppClient from '../lib/SmartAppClient';

let smartAppClient = new SmartAppClient();

class AskApprovalPrompt extends React.Component {
  constructor(props) {
    super(props);
    this.allow = this.allow.bind(this);
    this.deny = this.deny.bind(this);
    this.ignore = this.ignore.bind(this);
  }

  allow(request, approvalTypes) {
    Promise.all(approvalTypes.map((approvalType) => {
      return smartAppClient.postPendingCommand(
        request.id, approvalType, ApprovalState.ALLOW)
    })).then(() => {
      this.props.dispatch(Actions.removeCommandRequest(request.id));
    });
  }

  deny(request, approvalTypes) {
    Promise.all(approvalTypes.map((approvalType) => {
    return smartAppClient.postPendingCommand(
      request.id, approvalType, ApprovalState.DENY)
    })).then(() => {
      this.props.dispatch(Actions.removeCommandRequest(request.id));
    });
  }

  ignore(request) {
    this.props.dispatch(Actions.removeCommandRequest(request.id));
  }

  render() {
    if (Object.keys(this.props.commandRequests).length === 0) {
      return null;
    }
    // Get the earliest command request
    let minDate = new Date();
    let minId;
    Object.values(this.props.commandRequests).forEach((commandRequest) => {
      let current = new Date(commandRequest.date);
      if (current < minDate) {
        minDate = current;
        minId = commandRequest.id;
      }
    });
    console.log(minId);
    console.log(this.props.commandRequests);
    let request = this.props.commandRequests[minId];
    if (!request) {
      return null;
    }

    // Get strings for displaying which user is asking to do which command
    const deviceLabel = Capability.getLabel({
      devices: { deviceDesc: this.props.deviceDesc }
    }, request.deviceId);

    const requesterName = this.props.users[request.requesterId].displayName;

    let switchVerb = '';
    if (request.command === 'on' || request.command === 'off') {
      switchVerb = 'turn';
    }

    // Create string describing the permission being requested
    let permissions = this.props.permissions[request.deviceId];
    let authorizations = [];
    let approvalTypes = [];
    if (request.ownerApproval === ApprovalState.PENDING &&
        permissions.owners.includes(this.props.me) &&
        !permissions.owners.includes(request.requesterId)) {
      approvalTypes.push(ApprovalType.OWNERS);
      authorizations.push(`an owner of ${deviceLabel}`);
    }

    if (request.nearbyApproval === ApprovalState.PENDING &&
        permissions.locationRestrictions[request.requesterId] === LocationRestrictions.NEARBY) {
      approvalTypes.push(ApprovalType.NEARBY);
      authorizations.push(`nearby ${deviceLabel}`);
    } else if (request.nearbyApproval[request.requesterId] === ApprovalState.PENDING &&
        permissions.locationRestrictions === LocationRestrictions.AT_HOME) {
      approvalTypes.push(ApprovalType.AT_HOME);
      authorizations.push('at home');
    }
    let authorization = authorizations.join(' and you are ');

    let requestDate = new Date(request.date).toLocaleTimeString();

    return (
      <div>
        <div className="modal-bg fade" onClick={this.deny}/>
        <div className="modal-window fade">
          <div className="modal-heading-container">
            <h3 className="modal-heading">Request for permission</h3>
            <MaterialIcon icon="close" onClick={() => { this.ignore(request) }}/>
          </div>
          <div className="modal-content">
            <span className="subtext">{requestDate}</span>
            <p>
              <b>{requesterName}</b>&nbsp;is asking for permission to&nbsp;
              <b>{switchVerb} {request.command}</b>&nbsp;<b>{deviceLabel}</b>.
            </p>
            <p>
              Do you want to allow this?
              <br/>
              <span className="subtext">You are being asked because you are {authorization}</span>
            </p>

            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <Button className="prompt-button" onClick={() => { this.allow(request, approvalTypes) }}>
                Allow
              </Button>
              <Button className="prompt-button mdc-button-blue" raised onClick={() => { this.deny(request, approvalTypes) }}>
                Deny
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

AskApprovalPrompt.propTypes = {
  deviceDesc: PropTypes.object,
  dispatch: PropTypes.func,
  permissions: PropTypes.object,
  commandRequests: PropTypes.object,
  users: PropTypes.object,
  me: PropTypes.string,
};

const mapStateToProps = (state) => {
  return {
    deviceDesc: state.devices.deviceDesc,
    permissions: state.devices.permissions,
    commandRequests: state.commandRequests,
    users: state.users,
    me: state.me,
  };
}

export default connect(mapStateToProps)(AskApprovalPrompt);
