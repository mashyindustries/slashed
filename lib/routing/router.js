'use strict';

/**
 * Module dependencies.
 * @private
 */

var Route = require('./route');
var Layer = require('./layer');
var methods = require('methods');
var mixin = require('utils-merge');
var url = require('url');
var setPrototypeOf = require('setprototypeof')

/**
 * Module variables.
 * @private
 */

var objectRegExp = /^\[object (\S+)\]$/;
var slice = Array.prototype.slice;
var toString = Object.prototype.toString;

/**
 * Initialize a new `Router` with the given `options`.
 *
 * @param {Object} options
 * @return {Router} which is an callable function
 * @public
 */

var proto = module.exports = function () {

    function router(ctx) {
        router.handle(ctx)
    }

    // mixin Router class functions
    setPrototypeOf(router, proto)

    router.params = {}
    router._params = []
    router.stack = []

    return router
}

/**
 * Map the given param placeholder `name`(s) to the given callback.
 *
 * Parameter mapping is used to provide pre-conditions to routes
 * which use normalized placeholders. For example a _:user_id_ parameter
 * could automatically load a user's information from the database without
 * any additional code,
 *
 * The callback uses the same signature as middleware, the only difference
 * being that the value of the placeholder is passed, in this case the _id_
 * of the user. Once the `next()` function is invoked, just like middleware
 * it will continue on to execute the route, or subsequent parameter functions.
 *
 * Just like in middleware, you must either respond to the request or call next
 * to avoid stalling the request.
 *
 *  app.param('user_id', function(req, res, next, id){
 *    User.find(id, function(err, user){
 *      if (err) {
 *        return next(err);
 *      } else if (!user) {
 *        return next(new Error('failed to load user'));
 *      }
 *      ctx.user = user;
 *      next();
 *    });
 *  });
 *
 * @param {String} name
 * @param {Function} fn
 * @return {app} for chaining
 * @public
 */

proto.param = function param(name, fn) {
    // param logic
    if (typeof name === 'function') {
        this._params.push(name);
        return;
    }

    // apply param functions
    var params = this._params;
    var len = params.length;
    var ret;

    if (name[0] === ':') {
        name = name.substr(1);
    }

    for (var i = 0; i < len; ++i) {
        if (ret = params[i](name, fn)) {
            fn = ret;
        }
    }

    // ensure we end up with a
    // middleware function
    if ('function' !== typeof fn) {
        throw new Error('invalid param() call for ' + name + ', got ' + fn);
    }

    (this.params[name] = this.params[name] || []).push(fn);
    return this;
};

/**
 * Dispatch a ctx into the router.
 * @private
 */
proto.handle = function handle(ctx){
    var path = ctx.req.path()
    var options = []
    var index = 0
    var layerError
    var oldnext = ctx.next
    var stack = this.stack
    var parentUrl = ctx.req.baseUrl || ''

    //PATH STUFF

    ctx.next = next

    next()

    async function next(err){
        var layer
        var match = false
        layerError = layerError ? layerError : err

        while(match !== true){
            layer = stack[index++]

            if(!layer){
                break
            }
            try {
                match = layer.match(path)
            } catch (err) {
                layerError = err
            }         

            if(!match){
                continue
            }
            
            if(layerError){
                match = false
                continue
            }

            //DO: ROUTES

            //DO: options
        }

        //no match
        if(match !== true){
            if(layerError){
                return done(layerError)
            }
            return done()
        }

        console.log(match)
        console.log(path)
        console.log(layer)
        console.log()
        

        //DO: params

        // trim prefix
        //DO: prefix stuff

        //DO: ROUTES

        try {
            if(layerError){
                return await layer.handle(ctx, layerError)
            }else{
                return await layer.handle(ctx)
            }
        } catch (err) {
            return next(err)
        }
        
    }

    async function done(){
        ctx.next = oldnext

        ctx.next()
    }
}


/**
 * Process any parameters for the layer.
 * @private
 */

proto.process_params = function process_params(layer, called, ctx, done) {
    var params = this.params;

    // captured parameters from the layer, keys and values
    var keys = layer.keys;

    // fast track
    if (!keys || keys.length === 0) {
        return done();
    }

    var i = 0;
    var name;
    var paramIndex = 0;
    var key;
    var paramVal;
    var paramCallbacks;
    var paramCalled;

    // process params in order
    // param callbacks can be async
    function param(err) {
        if (err) {
            return done(err);
        }

        if (i >= keys.length) {
            return done();
        }

        paramIndex = 0;
        key = keys[i++];
        name = key.name;
        paramVal = ctx.req.params[name];
        paramCallbacks = params[name];
        paramCalled = called[name];

        if (paramVal === undefined || !paramCallbacks) {
            return param();
        }

        // param previously called with same value or error occurred
        if (paramCalled && (paramCalled.match === paramVal
            || (paramCalled.error && paramCalled.error !== 'route'))) {
            // restore value
            ctx.req.params[name] = paramCalled.value;

            // next param
            return param(paramCalled.error);
        }

        called[name] = paramCalled = {
            error: null,
            match: paramVal,
            value: paramVal
        };

        paramCallback();
    }

    // single param callbacks
    function paramCallback(err) {
        var fn = paramCallbacks[paramIndex++];

        // store updated value
        paramCalled.value = ctx.req.params[key.name];

        if (err) {
            // store error
            paramCalled.error = err;
            param(err);
            return;
        }

        if (!fn) return param();

        try {
            fn(ctx, paramCallback, paramVal, key.name);
        } catch (e) {
            paramCallback(e);
        }
    }

    param();
};

/**
 * Use the given middleware function, with optional path, defaulting to "/".
 *
 * Use (like `.all`) will run for any http METHOD, but it will not add
 * handlers for those methods so OPTIONS requests will not consider `.use`
 * functions even if they could respond.
 * 
 * @public
 */

proto.use = function use(path, ...fn) {
    var defaultPath = '/'
    var callbacks = fn

    if(typeof path === 'function'){
        var path = defaultPath
        callbacks = arguments
    }

    if (callbacks.length === 0) {
        throw new TypeError('Router.use() requires middleware functions')
    }

    for (var i = 0; i < callbacks.length; i++) {
        var fn = callbacks[i]

        if (typeof fn !== 'function') {
            throw new TypeError('Router.use() requires middleware function but got a ' + getType(fn))
        }

        var layer = new Layer(path, fn)
        this.stack.push(layer)
    }

    return this
};

/**
 * Create a new Route for the given path.
 *
 * Each route contains a separate middleware stack and VERB handlers.
 *
 * See the Route api documentation for details on adding handlers
 * and middleware to routes.
 *
 * @param {String} path
 * @return {Route}
 * @public
 */

proto.route = function route(path) {
    var route = new Route(path);

    var layer = new Layer(path, route.dispatch.bind(route));

    layer.route = route;

    this.stack.push(layer);
    return route;
};

// create Router#VERB functions
methods.concat('all').forEach(function (method) {
    proto[method] = function (path) {
        var route = this.route(path)
        route[method].apply(route, slice.call(arguments, 1));
        return this;
    };
});

// append methods to a list of methods
function appendMethods(list, addition) {
    for (var i = 0; i < addition.length; i++) {
        var method = addition[i];
        if (list.indexOf(method) === -1) {
            list.push(method);
        }
    }
}

// Get get protocol + host for a URL
function getProtohost(url) {
    if (typeof url !== 'string' || url.length === 0 || url[0] === '/') {
        return undefined
    }

    var searchIndex = url.indexOf('?')
    var pathLength = searchIndex !== -1
        ? searchIndex
        : url.length
    var fqdnIndex = url.substr(0, pathLength).indexOf('://')

    return fqdnIndex !== -1
        ? url.substr(0, url.indexOf('/', 3 + fqdnIndex))
        : undefined
}

// get type of an object in a typeof form
function getType(obj) {
    var type = typeof obj;

    if (type !== 'object') {
        return type;
    }

    return toString.call(obj)
        .replace(objectRegExp, '$1');
}

/**
 * Match path to a layer.
 *
 * @param {Layer} layer
 * @param {string} path
 * @private
 */

function matchLayer(layer, path) {
    try {
        return layer.match(path);
    } catch (err) {
        return err;
    }
}

// merge params with parent params
function mergeParams(params, parent) {
    if (typeof parent !== 'object' || !parent) {
        return params;
    }

    // make copy of parent for base
    var obj = mixin({}, parent);

    // simple non-numeric merging
    if (!(0 in params) || !(0 in parent)) {
        return mixin(obj, params);
    }

    var i = 0;
    var o = 0;

    // determine numeric gaps
    while (i in params) {
        i++;
    }

    while (o in parent) {
        o++;
    }

    // offset numeric indices in params before merge
    for (i--; i >= 0; i--) {
        params[i + o] = params[i];

        // create holes for the merge when necessary
        if (i < o) {
            delete params[i];
        }
    }

    return mixin(obj, params);
}


// send an OPTIONS response
function sendOptionsResponse(ctx, options, next) {
    try {
        var body = options.join(',')
        ctx.res.set('Allow', body)
        ctx.res.send(body)
    } catch (err) {
        next(err)
    }
}

proto.Router = function Router() {
    return new proto()
}