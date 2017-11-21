'use strict';

require('./globals');

var configure = require('./configure');
var middleware = require('./middleware');
var views = require('./views');

module.exports = function(app, basedir) {

    mashed.log("Bootstrapping");

    return configure(app, basedir)
        .then(middleware)
        .then(views)
        .then(function(app){
            mashed.log("Finished Bootstrapping")
            return app;
        });
}