import React from 'react';
import ReactDOM from 'react-dom';
import Login from './components/Login.react';
import qs from 'querystring';

let query = qs.parse(location.search.slice(1));
console.log(query);
ReactDOM.render(
  <div id="authenticate">
    <Login
      oauth={true}
      oauthState={query.state}
    />
  </div>,
  document.getElementById('react'));