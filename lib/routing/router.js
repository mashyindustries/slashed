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

var proto = module.exports = function (options) {
    var opts = options || {};

    function router(req, res, next) {
        router.handle(req, res, next);
    }

    // mixin Router class functions
    setPrototypeOf(router, proto)

    router.params = {};
    router._params = [];
    router.mergeParams = opts.mergeParams;
    router.stack = [];

    return router;
};

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
 * Dispatch a req, res into the router.
 * @private
 */

proto.handle = async function handle(ctx, final) {
    var stack = this.stack

    console.log(stack)

    try {
        var layerError
        var index = 0
        var layer
        var path = url.parse(ctx.req.url).pathname
        var match = matchLayer(layer, path)

        while (match !== true && idx < stack.length) {
            layer = stack[i++]
            match = matchLayer(layer, path)
            var route = layer.route;

            if (typeof match !== 'boolean') {
                layerError = layerError || match
            }

            if (match !== true) {
                continue
            }

            if (!route) {
                continue
            }

            if (layerError) {
                match = false
                continue
            }

            var method = ctx.req.method;
            var has_method = route._handles_method(method)

            // build up automatic options response
            if (!has_method && method === 'OPTIONS') {
                appendMethods(options, route._options())
            }

            // don't even bother matching route
            if (!has_method && method !== 'HEAD') {
                match = false
                continue
            }
        }

            // store route for dispatch on change
        if (route) {
            ctx.req.route = route;
        }

        // Capture one-time layer values
        ctx.req.params = this.mergeParams
            ? mergeParams(layer.params, parentParams)
            : layer.params
        var layerPath = layer.path

        //layer.handle(ctx)
    } catch (err) {
        final(err)
    }

    return

    var self = this;

    var idx = 0;
    var protohost = getProtohost(ctx.req.url) || ''
    var removed = '';
    var slashAdded = false;
    var paramcalled = {};

    // store options for OPTIONS request
    // only used if OPTIONS request
    var options = [];

    // middleware and routes
    var stack = self.stack;

    // manage inter-router variables
    var parentParams = ctx.req.params;
    var parentUrl = ctx.req.baseUrl || '';
    var done = restore(out, ctx.req, 'baseUrl', 'next', 'params');

    // setup next layer

    ctx.next = next;

    // for options requests, respond with a default if nothing else responds
    if (ctx.req.method === 'OPTIONS') {
        done = wrap(done, function (old, err) {
            if (err || options.length === 0) return old(err);
            sendOptionsResponse(ctx, options, old);
        });
    }

    // setup basic req values
    ctx.req.baseUrl = parentUrl;
    ctx.req.originalUrl = ctx.req.originalUrl || ctx.req.url;

    next();

    function next(err) {
        var layerError = err === 'route'
            ? null
            : err;

        // remove added slash
        if (slashAdded) {
            ctx.req.url = ctx.req.url.substr(1);
            slashAdded = false;
        }

        // restore altered ctx.req.url
        if (removed.length !== 0) {
            ctx.req.baseUrl = parentUrl;
            ctx.req.url = protohost + removed + ctx.req.url.substr(protohost.length);
            removed = '';
        }

        // signal to exit router
        if (layerError === 'router') {
            setImmediate(done, null)
            return
        }

        // no more matching layers
        if (idx >= stack.length) {
            setImmediate(done, layerError);
            return;
        }

        // get pathname of request
        var path = getPathname(ctx.req);

        if (path == null) {
            return done(layerError);
        }

        // find next matching layer
        var layer;
        var match;
        var route;

        while (match !== true && idx < stack.length) {
            layer = stack[idx++];
            match = matchLayer(layer, path);
            route = layer.route;

            if (typeof match !== 'boolean') {
                // hold on to layerError
                layerError = layerError || match;
            }

            if (match !== true) {
                continue;
            }

            if (!route) {
                // process non-route handlers normally
                continue;
            }

            if (layerError) {
                // routes do not match with a pending error
                match = false;
                continue;
            }

            var method = ctx.req.method;
            var has_method = route._handles_method(method);

            // build up automatic options response
            if (!has_method && method === 'OPTIONS') {
                appendMethods(options, route._options());
            }

            // don't even bother matching route
            if (!has_method && method !== 'HEAD') {
                match = false;
                continue;
            }
        }

        // no match
        if (match !== true) {
            return done(layerError);
        }

        // store route for dispatch on change
        if (route) {
            ctx.req.route = route;
        }

        // Capture one-time layer values
        ctx.req.params = self.mergeParams
            ? mergeParams(layer.params, parentParams)
            : layer.params;
        var layerPath = layer.path;

        // this should be done for the layer
        self.process_params(layer, paramcalled, ctx, function (err) {
            if (err) {
                return next(layerError || err);
            }

            if (route) {
                return layer.handle_request(ctx, next);
            }

            trim_prefix(layer, layerError, layerPath, path);
        });
    }

    function trim_prefix(layer, layerError, layerPath, path) {
        if (layerPath.length !== 0) {
            // Validate path breaks on a path separator
            var c = path[layerPath.length]
            if (c && c !== '/' && c !== '.') return next(layerError)

            removed = layerPath;
            ctx.req.url = protohost + ctx.req.url.substr(protohost.length + removed.length);

            // Ensure leading slash
            if (!protohost && ctx.req.url[0] !== '/') {
                ctx.req.url = '/' + ctx.req.url;
                slashAdded = true;
            }

            // Setup base URL (no trailing slash)
            ctx.req.baseUrl = parentUrl + (removed[removed.length - 1] === '/'
                ? removed.substring(0, removed.length - 1)
                : removed);
        }

        if (layerError) {
            layer.handle_error(layerError, ctx, next);
        } else {
            layer.handle_request(ctx, next);
        }
    }
};

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

    var layer = new Layer(path, {
        sensitive: this.caseSensitive,
        strict: this.strict,
        end: true
    }, route.dispatch.bind(route));

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

// restore obj props after function
function restore(fn, ctx) {
    var props = new Array(arguments.length - 2);
    var vals = new Array(arguments.length - 2);

    for (var i = 0; i < props.length; i++) {
        props[i] = arguments[i + 2]
        vals[i] = ctx[props[i]]
    }

    return function () {
        // restore vals
        for (var i = 0; i < props.length; i++) {
            ctx[props[i]] = vals[i];
        }
        console.log(this)
        return fn.apply(this, arguments);
    };
}

// send an OPTIONS response
function sendOptionsResponse(ctx, options, next) {
    try {
        var body = options.join(',');
        ctx.res.set('Allow', body);
        ctx.res.send(body);
    } catch (err) {
        next(err);
    }
}

// wrap a function
function wrap(old, fn) {
    return function proxy() {
        var args = new Array(arguments.length + 1);

        args[0] = old;
        for (var i = 0, len = arguments.length; i < len; i++) {
            args[i + 1] = arguments[i];
        }

        fn.apply(this, args);
    };
}

proto.Router = function Router() {
    return new proto()
}