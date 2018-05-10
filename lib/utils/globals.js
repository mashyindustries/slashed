'use strict'

global.colors = require('colors');
global.slashed = {
    log: function(...args) {
        console.log(colors.blue('Slashed') + ': ' + args.join(''));
    },
    config: undefined //see extensions/configure.js
}