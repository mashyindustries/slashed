'use strict';

global.colors = require('colors');
global.mashed = {
    log: function(string){
        console.log(colors.blue('Mashed') + ': ' + string);
    }
}