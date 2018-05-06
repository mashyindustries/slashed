'use strict';

/**
 * Module dependencies.
 * @private
 */
var accepts = require('accepts')
var http = require('http');

/**
 * Request prototype.
 * @public
 */

var req = Object.create(http.IncomingMessage.prototype)

/**
 * Return a request header.
 *
 * @param {String} headername
 * @return {String|undefined}
 * @public
 */
req.getheader = function getheader(headername) {
    if (!headername) {
        throw new TypeError('headername argument is required to req.header')
    }

    if (typeof headername !== 'string') {
        throw new TypeError('headername must be a string to req.header')
    }

    headername = headername.toLowerCase()

    return this.headers[headername]
}

/**
 * Check if the incoming request contains the "Content-Type"
 * header field and contains the given mime `type`.
 * 
 * @return {String}
 * @public
 */
req.path = function path(){
    return this.url
}

/**
 * Check if the incoming request contains the "Accept"
 * header field and contains the given mime `type`.
 * 
 * @return {accepts} accepts npm package
 * @public
 */
req.accepts = function(){
    var accept = accepts(this)
    return accept.type.apply(accept, arguments)
}

/**
 * Check if the incoming request contains the "Accepts-Encoding"
 * header field and contains the given mime `type`.
 * 
 * @return {accepts} accepts npm package
 * @public
 */
req.acceptsEncodings = function(){
    var accept = accepts(this)
    return accept.encodings.apply(accept, arguments)
}

req.is = function is(...urls){
    for (var url in urls){
        var regexp = '^' + urls[url].replace(/\\/, '/').replace(/(\*|\/\*)/, '(.*)') + '$'
        if(this.path().match(regexp)){
            return true;
        }
    }
    return false
}

req.secure = function secure(){
    console.log(this.connection.encrypted)
    return this.connection.encrypted
}

req.protocol = function protocol(){
    return this.connection.encrypted ? 'https' : 'http'
}

/**
 * Module exports.
 * @public
 */

module.exports = req