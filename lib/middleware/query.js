'use strict';

/**
 * Module dependencies.
 */

var merge = require('utils-merge')
var url = require('url');
var qs = require('qs');

/**
 * @param {Object} options
 * @return {Function}
 * @api public
 */

module.exports = function query(){
    var queryparse = qs.parse;
    
    return function query(req, res, next) {
        if (!req.query) {
            var val = URL.parse(req.url).query;
            req.query = queryparse(val);
        }

        next();
    };
};
