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
            res.send(engine.render(view, sections))
        };
        next()
    }

    app.use(middleware)
    
    return {
        render: engine.render
    }
}