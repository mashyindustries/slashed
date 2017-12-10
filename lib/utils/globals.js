'use strict'

global.colors = require('colors');
global.slashed = {
    log: function(string){
        console.log(colors.blue('Slashed') + ': ' + string);
    },
    config: undefined //see extensions/configure.js
}