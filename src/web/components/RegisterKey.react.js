import React from 'react';
import qrcode from 'qrcode';
import Button from '@material/react-button';
import MaterialIcon from '@material/react-material-icon';
import SmartAppClient from '../lib/SmartAppClient';
import * as Actions from '../redux/actions';
import { store } from '../redux/reducers';
import { Link } from 'react-router-dom';
import * as Errors from '../../errors';

const smartAppClient = new SmartAppClient();

async function generateDeviceKeys() {
  console.log('Generating keys...');
  let keys = await crypto.subtle.generateKey(
      {name: 'ECDSA', namedCurve: 'P-384'}, true, ['sign', 'verify']);
  console.log(keys);
  let [pub, priv] = await Promise.all([
    crypto.subtle.exportKey('jwk', keys.publicKey),
    crypto.subtle.exportKey('jwk', keys.privateKey)
  ]);

  localStorage.setItem('deviceKeys',
                       JSON.stringify({publicKey: pub, privateKey: priv}));
  return { publicKey: pub, privateKey: priv };
}

async function signChallenge(challenge, privateJwk) {
  console.log('Signing challenge ' + challenge);
  let privateKey = await crypto.subtle.importKey(
    'jwk',
    privateJwk,
    {name: 'ECDSA', namedCurve: 'P-384'},
    true,
    ['sign']
  );
  let challengeBuf = new TextEncoder('utf-8').encode(challenge).buffer;
  let signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-512' },
    privateKey,
    challengeBuf
  );
  let r = Array.from(new Uint8Array(signature.slice(0, signature.byteLength / 2)));
  let s = Array.from(new Uint8Array(signature.slice(signature.byteLength / 2)));
  return { r: r, s: s };
}

async function verifyChallenge(signature, text, publicJwk) {
  let publicKey = await crypto.subtle.importKey(
    'jwk',
    publicJwk,
    {name: 'ECDSA', namedCurve: 'P-384'},
    true,
    ['verify']
  );
  let mergedSignature = new Uint8Array(signature.r.concat(signature.s)).buffer;
  let challengeBuf = new TextEncoder('utf-8').encode(text);
  let res = await crypto.subtle.verify({name: 'ECDSA', namedCurve: 'P-384', hash: 'SHA-512'}, publicKey, mergedSignature, challengeBuf.buffer);
  if (res) {
    console.log('Verified own key');
  } else {
    console.log('Failed to verify own key');
  }
}

class RegisterKey extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, spinning: false };
    this.login = this.login.bind(this);
    this.renderError = this.renderError.bind(this);
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
    this.setState({ publicJwk: publicJwk, privateJwk: privateJwk });

    qrcode.toCanvas(document.getElementById('canvas'), JSON.stringify(publicJwk), (err) => {
      if (err) {
        console.error(err);
      }
    });
  }

  login() {
    this.setState({ spinning: true });
    smartAppClient.authChallenge(this.state.publicJwk).then(({challenge}) => {
      return signChallenge(challenge, this.state.privateJwk);
    }).then((signature) => {
      return smartAppClient.authResponse(signature);
    }).then(() => {
      store.dispatch(Actions.login());
    }).catch((err) => {
      this.setState({ error: err });
      console.error(err);
    }).finally(() => {
      this.setState({ spinning: false });
    });
  }

  renderError() {
    if (!this.state.error) {
      return null;
    }

    let content;
    if (this.state.error.error === Errors.CR_UNRECOGNIZED_KEY) {
      content = 'Can\'t find this QR code. Please scan it again.';
    } else if (this.state.error.error === Errors.CR_FAIL) {
      content = 'Couldn\'t authenticate this device. Please try adding this QR code again.';
    } else {
      content = 'Unknown error - please contact Eric';
    }
    return (
      <div className="error">
        {content}
      </div>
    );
  }

  render() {
    return (
      <div>
        <Link to="/" className="link-plain">
          <Button className="back-button"
                  icon={<MaterialIcon icon="arrow_back"/>}>
              Back
          </Button>
        </Link>
        <h3>Join an Existing SmarterHome</h3>
        <p>
          To join, have someone who is already part of the home select
          "Add Users" and scan your QR code.
        </p>
        <div id="qr-code">
          <canvas id="canvas"></canvas>
        </div>
        <p>
          When they are done adding you, click this button.
        </p>
        <Button className="mdc-button-blue auth-button" raised onClick={this.login}>
          Log In
        </Button>
        { this.state.spinning
          ? <span className="spinner"/>
          : null }
        {this.renderError()}
      </div>
    );
  }
}

export default RegisterKey;