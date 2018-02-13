import React from 'react';
import ReactDOM from 'react-dom';
import Authenticate from './components/Authenticate.react';
import queryString from 'query-string';

let qs = queryString.parse(location.search);
ReactDOM.render(
  <Authenticate oauth={!!qs.oauth && qs.oauth == 'true'}/>,
  document.getElementById('react'));