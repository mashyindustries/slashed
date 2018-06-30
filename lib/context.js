'use strict'

var Request = require('./request')
var Response = require('./response')

function Context(req, res, app){
    Object.setPrototypeOf(req, Object.create(Request))
    Object.setPrototypeOf(res, Object.create(Response))

    this.req = req
    this.res = res
    this.app = app
    this.state = {}
    this.socket = req.socket
    this.params = {}
    this.isContext = true

    return this
}

module.exports = Context