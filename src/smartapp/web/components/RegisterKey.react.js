import React from 'react';
import qrcode from 'qrcode';
import Button from '@material/react-button';
import MaterialIcon from '@material/react-material-icon';
import { Link, Redirect } from 'react-router-dom';

class RegisterKey extends React.Component {
  componentDidMount() {
    qrcode.toCanvas(document.getElementById('canvas'), 'public key', (err) => {
      if (err) {
        console.error(err);
      }
    });
  }
  render() {
    return (
      <div>
        <Link to="/" className="link-plain">
          <Button className="back-button">
            <MaterialIcon icon="arrow_back"/>
            &nbsp;Back
          </Button>
        </Link>
        <div>
          <canvas id="canvas"></canvas>
        </div>
      </div>
    );
  }
}

export default RegisterKey;