'use strict';

/**
 * Module dependencies.
 * @private
 */
var http = require('http');
var path = require('path');
var mime = require('mime-types')

/**
 * Response prototype.
 * @public
 */

var res = Object.create(http.ServerResponse.prototype)

/**
 * Module exports.
 * @public
 */

module.exports = res

/**
 * Set status `code`.
 *
 * @param {Number} code
 * @return {ServerResponse}
 * @public
 */

res.status = function status(code) {
    this.statusCode = code;
    return this;
};

/**
 * Send a response.
 *
 * Examples:
 *
 *     res.send(new Buffer('wahoo'));
 *     res.send({ some: 'json' });
 *     res.send('<p>some html</p>');
 *
 * @param {string|number|boolean|object|Buffer} body
 * @public
 */
res.send = function send(body) {
    var encoding
    var length
    var req = this.req

    //set content type
    switch (typeof body) {
        case 'string':
            if (!this.getHeader('Content-Type')) {
                this.setHeader('Content-Type', mime.lookup('html'))
            }
            break;
        case 'boolean':
        case 'number':
        case 'object':
            if (body === null) {
                body = '';
            } else if (Buffer.isBuffer(body)) {
                if (!this.getHeader('Content-Type')) {
                    this.setHeader('Content-Type', 'application/octet-stream')
                }
            } else {
                return this.sendJSON(body);
            }
            break;
    }

    //set encoding type charset
    if (typeof body === 'string') {
        encoding = 'utf8';
    }

    //compression?
    if(req.acceptsEncodings('gzip')){
        //compress
    }

    //Content-Length
    if (body !== undefined) {
        if (!Buffer.isBuffer(body)) {
            // convert chunk to Buffer; saves later double conversions
            body = new Buffer(body, encoding);
            encoding = undefined;
        }

        length = body.length;
        this.setHeader('Content-Length', length);
    }
    
    // strip irrelevant headers
    if (this.statusCode === 204 || this.statusCode === 304) {
        this.removeHeader('Content-Type')
        this.removeHeader('Content-Length')
        this.removeHeader('Content-Encoding')
        body = ""
    }
    //end(body, encoding)
    if (req.method === 'HEAD') {
        this.end();
    } else {
        this.end(body, encoding);
    }

    return this;
}

/**
 * Send JSON response.
 *
 * Examples:
 *
 *     res.sendJSON(null);
 *     res.sendJSON({ user: 'tj' });
 *
 * @param {string|number|boolean|object} obj
 * @public
 */
res.sendJSON = function json(obj) {
    var body = JSON.stringify(obj)

    this.setHeader('Content-Type', mime.lookup('json'))

    return this.send(body)
}

/*
res.redirect = function redirect(url) {
    var address = url;
    var body;
    var status = 302;

    // allow status / url
    if (arguments.length === 2) {
    if (typeof arguments[0] === 'number') {
        status = arguments[0];
        address = arguments[1];
    } else {
        deprecate('res.redirect(url, status): Use res.redirect(status, url) instead');
        status = arguments[1];
    }
}*/

/**
 * Send given HTTP status code.
 *
 * Sets the response status to `statusCode` and the body of the
 * response to the standard description from node's http.STATUS_CODES
 * or the statusCode number if no description.
 *
 * Examples:
 *
 *     res.sendStatus(200);
 *
 * @param {number} statusCode
 * @public
 */

res.sendStatus = function sendStatus(statusCode) {
    this.statusCode = statusCode

    return this.send(String(statusCode))
}