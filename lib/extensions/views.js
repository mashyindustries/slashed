var StexEngine = require('stexengine');
var path = require('path');

module.exports = function(app){
    var config = app.get('stex') || {
        basedir: app.get('basedir')
    }

    var engine = new StexEngine(config)

    var middleware = function middleware(ctx){
        ctx.res.render = function render(view, sections){
            ctx.res.setHeader('content-type', 'html')
            if(!sections) sections = {}
            ctx.res.send(engine.render(view, Object.assign({req}, sections)))
        }
        ctx.next()
    }

    app.use(middleware)
    
    return {
        render: engine.render
    }
}