import React from 'react';
import Button from '@material/react-button';
import Capability from '../lib/capabilities/Capability';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import * as Actions from '../redux/actions';
import { ApprovalState, ApprovalType , LocationRestrictions } from '../../permissions';
import { connect } from 'react-redux';
import { CSSTransition } from 'react-transition-group';
import SmartAppClient from '../lib/SmartAppClient';

let smartAppClient = new SmartAppClient();

class PermissionsPrompt extends React.Component {
  constructor(props) {
    super(props);
    this.allow = this.allow.bind(this);
    this.deny = this.deny.bind(this);
    this.ignore = this.ignore.bind(this);
  }

  allow(request, approvalType) {
    smartAppClient.postPendingCommand(
      request.id, approvalType, ApprovalState.ALLOW)
      .then(() => {
        this.props.dispatch(Actions.removeCommandRequest(request.id));
      });
  }

  deny(request, approvalType) {
    smartAppClient.postPendingCommand(
      request.id, approvalType, ApprovalState.DENY)
      .then(() => {
        this.props.dispatch(Actions.removeCommandRequest(request.id));
      });
  }

  ignore(request) {
    this.props.dispatch(Actions.removeCommandRequest(request.id));
  }

  render() {
    const show = Object.keys(this.props.commandRequests).length !== 0;
    let content;
    if (show) {
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
      let permissions = this.props.permissions[request.deviceId];

      const deviceLabel = Capability.getLabel({
        devices: { deviceDesc: this.props.deviceDesc }
      }, request.deviceId);

      const requesterName = this.props.users[request.requesterId].displayName;

      let switchVerb = '';
      if (request.command === 'on' || request.command === 'off') {
        switchVerb = 'turn';
      }

      let authorization, approvalType;
      if (request.ownerApproval === ApprovalState.PENDING &&
          permissions.owners.includes(this.props.me)) {
        approvalType = ApprovalType.OWNERS;
        authorization = `an owner of ${deviceLabel}.`;
      } else if (request.nearbyApproval === ApprovalState.PENDING &&
          permissions.locationRestrictions === LocationRestrictions.NEARBY) {
        approvalType = ApprovalType.NEARBY;
        authorization = `nearby ${deviceLabel}.`;
      } else if (request.nearbyApproval === ApprovalState.PENDING &&
          permissions.locationRestrictions === LocationRestrictions.AT_HOME) {
        approvalType = ApprovalType.NEARBY;
        authorization = `at home.`;
      }

      let requestDate = new Date(request.date).toLocaleTimeString();

      content = (
        <div>
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
              <Button className="prompt-button" onClick={() => { this.allow(request, approvalType) }}>
                Allow
              </Button>
              <Button className="prompt-button mdc-button-blue" raised onClick={() => { this.deny(request, approvalType) }}>
                Deny
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <CSSTransition in={show} timeout={75} classNames={'fade'} mountOnEnter unmountOnExit>
        <div>
          <div className="modal-bg fade" onClick={this.deny}/>
          <div className="modal-window fade">
            {content}
          </div>
        </div>
      </CSSTransition>
    );
  }
}

PermissionsPrompt.propTypes = {
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

export default connect(mapStateToProps)(PermissionsPrompt);
