'use strict';

/**
 * Module dependencies.
 * @private
 */
var finalhandler = require('./finalhandler')
var Router = require('./routing/router')
var methods = require('methods')
var init = require('./middleware/init')
var query = require('./middleware/query')
var http = require('http')
var path = require('path')
var setPrototypeOf = require('setprototypeof')
var slice = Array.prototype.slice
var Bluebird = require('bluebird')

/**
 * Extensions
 * @private
 */
var configure = require('./extensions/configure')
var middleware = require('./extensions/middleware')
var views = require('./extensions/views')

/**
 * Application prototype.
 */

var app = exports = module.exports = {}

app.is = 'app'

app.init = function init(basedir) {

    this.extend(configure, basedir)
    this.extend(middleware)
    this.extend(views)

    this.on('mount', function onmount(parent) {
        setPrototypeOf(this.request, parent.request)
        setPrototypeOf(this.response, parent.response)
    });

    // top-most app is mounted at /
    this.mountpath = '/'
};

/**
 * lazily adds the base router if it has not yet been added.
 *
 * We cannot add the base router in the defaultConfiguration because
 * it reads app settings which might be set after that has run.
 *
 * @private
 */
app.lazyrouter = function lazyrouter() {
    if (!this._router) {
        this._router = new Router()

        this.useBaseMiddleware()
    }
};

app.useBaseMiddleware = function useBaseMiddleware() {
    this._router.use(init(this))
    this._router.use(query())
};

/**
 * Dispatch a req, res pair into the application. Starts pipeline processing.
 *
 * If no callback is provided, then default error handlers will respond
 * in the event of an error bubbling through the stack.
 *
 * @private
 */

app.handle = function handle(req, res, callback) {
    var router = this._router;

    callback = callback || finalhandler(req, res)

    if (!router) {
        callback();
        return;
    }

    router.handle(req, res, callback);
};

/**
 * Proxy `Router#use()` to add middleware to the app router.
 * See Router#use() documentation for details.
 *
 * If the _fn_ parameter is an express app, then it will be
 * mounted at the _route_ specified.
 *
 * @public
 */

app.use = function use(fn) {
    var offset = 0;
    var path = '/';

    // default path to '/'
    // disambiguate app.use([fn])
    if (typeof fn !== 'function') {
        var arg = fn;

        while (Array.isArray(arg) && arg.length !== 0) {
            arg = arg[0];
        }

        // first arg is the path
        if (typeof arg !== 'function') {
            offset = 1;
            path = fn;
        }
    }

    var fns = Array.from(slice.call(arguments, offset));

    if (fns.length === 0) {
        throw new TypeError('app.use() requires middleware functions')
    }

    // setup router
    this.lazyrouter();
    var router = this._router

    fns.forEach(function (fn) {
        // non-express app
        if (fn.is !== 'app') {
            return router.use(path, fn)
        }

        fn.mountpath = path;
        fn.parent = this

        // restore .app property on req and res
        router.use(path, function mounted_app(req, res, next) {
            var orig = req.app
            fn.handle(req, res, function (err) {
                setPrototypeOf(req, orig.request)
                setPrototypeOf(res, orig.response)
                next(err)
            });
        });

        // mounted an app
        fn.emit('mount', this)
    }, this)

    return this
}

/**
 * Return the app's absolute pathname
 * based on the parent(s) that have
 * mounted it.
 *
 * For example if the application was
 * mounted as "/admin", which itself
 * was mounted as "/blog" then the
 * return value would be "/blog/admin".
 *
 * @return {String}
 * @private
 */

app.path = function path() {
    return this.parent
        ? this.parent.path() + this.mountpath
        : ''
}

/**
 * Listen for connections.
 *
 * A node `http.Server` is returned, with this
 * application (which is a `Function`) as its
 * callback. If you wish to create both an HTTP
 * and HTTPS server you may do so with the "http"
 * and "https" modules as shown here:
 *
 *    var http = require('http')
 *      , https = require('https')
 *      , express = require('express')
 *      , app = express();
 *
 *    http.createServer(app).listen(80);
 *    https.createServer({ ... }, app).listen(443);
 *
 * @return {http.Server}
 * @public
 */
app.listen = function listen() {
    var server = http.createServer(this)
    return server.listen.apply(server, arguments)
}

/**
 * 
 * @param {Function} extendFunction 
 * @param {*} args 
 */
app.extend = function extend(extendFunction, args){
    return Object.assign(this, extendFunction(this, args))
}