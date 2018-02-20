const colors = require('colors/safe');

function print(type, message) {
  console.log('[' + type + '] ' + message);
}

// Basic colors
exports.black = (type, message) => {
  print(colors.black(type), message);
}

exports.red = (type, message) => {
  print(colors.red(type), message);
}

exports.green = (type, message) => {
  print(colors.green(type), message);
}

exports.yellow = (type, message) => {
  print(colors.yellow(type), message);
}

exports.blue = (type, message) => {
  print(colors.blue(type), message);
}

exports.magenta = (type, message) => {
  print(colors.magenta(type), message);
}

exports.cyan = (type, message) => {
  print(colors.cyan(type), message);
}

exports.white = (type, message) => {
  print(colors.white(type), message);
}

exports.gray = (type, message) => {
  print(colors.gray(type), message);
}

// Shorthand functions
exports.log = (message) => { exports.yellow('Log', message) }
exports.error = (message) => { exports.red('Error', message) }
