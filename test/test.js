'use strict'

var slashed = require('../lib/application')
var app = new slashed(__dirname)

/* var router = slashed.Router()

router.get('/', function(ctx){
    console.log('got /')
    ctx.res.send('test')
})


router.get('/lol', function(ctx){
    console.log('got lol')
    ctx.res.send('test')
})

app.use(router)
*/

var router = app.router()
var router2 = app.router()


router.get('', async ctx => {
    ctx.body = 'test'
})

router2.get('', async ctx =>{
    ctx.body = 'test2'
})

router.use('/test', router2.routes())

app.use(router.routes())

async function start(){
    app.listen(app.get('port'))
}

start()
