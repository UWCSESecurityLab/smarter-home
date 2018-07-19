const colors = require('colors/safe');
function ts() {
  return new Date().toLocaleString() + ': ';
}

function print(type, message) {
  console.log('[' + type + '] ' + message);
}

// Basic colors
exports.black = (type, message) => {
  print(colors.black(ts() + type), message);
}

exports.red = (type, message) => {
  print(colors.red(ts() + type), message);
}

exports.green = (type, message) => {
  print(colors.green(ts() + type), message);
}

exports.yellow = (type, message) => {
  print(colors.yellow(ts() + type), message);
}

exports.blue = (type, message) => {
  print(colors.blue(ts() + type), message);
}

exports.magenta = (type, message) => {
  print(colors.magenta(ts() + type), message);
}

exports.cyan = (type, message) => {
  print(colors.cyan(ts() + type), message);
}

exports.white = (type, message) => {
  print(colors.white(ts() + type), message);
}

exports.gray = (type, message) => {
  print(colors.gray(ts() + type), message);
}

// Shorthand functions
exports.log = (message) => { exports.yellow('Log', message) }
exports.error = (message) => { exports.red('Error', message) }
