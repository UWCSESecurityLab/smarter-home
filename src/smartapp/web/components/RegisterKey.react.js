import React from 'react';
import qrcode from 'qrcode';
import Button from '@material/react-button';
import MaterialIcon from '@material/react-material-icon';
import { Link, Redirect } from 'react-router-dom';

async function generateDeviceKeys() {
  console.log('Generating keys...');
  let keys = await crypto.subtle.generateKey(
      {name: 'ECDSA', namedCurve: 'P-521'}, true, ['sign', 'verify']);

  let [pub, priv] = await Promise.all([
    crypto.subtle.exportKey('jwk', keys.publicKey),
    crypto.subtle.exportKey('jwk', keys.privateKey)
  ]);

  localStorage.setItem('deviceKeys',
                       JSON.stringify({publicKey: pub, privateKey: priv}));
  return pub;
}

class RegisterKey extends React.Component {
  async componentDidMount() {
    let publicKey;
    let deviceKeys = localStorage.getItem('deviceKeys');
    if (!deviceKeys) {
      publicKey = await generateDeviceKeys();
    } else {
      publicKey = JSON.parse(deviceKeys).publicKey;
    }

    qrcode.toCanvas(document.getElementById('canvas'), JSON.stringify(publicKey), (err) => {
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