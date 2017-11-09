'use strict';

/**
 * Module dependencies.
 * @private
 */

var accepts = require('accepts');
var typeis = require('type-is');
var http = require('http');
var parseRange = require('range-parser');
var url = require('url');

/**
 * Request prototype.
 * @public
 */

var req = Object.create(http.IncomingMessage.prototype)

/**
 * Module exports.
 * @public
 */

module.exports = req

/**
 * Return request header.
 *
 * The `Referrer` header field is special-cased,
 * both `Referrer` and `Referer` are interchangeable.
 *
 * Examples:
 *
 *     req.get('Content-Type');
 *     // => "text/plain"
 *
 *     req.get('content-type');
 *     // => "text/plain"
 *
 *     req.get('Something');
 *     // => undefined
 *
 * Aliased as `req.header()`.
 *
 * @param {String} name
 * @return {String}
 * @public
 */

req.get =
    req.header = function header(name) {
        if (!name) {
            throw new TypeError('name argument is required to req.get');
        }

        if (typeof name !== 'string') {
            throw new TypeError('name must be a string to req.get');
        }

        var lc = name.toLowerCase();

        switch (lc) {
            case 'referer':
            case 'referrer':
                return this.headers.referrer
                    || this.headers.referer;
            default:
                return this.headers[lc];
        }
    };

/**
 * @param {String|Array} type(s)
 * @return {String|Array|Boolean}
 * @public
 */

req.accepts = function () {
    var accept = accepts(this);
    return accept.types.apply(accept, arguments);
};

/**
 * Check if the given `encoding`s are accepted.
 *
 * @param {String} ...encoding
 * @return {String|Array}
 * @public
 */

req.acceptsEncodings = function () {
    var accept = accepts(this);
    return accept.encodings.apply(accept, arguments);
};

/**
 * Check if the given `charset`s are acceptable,
 * otherwise you should respond with 406 "Not Acceptable".
 *
 * @param {String} ...charset
 * @return {String|Array}
 * @public
 */

req.acceptsCharsets = function () {
    var accept = accepts(this);
    return accept.charsets.apply(accept, arguments);
};

/**
 * Check if the given `lang`s are acceptable,
 * otherwise you should respond with 406 "Not Acceptable".
 *
 * @param {String} ...lang
 * @return {String|Array}
 * @public
 */

req.acceptsLanguages = function () {
    var accept = accepts(this);
    return accept.languages.apply(accept, arguments);
};

/**
 * Parse Range header field, capping to the given `size`.
 *
 * Unspecified ranges such as "0-" require knowledge of your resource length. In
 * the case of a byte range this is of course the total number of bytes. If the
 * Range header field is not given `undefined` is returned, `-1` when unsatisfiable,
 * and `-2` when syntactically invalid.
 *
 * When ranges are returned, the array has a "type" property which is the type of
 * range that is required (most commonly, "bytes"). Each array element is an object
 * with a "start" and "end" property for the portion of the range.
 *
 * The "combine" option can be set to `true` and overlapping & adjacent ranges
 * will be combined into a single range.
 *
 * NOTE: remember that ranges are inclusive, so for example "Range: users=0-3"
 * should respond with 4 users when available, not 3.
 *
 * @param {number} size
 * @param {object} [options]
 * @param {boolean} [options.combine=false]
 * @return {number|array}
 * @public
 */

req.range = function range(size, options) {
    var range = this.get('Range');
    if (!range) return;
    return parseRange(size, range, options);
};

/**
 * Return the value of param `name` when present or `defaultValue`.
 *
 *  - Checks route placeholders, ex: _/user/:id_
 *  - Checks body params, ex: id=12, {"id":12}
 *  - Checks query string params, ex: ?id=12
 *
 * To utilize request bodies, `req.body`
 * should be an object. This can be done by using
 * the `bodyParser()` middleware.
 *
 * @param {String} name
 * @param {Mixed} [defaultValue]
 * @return {String}
 * @public
 */

req.param = function param(name, defaultValue) {
    var params = this.params || {};
    var body = this.body || {};
    var query = this.query || {};

    var args = arguments.length === 1
        ? 'name'
        : 'name, default';

    if (null != params[name] && params.hasOwnProperty(name)) return params[name];
    if (null != body[name]) return body[name];
    if (null != query[name]) return query[name];

    return defaultValue;
};

/**
 * Check if the incoming request contains the "Content-Type"
 * header field, and it contains the give mime `type`.
 * 
 * @param {String|Array} types...
 * @return {String|false|null}
 * @public
 */

req.is = function is(types) {
    var arr = types;

    // support flattened arguments
    if (!Array.isArray(types)) {
        arr = new Array(arguments.length);
        for (var i = 0; i < arr.length; i++) {
            arr[i] = arguments[i];
        }
    }

    return typeis(this, arr);
};
/**
 * Short-hand for `url.parse(req.url).pathname`.
 *
 * @return {String}
 * @public
 */

defineGetter(req, 'path', function path() {
    return url.parse(this.url).pathname;
});

/**
 * Helper function for creating a getter on an object.
 *
 * @param {Object} obj
 * @param {String} name
 * @param {Function} getter
 * @private
 */
function defineGetter(obj, name, getter) {
    Object.defineProperty(obj, name, {
        configurable: true,
        enumerable: true,
        get: getter
    });
}
