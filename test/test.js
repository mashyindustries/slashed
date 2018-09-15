'use strict'

//*
var slashed = require('../index')
var path = require('path')
var basedir = __dirname
var app = slashed(basedir)

var router = slashed.Router()

router.get('/', function(ctx){
    console.log('got /')
    ctx.res.send('test')
})


router.get('/lol', function(ctx){
    console.log('got lol')
    ctx.res.send('test')
})

/*
router.post('/', function(req, res){
    res.send('ok')
})

router.ws('/test', function(ws, req){
    ws.on('message', function(msg) {
        console.log('test ws message', msg)
    })
})
*/
app.use(router)

app.listen(8000)

//*/