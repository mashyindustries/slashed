'use strict'

var slashed = require('../index')
var path = require('path')
var basedir = __dirname
var app = slashed(basedir)

var router = slashed.Router()
router.get('/', function(req, res){
    res.render('pages.home')
})

router.post('/', function(req, res){
    res.send('ok')
})

router.ws('/test', function(ws, req){
    ws.on('message', function(msg) {
        console.log('test ws message', msg)
    })
})

app.use(router)

app.listen(8000)