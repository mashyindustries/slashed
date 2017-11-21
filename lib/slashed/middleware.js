'use strict';

module.exports = function(app) {
    var groups;
    var middlewares;
    
    function getmiddleware(name){
        try {
            var middleware = middlewares[name];
            var middlewaremodule = middleware.module;
    
            if(app.config.isSolvable(middlewaremodule)){
                return require(app.config.solve(middlewaremodule));
            }
            
            return require(middlewaremodule);
        } catch (e) {
            e.code = 'MIDDLEWARE_NOT_FOUND';
            throw e;
        }
        
    };

    function getmiddlewaregroup(group){
        var array = [function(res,req,next){next()}];

        for(var middleware in group){
            array.push(app.getmiddleware(group[middleware]));
        }

        return array;
    }
    
    function setup(app){
        var config = app.config.get('middleware') || {};
        groups = config.groups;
        middlewares = config.middlewares;

        app.getmiddleware = getmiddleware;
        app.getmiddlewaregroup = getmiddlewaregroup;
    
        if(groups && groups.global){
            app.use(app.getmiddlewaregroup(groups.global));
        }
        return app;
    }

    return setup(app);
};