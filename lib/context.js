'use strict'

var Request = require('./request')
var Response = require('./response')

module.exports = function Context(req, res, app){
    var ctx = {}

    Object.setPrototypeOf(req, Object.create(Request))
    Object.setPrototypeOf(res, Object.create(Response))

    ctx.req = req
    ctx.res = res
    ctx.app = app
    ctx.state = {}
    ctx.cookies = {}
    ctx.socket = req.socket

    return ctx
}