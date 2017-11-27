'use strict'

/**
 * Module dependencies.
 * @private
 */
var url = require('url')
var statuses = require('statuses')

var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
function escapeHtml (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s];
    });
}

/**
 * Create a minimal HTML document.
 *
 * @param {string} message
 * @private
 */

function createHtmlDocument(message) {
    var body = escapeHtml(message)
        .replace(RegExp(/\n/, 'g'), '<br>')
        .replace(RegExp(/\x20{2}/, 'g'), ' &nbsp;')

    return '<!DOCTYPE html>\n' +
        '<html lang="en">\n' +
        '<head>\n' +
        '<meta charset="utf-8">\n' +
        '<title>Error</title>\n' +
        '</head>\n' +
        '<body>\n' +
        '<h1><pre>Error</pre></h1>' +
        '<pre>' + body + '</pre>\n' +
        '</body>\n' +
        '</html>\n'
}

/**
 * Module exports.
 * @public
 */

module.exports = finalhandler

/**
 * Create a function to handle the final response.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Object} [options]
 * @return {Function}
 * @public
 */

function finalhandler(req, res) {
    return function (err) {
        var headers
        var msg
        var status

        // ignore 404 on in-flight response
        if (!err && res._header) {
            debug('cannot 404 after headers sent')
            return
        }

        // unhandled error
        if (err) {
            console.log(err)
            // respect status code from error
            status = getErrorStatusCode(err)

            // respect headers from error
            if (status !== undefined) {
                headers = getErrorHeaders(err)
            }

            // fallback to status code on response
            if (status === undefined) {
                status = getResponseStatusCode(res)
            }

            // get error message
            msg = statuses[status]
        } else {
            // not found
            status = 404
            msg = 'Cannot ' + req.method + ' ' + req.url
        }

        // cannot actually respond
        if (res._header) {
            req.socket.destroy()
            return
        }

        // send response
        send(req, res, status, msg)
    }
}

/**
 * Get headers from Error object.
 *
 * @param {Error} err
 * @return {object}
 * @private
 */

function getErrorHeaders(err) {
    if (!err.headers || typeof err.headers !== 'object') {
        return undefined
    }

    var headers = Object.create(null)
    var keys = Object.keys(err.headers)

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        headers[key] = err.headers[key]
    }

    return headers
}

/**
 * Get status code from Error object.
 *
 * @param {Error} err
 * @return {number}
 * @private
 */

function getErrorStatusCode(err) {
    // check err.status
    if (typeof err.status === 'number' && err.status >= 400 && err.status < 600) {
        return err.status
    }

    // check err.statusCode
    if (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600) {
        return err.statusCode
    }

    return undefined
}

/**
 * Get status code from response.
 *
 * @param {OutgoingMessage} res
 * @return {number}
 * @private
 */

function getResponseStatusCode(res) {
    var status = res.statusCode

    // default status code to 500 if outside valid range
    if (typeof status !== 'number' || status < 400 || status > 599) {
        status = 500
    }

    return status
}

/**
 * Send response.
 *
 * @param {IncomingMessage} req
 * @param {OutgoingMessage} res
 * @param {number} status
 * @param {object} headers
 * @param {string} message
 * @private
 */

function send(req, res, status, message) {
    // response body
    var body = createHtmlDocument(message)

    // response status
    res.statusCode = status
    res.statusMessage = statuses[status]

    // standard headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'))

    if (req.method === 'HEAD') {
        res.end()
        return
    }

    res.end(body, 'utf8')

}