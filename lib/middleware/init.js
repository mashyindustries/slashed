'use strict';

/**
 * Module dependencies.
 * @private
 */

var setPrototypeOf = require('setprototypeof')

/**
 * Initialization middleware, exposing the
 * request and response to each other
 *
 * @param {Function} app
 * @return {Function}
 * @api private
 */

module.exports = function (app) {
    return function expressInit(req, res, next) {
        req.res = res;
        res.req = req;
        req.next = next;

        setPrototypeOf(req, app.request)
        setPrototypeOf(res, app.response)

        res.locals = res.locals || Object.create(null);

        next();
    };
};

