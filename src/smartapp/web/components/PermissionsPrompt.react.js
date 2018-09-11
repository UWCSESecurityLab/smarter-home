import React from 'react';
import Actuatable from '../lib/capabilities/Actuatable';
import Button from '@material/react-button';
import Capability from '../lib/capabilities/Capability';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import * as Actions from '../redux/actions';
import { LocationRestrictions } from '../../permissions';
import { connect } from 'react-redux';
import { CSSTransition } from 'react-transition-group';

class PermissionsPrompt extends React.Component {
  constructor(props) {
    super(props);

    this.allow = this.allow.bind(this);
    this.deny = this.deny.bind(this);
    this.renderLocationPrompt = this.renderLocationPrompt.bind(this);
  }

  allow({ deviceId, capability, command }) {
    Actuatable.actuallyActuate(deviceId, capability, command);
    this.props.dispatch(Actions.removeTopPrompt());
  }

  deny() {
    this.props.dispatch(Actions.removeTopPrompt());
  }

  renderLocationPrompt(prompt) {
    const deviceLabel = Capability.getLabel({
      devices: { deviceDesc: this.props.deviceDesc }
    }, prompt.deviceId);

    let infoText = '';
    if (prompt.policy === LocationRestrictions.NEARBY) {
      infoText = 'You are not nearby this device.';
    } else if (prompt.policy === LocationRestrictions.AT_HOME) {
      infoText = 'You are not at home right now.';
    }

    return (
      <div>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <h3 className="modal-heading">Are you sure you want to do this?</h3>
          <MaterialIcon icon="close" onClick={this.deny}/>
        </div>
        <div className="prompt-command">{deviceLabel} → <b>{prompt.command}</b></div>
        <p>{infoText}</p>
        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
          <Button className="prompt-button" onClick={() => {this.allow(prompt)}}>
            Yes
          </Button>
          <Button className="prompt-button mdc-button-blue" raised onClick={this.deny}>
            No
          </Button>
        </div>
      </div>
    );
  }

  render() {
    const show = this.props.permissionPrompts.length !== 0;
    let content;
    if (show) {
      const prompt = this.props.permissionPrompts[0];
      if (prompt.promptType === 'location') {
        content = this.renderLocationPrompt(prompt);
      } else if (prompt.promptType === 'parental') {
        // TODO
      }
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
  permissionPrompts: PropTypes.array,
};

const mapStateToProps = (state) => {
  return {
    deviceDesc: state.devices.deviceDesc,
    permissions: state.devices.permissions,
    permissionPrompts: state.permissionPrompts,
  };
}

export default connect(mapStateToProps)(PermissionsPrompt);
