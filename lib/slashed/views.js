'use strict';

var StexEngine = require('stexengine');
var path = require('path');

module.exports = function(app) {

    var config = app.config.get('stex');

    if(typeof config == 'undefined'){
        var basedir = path.resolve(app.config.get('basedir'), 'views');
        config = {
            basedir: basedir
        }
    }

    var engine = new StexEngine(config);

    var middleware = function middleware(req, res, next){
        res.render = function(view){
            res.send(engine.render(view));
        };
        next();
    }

    app.render = engine.render;
    app.use(middleware);

    return app;
};