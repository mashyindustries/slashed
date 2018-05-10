const http = require('http');
const ws = require('ws');
const Router = require('./router');

function trailingSlash(string) {
    let suffixed = string;
    if (suffixed.charAt(suffixed.length - 1) !== '/') {
        suffixed = `${suffixed}/`;
    }
    return suffixed;
}

function websocketUrl(url) {
    if (url.indexOf('?') !== -1) {
        const [baseUrl, query] = url.split('?');

        return `${trailingSlash(baseUrl)}.websocket?${query}`;
    }
    return `${trailingSlash(url)}.websocket`;
}

function addWsMethod(target) {
    /* This prevents conflict with other things setting `.ws`. */
    if (target.ws === null || target.ws === undefined) {
        target.ws = function addWsRoute(route, ...middlewares) {
            const wrappedMiddlewares = middlewares.map((middleware) => {
                return (req, res, next) => {
                    if (req.ws !== null && req.ws !== undefined) {
                        req.wsHandled = true;
                        try {
                            /* Unpack the `.ws` property and call the actual handler. */
                            middleware(req.ws, req, next);
                        } catch (err) {
                            /* If an error is thrown, let's send that on to any error handling */
                            next(err);
                        }
                    } else {
                        /* This wasn't a WebSocket request, so skip this middleware. */
                        next();
                    }
                }
            });

            /* We append `/.websocket` to the route path here. Why? To prevent conflicts when
             * a non-WebSocket request is made to the same GET route - after all, we are only
             * interested in handling WebSocket requests.
             *
             * Whereas the original `express-ws` prefixed this path segment, we suffix it -
             * this makes it possible to let requests propagate through Routers like normal,
             * which allows us to specify WebSocket routes on Routers as well \o/! */

            const wsRoute = websocketUrl(route);

            /* Here we configure our new GET route. It will never get called by a client
             * directly, it's just to let our request propagate internally, so that we can
             * leave the regular middleware execution and error handling to Express. */
            this.get(...[wsRoute].concat(wrappedMiddlewares));

            /*
             * Return `this` to allow for chaining:
             */
            return this;
        };
    }
}

// the 'httpserver' and 'options' parameters are always empty by this moment, but they could appear later
module.exports = function expressWs(app, httpServer, options = {}) {
    let server = httpServer;

    if (server === null || server === undefined) {
        /* No HTTP server was explicitly provided, create one for our Express application. */
        server = http.createServer(app);

        app.listen = function serverListen(...args ) {
            return server.listen(...args);
        };
    }

    /* Make our custom `.ws` method available directly on the Express application. You should
     * really be using Routers, though. */
    addWsMethod(app);

    /* Monkeypatch our custom `.ws` method into Express' Router prototype. This makes it possible,
     * when using the standard Express Router, to use the `.ws` method without any further calls
     * to `makeRouter`. When using a custom router, the use of `makeRouter` may still be necessary.
     *
     * This approach works, because Express does a strange mixin hack - the Router factory
     * function is simultaneously the prototype that gets assigned to the resulting Router
     * object. */
    if (!options.leaveRouterUntouched) {
        addWsMethod(Router);
    }

    // allow caller to pass in options to WebSocketServer constructor
    const wsOptions = options.wsOptions || {};
    wsOptions.server = server;
    const wsServer = new ws.Server(wsOptions);

    wsServer.on('connection', (socket, request) => {

        if ('upgradeReq' in socket) {
            request = socket.upgradeReq;
        }
        request.ws = socket;
        request.wsHandled = false;
        request.url = websocketUrl(request.url);

        const dummyResponse = new http.ServerResponse(request);

        dummyResponse.writeHead = function writeHead(statusCode) {
            if (statusCode > 200) {
                socket.close();
            }
        };

        app.handle(request, dummyResponse, () => {
            if (!request.wsHandled) {
                /* There was no matching WebSocket-specific route for this request. We'll close
                 * the connection, as no endpoint was able to handle the request anyway... */
                socket.close();
            }
        });
    });

    return { //the second two options are not been used yet, but can be useful later
        getWss: function getWss() {
            return wsServer;
        },
        applyTo: function applyTo(router) {
            addWsMethod(router);
        }
    };
}
