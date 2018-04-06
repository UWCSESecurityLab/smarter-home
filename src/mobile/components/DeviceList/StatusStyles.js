import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  buttonActive: {
    backgroundColor: '#73C046',
    borderColor: '#dddddd',
    borderWidth: 0.5,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    width: 110
  },
  buttonInactive: {
    borderColor: '#dddddd',
    borderWidth: 0.5,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    width: 110,
  },
  status: {
    fontSize: 16,
    textAlign: 'center'
  }
});

export default styles;