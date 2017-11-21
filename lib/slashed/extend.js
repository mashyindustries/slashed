'use strict';

var path = require('path');
var bootstrap = require('./bootstrap')

module.exports = function (app) {
    var start, error, promise
    var basedir = app.basedir

    if(!basedir){
        throw Error('No app.basedir provided')
    }

    //app._router.stack.pop(); //stops requests from routing?

    // Create App Events
    start = app.emit.bind(app, 'start')
    error = app.emit.bind(app, 'error')

    // Bootstrap app and refuse any requests until the app is ready
    promise = bootstrap(app, basedir)
    promise.then(start, error)
    
    app.use(function startup(req, res, next) {
        if (promise.isPending()) {
            res.status(503)
            res.send('Server is starting.')
            return
        }

        if (promise.isRejected()) {
            res.status(503)
            res.send('The Server failed to start.')
            return
        }

        next()
    })

    return app
}