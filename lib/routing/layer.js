'use strict';

/**
 * Module dependencies.
 * @private
 */

var pathRegexp = require('path-to-regexp');

/**
 * Module variables.
 * @private
 */

var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Module exports.
 * @public
 */

module.exports = Layer;

function Layer(path, fn) {
    path = path.replace(/^\/*/, '/')

    if (!(this instanceof Layer)) {
        return new Layer(path, fn)
    }

    this.fn = fn
    this.name = fn.name || '<anonymous>'
    this.params = undefined
    this.path = undefined
    this.regexp = pathRegexp(path, this.keys = [])

    // set fast path flags
    this.regexp.fast_star = path === '*'
    this.regexp.fast_slash = path === '/' //fix this issue, removed opts.end
}

/**
 * Handle the error for the layer.
 *
 * @param {Error} error
 * @param {Context} ctx
 * @param {function} next
 * @api private
 */

Layer.prototype.handleError = async function handleError(ctx, err) {
    if (this.fn.length !== 2) {
        throw err //not a standard error handler
    }

    try {
        await this.fn(ctx, err);
    } catch (err) {
        throw err;
    }
};

/**
 * Handle the request for the layer.
 *
 * @param {Context} ctx
 * @param {function} next
 * @api private
 */

Layer.prototype.handle = async function handle(ctx) {
    if (this.length > 1) {
        return
    }
    
    await this.fn(ctx);
}

/**
 * Check if this route matches `path`, if so
 * populate `.params`.
 *
 * @param {String} path
 * @return {Boolean}
 * @api private
 */

Layer.prototype.match = function match(path) {
    var match

    if (path != null) {
        // fast path non-ending match for / (any path matches)
        if (this.regexp.fast_slash) {
            this.params = {}
            this.path = ''
            return true
        }

        // fast path for * (everything matched in a param)
        if (this.regexp.fast_star) {
            this.params = { '0': decode_param(path) }
            this.path = path
            return true
        }

        // match the path
        match = this.regexp.exec(path)
    }

    if (!match) {
        this.params = undefined;
        this.path = undefined;
        return false;
    }

    // store values
    this.params = {};
    this.path = match[0]

    var keys = this.keys;
    var params = this.params;

    for (var i = 1; i < match.length; i++) {
        var key = keys[i - 1];
        var prop = key.name;
        var val = decode_param(match[i])

        if (val !== undefined || !(hasOwnProperty.call(params, prop))) {
            params[prop] = val;
        }
    }

    return true;
};

/**
 * Decode param value.
 *
 * @param {string} val
 * @return {string}
 * @private
 */

function decode_param(val) {
    if (typeof val !== 'string' || val.length === 0) {
        return val;
    }

    try {
        return decodeURIComponent(val);
    } catch (err) {
        if (err instanceof URIError) {
            err.message = 'Failed to decode param \'' + val + '\'';
            err.status = err.statusCode = 400;
        }

        throw err;
    }
}
