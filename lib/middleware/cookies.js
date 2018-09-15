'use strict'

var cookie = require('cookie')
var signature = require('cookie-signature')

/**
 * Module exports.
 * @public
 */

module.exports = cookieParser
module.exports.JSONCookie = JSONCookie
module.exports.JSONCookies = JSONCookies
module.exports.signedCookie = signedCookie
module.exports.signedCookies = signedCookies

/**
 * Parse Cookie header and populate `req.cookies`
 * with an object keyed by the cookie names.
 *
 * @param {string|array} [secret] A string (or array of strings) representing cookie signing secret(s).
 * @param {Object} [options]
 * @return {Function}
 * @public
 */

function cookieParser(secret, options) {
    return function cookieParser(ctx) {
        var cookies = ctx.req.headers.cookie
        var secrets = !secret || Array.isArray(secret)
            ? (secret || [])
            : [secret]
        
        ctx.cookies = {}
        ctx.cookie.secret = secrets[0]
        ctx.cookie.signed = Object.create(null)

        // no cookies
        if (!cookies) {
            return ctx.next()
        }

        ctx.cookies = cookie.parse(cookies, options)

        // parse signed cookies
        if (secrets.length !== 0) {
            ctx.cookie.signed = signedCookies(ctx.req.cookies, secrets)
            ctx.cookie.signed = JSONCookies(ctx.cookie.signed)
        }

        // parse JSON cookies
        ctx.req.cookies = JSONCookies(ctx.req.cookies)

        ctx.next()
    }
}

/**
 * Parse JSON cookie string.
 *
 * @param {String} str
 * @return {Object} Parsed object or undefined if not json cookie
 * @public
 */

function JSONCookie(str) {
    if (typeof str !== 'string' || str.substr(0, 2) !== 'j:') {
        return undefined
    }

    try {
        return JSON.parse(str.slice(2))
    } catch (err) {
        return undefined
    }
}

/**
 * Parse JSON cookies.
 *
 * @param {Object} obj
 * @return {Object}
 * @public
 */

function JSONCookies(obj) {
    var cookies = Object.keys(obj)
    var key
    var val

    for (var i = 0; i < cookies.length; i++) {
        key = cookies[i]
        val = JSONCookie(obj[key])

        if (val) {
            obj[key] = val
        }
    }

    return obj
}

/**
 * Parse a signed cookie string, return the decoded value.
 *
 * @param {String} str signed cookie string
 * @param {string|array} secret
 * @return {String} decoded value
 * @public
 */

function signedCookie(str, secret) {
    if (typeof str !== 'string') {
        return undefined
    }

    if (str.substr(0, 2) !== 's:') {
        return str
    }

    var secrets = !secret || Array.isArray(secret)
        ? (secret || [])
        : [secret]

    for (var i = 0; i < secrets.length; i++) {
        var val = signature.unsign(str.slice(2), secrets[i])

        if (val !== false) {
            return val
        }
    }

    return false
}

/**
 * Parse signed cookies, returning an object containing the decoded key/value
 * pairs, while removing the signed key from obj.
 *
 * @param {Object} obj
 * @param {string|array} secret
 * @return {Object}
 * @public
 */

function signedCookies(obj, secret) {
    var cookies = Object.keys(obj)
    var dec
    var cookieList = {}

    for (var i = 0; i < cookies.length; i++) {
        let cookieKey = cookies[i]
        let cookieVal = obj[cookieKey]
        let decryptedCookie = signedCookie(cookieVal, secret)

        if (val !== dec) {
            cookieList[cookieKey] = decryptedCookie
            delete obj[cookieKey]
        }
    }

    return cookieList
}
