import React from 'react';
import Button from '@material/react-button';
import MaterialIcon from '@material/react-material-icon';
import PropTypes from 'prop-types';
import Radio from './Radio.react';
import toastError from '../lib/error-toaster';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import * as Actions from '../redux/actions';
import * as Flags from '../../flags';

import '../css/settings.scss';

class NotificationSettings extends React.Component {
  constructor(props) {
    super(props);
    this.changeFlag = this.changeFlag.bind(this);
    this.enableNotifications = this.enableNotifications.bind(this);
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
    // If turning background scanning off, disable anything that depends on it.
    if (value === Flags.BackgroundScanning.OFF) {
      this.props.dispatch(Actions.setFlag({
        nearbyNotifications: Flags.NearbyNotifications.OFF
      }));
      if (this.props.flags.activityNotifications ===
        Flags.ActivityNotifications.PROXIMITY) {
          this.props.dispatch(Actions.setFlag({
            activityNotifications: Flags.ActivityNotifications.ON
          }));
      }
    }
    this.state.notifications.updateToken().catch(toastError);
  }

  async enableNotifications() {
    try {
      await this.state.notifications.enableNotifications();
      await this.state.notifications.updateToken();
    } catch (e) {
      toastError(e);
    }
  }

  render() {
    const activityFlag = this.props.flags.activityNotifications;
    const nearbyFlag = this.props.flags.nearbyNotifications;
    const backgroundFlag = this.props.flags.backgroundScanning;

    let isMobile = !!window.cordova;
    let isAndroid = !!window.cordova && device.platform === 'Android';

    return (
      <section className="home-item">
        <h3 className="settings-heading">Notification Settings</h3>
        { this.props.notificationsEnabled
          ? null
          : <Button onClick={this.enableNotifications}>Enable notifications</Button>
        }

        <Link className="link-plain" to="/notificationSettings/activity">
          <div className="settings-item settings-expand-item">
            <div>
              <h4 className="settings-subheading">Activity Notifications</h4>
              <div>
                Get notified when things in your home happen automatically.
              </div>
            </div>
            <MaterialIcon icon="arrow_forward_ios" style={{ color: '#8c8c8c' }}/>
            {/* <Radio
              name="activityNotifications"
              id={Flags.ActivityNotifications.ON}
              checked={activityFlag === Flags.ActivityNotifications.ON}
              label="Enabled"
              onRadioChange={this.changeFlag} />
            <Radio
                name="activityNotifications"
                id={Flags.ActivityNotifications.PROXIMITY}
                checked={activityFlag === Flags.ActivityNotifications.PROXIMITY}
                label="Enabled, but only for activity in the same room as me"
                onRadioChange={this.changeFlag} />
            <Radio
                name="activityNotifications"
                id={Flags.ActivityNotifications.OFF}
                checked={activityFlag === Flags.ActivityNotifications.OFF}
                label="Disabled"
                onRadioChange={this.changeFlag} /> */}
          </div>
        </Link>

        <div className="settings-item">
          <h4 className="settings-subheading">Nearby Device Notifications</h4>
          <div>
            Show the devices around you in your notification center.
          </div>
          <Radio
              name="nearbyNotifications"
              id={Flags.NearbyNotifications.ON}
              checked={nearbyFlag === Flags.NearbyNotifications.ON}
              label="Enabled (Android only)"
              disabled={!isMobile}
              onRadioChange={this.changeFlag} />
          <Radio
              name="nearbyNotifications"
              id={Flags.NearbyNotifications.OFF}
              checked={nearbyFlag === Flags.NearbyNotifications.OFF}
              label="Disabled"
              onRadioChange={this.changeFlag} />
        </div>

        <div className="settings-item">
          <h4 className="settings-subheading">Background Beacon Scanning</h4>
          <div>
            Allow your phone to scan for beacons when the
            SmarterHome app is closed. You can turn this off to reduce battery
            usage. However, it must be enabled to enable Nearby Notifications
            and proximity-based Activity Notifications.
          </div>
          <Radio
            name="backgroundScanning"
            id={Flags.BackgroundScanning.ON}
            checked={backgroundFlag === Flags.BackgroundScanning.ON}
            label="Enabled (mobile only)"
            disabled={!isMobile}
            onRadioChange={this.changeFlag} />
          <Radio
            name="backgroundScanning"
            id={Flags.BackgroundScanning.OFF}
            checked={backgroundFlag === Flags.BackgroundScanning.OFF}
            label="Disabled"
            onRadioChange={this.changeFlag} />
        </div>
      </section>
    );
  }
}

NotificationSettings.propTypes = {
  dispatch: PropTypes.func,
  fcmToken: PropTypes.string,
  flags: PropTypes.object,
  notificationsEnabled: PropTypes.bool,
  notificationPrefs: PropTypes.object
}

const mapStateToProps = (state) => {
  return {
    fcmToken: state.fcm.fcmToken,
    flags: state.flags,
    notificationsEnabled: state.fcm.notificationsEnabled,
  };
}

export default connect(mapStateToProps)(NotificationSettings);