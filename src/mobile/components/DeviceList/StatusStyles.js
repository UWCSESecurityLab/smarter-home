import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  buttonActive: {
    backgroundColor: '#73C046',
    borderColor: '#dddddd',
    borderWidth: 0.5,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: 130
  },
  buttonInactive: {
    borderColor: '#dddddd',
    borderWidth: 0.5,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: 130,
  },
  status: {
    fontSize: 16,
    textAlign: 'center'
  }
});

export default styles;