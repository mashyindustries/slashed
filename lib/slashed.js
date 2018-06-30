'use strict';

/**
 * Module dependencies.
 */
require('./utils/globals')
var EventEmitter = require('events').EventEmitter
var mixin = require('merge-descriptors')
var proto = require('./application')
var Route = require('./routing/route')
var Router = require('./routing/router')
var req = require('./request')
var res = require('./response')
var caller = require('caller')

/**
 * Expose `createApplication()`.
 */

exports = module.exports = createApplication

/**
 * Create an express application.
 *
 * @return {Function}
 * @api public
 */

function createApplication(basedir) {

    if(!basedir){
        basedir = caller(2)
    }
    var app = function (req, res, next) {
        app.handle(req, res, next)
    };

    mixin(app, EventEmitter.prototype, false) //object.assign
    mixin(app, proto, false)

    app.init(basedir)

    return app
}

/**
 * Expose the prototypes.
 */

exports.application = proto;
exports.request = req;
exports.response = res;

/**
 * Expose constructors.
 */

exports.Route = Route;
exports.Router = Router;