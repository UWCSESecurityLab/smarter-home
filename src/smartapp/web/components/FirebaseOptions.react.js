import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import * as notifications from '../notifications';

class FirebaseOptions extends React.Component {
  constructor(props) {
    super(props);
  }

  async enableNotifications() {
    try {
      await notifications.enableNotifications();
      await notifications.updateToken();
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    return (
     <section>
        <h3>Firebase Cloud Messaging Configuration</h3>
        { this.props.notificationsEnabled
          ? <p><span className="check-mark">✓</span> Notifications enabled!</p>
          : <button onClick={this.enableNotifications}>Enable notifications</button>
        }
        { this.props.fcmToken
          ? <div>
              <p>This client&#39;s FCM token:</p>
              <div className="code-container">
                <code>{this.props.fcmToken}</code>
              </div>
            </div>
          : null
        }
        { this.props.notificationData ?
          <div>
            <p>Received notification data:</p>
            <div className="code-container">
              <code>
                { JSON.stringify(this.props.notificationData, null, 2) }
              </code>
            </div>
          </div>
          : null
        }
      </section>
    );
  }
}

FirebaseOptions.propTypes = {
  fcmToken: PropTypes.string,
  notificationsEnabled: PropTypes.bool,
  notificationData: PropTypes.object
}

function mapStateToProps(state) {
  return {
    fcmToken: state.fcm.fcmToken,
    notificationsEnabled: state.fcm.notificationsEnabled,
    notificationData: state.fcm.notificationData
  };
}

export default connect(mapStateToProps)(FirebaseOptions);