'use strict'

/*var app = new app()


function app(){
    var stack = []

    this.use = function use(fn){
        stack.push(fn)
    }

    this.handle = async function handle(ctx){
        try {
            for(var i = 0; i < stack.length; i++){
                var fn = stack[i]
                await fn(ctx)
            }
        } catch (err) {
            console.error(err)
        }
        
        console.log(ctx)
    }

    return this
}

app.use(function(ctx){
    ctx.test = 'test'
})
app.use(function(ctx){
    ctx.test = 'tes2'
})
app.use(function(ctx){
    ctx.test3 = 'test3'
})


app.handle({})

*/

var slashed = require('../index')
var path = require('path')
var basedir = __dirname
var app = slashed(basedir)

var router = slashed.Router()

router.get('/', function(ctx){
    ctx.res.render('pages.home')
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

//*/