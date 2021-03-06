var StexEngine = require('stexengine');
var path = require('path');

module.exports = function(app){
    var config = app.get('stex') || {
        basedir: app.get('basedir')
    }

    var engine = new StexEngine(config)

    var middleware = function middleware(req, res, next){
        res.render = function render(view, sections){
            res.setHeader('content-type', 'html')
            if(!sections) sections = {}
            res.send(engine.render(view, Object.assign({req}, sections)))
        }
        next()
    }

    app.use(middleware)
    
    return {
        render: engine.render
    }
}