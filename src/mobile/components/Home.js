import React from 'react';
import { Button, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { navigate, Views } from '../redux/actions';

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.signOut = this.signOut.bind(this);
  }

  signOut() {
    this.props.dispatch(navigate(Views.LOGIN));
  }

  render() {
    return (
      <View>
        <Text>Home component</Text>
        <Button title="Sign Out" onPress={this.signOut} />
      </View>
    );
  }
}

export default connect()(Home);