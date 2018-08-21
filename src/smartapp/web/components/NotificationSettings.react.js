import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material/react-button';
import { connect } from 'react-redux';
import * as Actions from '../redux/actions';
import * as Flags from '../../flags';

import '../css/notificationSettings.scss';

class NotificationSettings extends React.Component {
  constructor(props) {
    super(props);
    this.changeFlag = this.changeFlag.bind(this);
    this.enableNotifications = this.enableNotifications.bind(this);
    this.renderRadio = this.renderRadio.bind(this);
  }

  componentDidMount() {
    if (!window.cordova) {
      import('../lib/notifications/web-notifications.js').then((module) => {
        this.setState({ notifications: module.default });
      });
    } else {
      import('../lib/notifications/cordova-notifications.js').then((module) => {
        console.log('Imported cordova-notifications');
        this.setState({notifications: module.default });
        console.log(this.state);
      });
    }
  }

  changeFlag(key, value) {
    this.props.dispatch(Actions.setFlag({ [key]: value }));
    this.state.notifications.updateToken();
  }

  async enableNotifications() {
    try {
      await this.state.notifications.enableNotifications();
      await this.state.notifications.updateToken();
    } catch (e) {
      console.error(e);
    }
  }

  renderRadio({id, checked, label, name, isAndroidSpecific = false}) {
    let isAndroid = false;
    if (window.cordova && device.platform == 'Android') {
      isAndroid = true;
    }

    let disableClassName = '';
    if (isAndroidSpecific && !isAndroid) {
      disableClassName = ' mdc-radio--disabled'
    }
    return (
      <div className="mdc-form-field">
        <div className={'mdc-radio' + disableClassName}>
          <input className="mdc-radio__native-control"
                 type="radio" id={id} name={name}
                 checked={checked}
                 onChange={() => {
                    this.changeFlag(name, id)
                 }}/>
          <div className="mdc-radio__background">
            <div className="mdc-radio__outer-circle"></div>
            <div className="mdc-radio__inner-circle"></div>
          </div>
        </div>
        <label htmlFor={id}>{label}</label>
      </div>
    );
  }

  render() {
    const activityFlag = this.props.flags.activityNotifications;
    const nearbyFlag = this.props.flags.nearbyNotifications;

    return (
      <section className="home-item">
        <h3>Notification Settings</h3>
        { this.props.notificationsEnabled
          ? null
          : <Button onClick={this.enableNotifications}>Enable notifications</Button>
        }

        <h4>Activity Notifications</h4>
        <p>
          Get notified when things in your home happen automatically.
        </p>
        { this.renderRadio({
            name: 'activityNotifications',
            id: Flags.ActivityNotifications.ON,
            checked: activityFlag === Flags.ActivityNotifications.ON,
            label: 'On'
          })}
        { this.renderRadio({
            name: 'activityNotifications',
            id: Flags.ActivityNotifications.PROXIMITY,
            checked: activityFlag === Flags.ActivityNotifications.PROXIMITY,
            label: 'On, but only for activity in the same room as me (Android only)',
            isAndroidSpecific: true
        })}
        { this.renderRadio({
            name: 'activityNotifications',
            id: Flags.ActivityNotifications.OFF,
            checked: activityFlag === Flags.ActivityNotifications.OFF,
            label: 'Off'
        })}

        <h4>Nearby Device Notifications</h4>
        <p>
          Show the devices around you in your notification center.
        </p>
        { this.renderRadio({
            name: 'nearbyNotifications',
            id: Flags.NearbyNotifications.ON,
            checked: nearbyFlag === Flags.NearbyNotifications.ON,
            label: 'On (Android only)',
            isAndroidSpecific: true
        })}
        { this.renderRadio({
            name: 'nearbyNotifications',
            id: Flags.NearbyNotifications.OFF,
            checked: nearbyFlag === Flags.NearbyNotifications.OFF,
            label: 'Off'
        })}
      </section>
    );
  }
}

NotificationSettings.propTypes = {
  dispatch: PropTypes.func,
  fcmToken: PropTypes.string,
  flags: PropTypes.object,
  notificationsEnabled: PropTypes.bool,
  notificationData: PropTypes.object
}

const mapStateToProps = (state) => {
  return {
    fcmToken: state.fcm.fcmToken,
    flags: state.flags,
    notificationsEnabled: state.fcm.notificationsEnabled,
    notificationData: state.fcm.notificationData
  };
}

export default connect(mapStateToProps)(NotificationSettings);