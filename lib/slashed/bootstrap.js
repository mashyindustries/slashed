'use strict';

require('./globals');

var configure = require('./configure');
var middleware = require('./middleware');
var views = require('./views');

module.exports = function(app, basedir) {

    slashed.log("Bootstrapping");

    return configure(app, basedir)
        .then(middleware)
        .then(views)
        .then(function(app){
            slashed.log("Finished Bootstrapping")
            return app;
        });
}