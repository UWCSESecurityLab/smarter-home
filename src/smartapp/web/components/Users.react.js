import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SmartAppClient } from 'common';
import * as Actions from '../redux/actions';

const smartAppClient = new SmartAppClient();

class Users extends React.Component {
  componentDidMount() {
    // TODO: move to HomeState
    smartAppClient.listUsers().then((users) => {
      this.props.dispatch(Actions.setUsers(users));
    });
    this.scanKey = this.scanKey.bind(this);
    this.stopScan = this.stopScan.bind(this);
  }

  scanKey() {
    if (window.cordova) {
      QRScanner.scan((err, text) => {
        if (err) {
          console.error(err);
          this.stopScan();
        } else {
          this.stopScan();
          smartAppClient.addNewUser(JSON.parse(text)).then(() => {
            alert('Registered new user');
          }).catch((err) => {
            alert(err);
          });
        }
      });
      QRScanner.show();
      document.getElementsByTagName('body')[0].style.background = 'transparent';
      this.props.setVisibility(false);
    }
  }

  stopScan() {
    QRScanner.destroy();
    this.props.setVisibility(true);
    document.getElementsByTagName('body')[0].style.background = '#5FC4FA';
  }

  render() {
    return (
      <section className="home-item">
        <h3>Users</h3>
        { Object.values(this.props.users).map((user) =>
            <div className="device-li" key={user.id}>
              <span className="device-li-label">
                {user.displayName}
              </span>
            </div>
          )
        }
        <div className="device-li" onClick={this.scanKey}>
          <span className="device-li-label">
            + Add User
          </span>
        </div>
      </section>
    );
  }
}

Users.propTypes = {
  dispatch: PropTypes.func,
  setVisibility: PropTypes.func,
  users: PropTypes.object
}

const mapStateToProps = (state) => {
  return {
    users: state.users
  }
}

export default connect(mapStateToProps)(Users);

