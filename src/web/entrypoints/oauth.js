import React from 'react';
import ReactDOM from 'react-dom';
import Login from '../components/Login.react';
import qs from 'querystring';
import '../css/common.scss';

let query = qs.parse(location.search.slice(1));
ReactDOM.render(
  <div id="authenticate">
    <Login
      oauth={true}
      oauthState={query.state}
    />
  </div>,
  document.getElementById('react'));