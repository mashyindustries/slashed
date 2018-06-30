'use strict';

/**
 * Module dependencies.
 */

var url = require('url')
var queryparse = require('qs').parse

module.exports = function query(ctx, next) {
    if (!ctx.req.query) {
        var val = url.parse(ctx.req.url).query
        ctx.req.query = queryparse(val)
    }
    next();
}
