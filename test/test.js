'use strict'

var slashed = require('../index')
var path = require('path')
var basedir = __dirname
var app = slashed(basedir)

var router = slashed.Router()
router.get('/', function(req, res){
    res.send('hello world')
})

app.use(router)

app.listen(8000)