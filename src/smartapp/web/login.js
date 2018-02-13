import React from 'react';
import ReactDOM from 'react-dom';
import Authenticate from './components/Authenticate.react';
import qs from 'querystring';

let query = qs.parse(location.search.slice(1));
console.log(query);
ReactDOM.render(
  <Authenticate oauth={!!query.oauth && query.oauth == 'true'}/>,
  document.getElementById('react'));