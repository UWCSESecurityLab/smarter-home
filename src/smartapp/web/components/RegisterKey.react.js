import React from 'react';
import qrcode from 'qrcode';
import Button from '@material/react-button';
import MaterialIcon from '@material/react-material-icon';
import * as Actions from '../redux/actions';
import { Link } from 'react-router-dom';
import { SmartAppClient } from 'common';

const smartAppClient = new SmartAppClient();

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
  return { publicKey: pub, privateKey: priv };
}

async function signChallenge(challenge, privateJwk) {
  let privateKey = await crypto.subtle.importKey(
    'jwk',
    privateJwk,
    {name: 'ECDSA', namedCurve: 'P-521'},
    true,
    ['sign']
  );
  let challengeBuf = new TextEncoder('utf-8').encode(challenge).buffer;
  let signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash : 'SHA-512' },
    privateKey,
    challengeBuf
  );
  let r = Array.from(
    new Uint8Array(signature.slice(0, signature.byteLength / 2)).toString()
  );
  let s = Array.from(
    new Uint8Array(signature.slice(signature.byteLength / 2)).toString()
  );
  return { r: r, s: s };
}

class RegisterKey extends React.Component {
  constructor(props) {
    super(props);
    this.login = this.login.bind(this);
  }

  async componentDidMount() {
    let publicJwk, privateJwk;
    let deviceKeys = localStorage.getItem('deviceKeys');
    if (!deviceKeys) {
      let jwks = await generateDeviceKeys();
      publicJwk = jwks.publicKey;
      privateJwk = jwks.privateKey;
    } else {
      publicJwk = JSON.parse(deviceKeys).publicKey;
      privateJwk = JSON.parse(deviceKeys).privateKey;
    }
    this.setState({ publicJwk: publicJwk, privateJwk, privateJwk });

    qrcode.toCanvas(document.getElementById('canvas'), JSON.stringify(publicJwk), (err) => {
      if (err) {
        console.error(err);
      }
    });
  }

  login() {
    smartAppClient.authChallenge(this.state.publicKey).then(({challenge}) => {
      return signChallenge(challenge, this.state.privateKey);
    }).then((signature) => {
      return smartAppClient.authResponse(signature);
    }).then(() => {
      this.state.dispatch(Actions.login());
    }).catch((err) => {
      console.error(err.stack);
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
        <Button className="mdc-button-blue auth-button" raised onClick={this.login}>
          Log In (After Scan)
        </Button>
      </div>
    );
  }
}

export default RegisterKey;