import React from 'react';
import { Button, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { navigate, Views } from '../redux/actions';
import FCM, { FCMEvent } from 'react-native-fcm';




class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = { notification: '' };
    this.signOut = this.signOut.bind(this);
  }

  componentDidMount() {
    FCM.requestPermissions()
      .then(() => console.log('Permissions granted'))
      .catch(() => console.error('Permissions rejected'));

    FCM.getFCMToken()
      .then(this.sendTokenToServer)
      .catch(console.error);

    FCM.on(FCMEvent.Notification, async (notification) => {
      this.setState({ notification: JSON.stringify(notification, null, 2) });
    });
  }

  signOut() {
    this.props.dispatch(navigate(Views.LOGIN));
  }

  sendTokenToServer(token) {
    return fetch(
      `http://selenium.dyn.cs.washington.edu:5000/notificationToken?token=${token}`,
      {
        method: 'POST',
        crednetials: 'same-origin'
      }
    );
  }

  render() {
    return (
      <View>
        <Button title="Sign Out" onPress={this.signOut} />
        { this.state.notification === ''
          ? null
          : <Text selectable={true}>{this.state.notification}</Text>
        }
      </View>
    );
  }
}

export default connect()(Home);