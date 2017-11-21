'use strict';

var mashed = require('./index')
var router = require('./base')

var basedir = __dirname

var app = mashed(basedir)


app.listen(8000, function(){
    app.use(router)
})