import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

class FirebaseOptions extends React.Component {
  constructor(props) {
    super(props);
    this.enableNotifications = this.enableNotifications.bind(this);
  }

  async enableNotifications() {
    try {
      await this.props.notifications.enableNotifications();
      await this.props.notifications.updateToken();
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    return (
     <section className="home-item">
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
  notifications: PropTypes.object,
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