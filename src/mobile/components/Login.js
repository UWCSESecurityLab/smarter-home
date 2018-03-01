import React from 'react';
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

export default class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      error: ''
    }
    this.login = this.login.bind(this);
  }

  login() {
    console.log('login');

    let query = `username=${this.state.username}&password=${this.state.password}`;
    fetch('http://selenium.dyn.cs.washington.edu:5000/login?' + query, {
      method: 'POST'
    }).then((response) => {
      console.log(response);
      if (!response.ok) {
        this.setState({ error: 'Invalid username or password'});
      } else {
        this.setState({ error: '' });
        console.log('Success');
      }
    }).catch(() => {
      this.setState({ error: 'Couldn\'t reach the Smart Notifications server.' });
    });;
  }

  render() {
    return(
      <View style={styles.background}>
        <View style={styles.container}>
          <Text style={styles.title}>Log into Smart Notifications</Text>
          <TextInput
            placeholder="Username"
            onChangeText={(text) => this.setState({username: text})}
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            secureTextEntry={true}
            onChangeText={(text) => this.setState({password: text})}
            style={styles.input}
          />
          <View style={styles.buttonView}>
            <Button title="Log In" onPress={this.login} style={styles.button}/>
          </View>
          <Text>{this.state.error}</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#00a6ff',
  },
  buttonView: {
    marginTop: 25
  },
  container: {
    backgroundColor: '#FFFFFF',
    marginTop: 15,
    marginLeft: 15,
    marginBottom: 15,
    marginRight: 15,
    paddingTop: 25,
    paddingRight: 25,
    paddingBottom: 15,
    paddingLeft: 25,
    borderRadius: 8
  },
  title: {
    fontSize: 24
  },
  input: {
    fontSize: 18
  }
});