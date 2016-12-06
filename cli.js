#!/usr/bin/env node
'use strict';
const co = require('co');
const prompt = require('co-prompt');

co(function* () {
  while(true) {
    var text = yield prompt('$ ');
    console.log(text);
  }
})
