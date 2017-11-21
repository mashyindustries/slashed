'use strict'

var path = require('path');
var Bluebird = require('bluebird');
var fs = Bluebird.promisifyAll(require('fs'));

var env = {};
var appvariables = {};
var configdir;
var basedir;

var appconfig = {
    get: get,
    set: set,
    solve: solve,
    isSolvable: isSolvable
};

function configure(app, config){
    var promise = Bluebird.pending();
    var configpath, envfile, envpath, basedir;

    app.config = appconfig;

    if(typeof config == "string"){
        basedir = config;
    }else{
        basedir = config.basedir;
    }

    app.config.set('basedir', basedir);

    if (typeof app.config.get('basedir') == "undefined"){
        throw Error('basedir not set')
    }

    basedir = app.config.get('basedir', true);
    configpath = app.config.get('configdir', true) || "config";
    envfile = app.config.get('envfile', true) || '.env';
    envpath = path.join(basedir, envfile)
    configdir = path.join(basedir, configpath);
    
    getenvvars(envpath)
        .then(function(data){
            env = data;
            promise.resolve(app)
        });
    return promise.promise;
}

function isSolvable(problem){
    if(typeof problem === 'string'){
        if (problem.split(":").length > 1 || problem.split("|").length > 1){
            return true;
        }
    }
    return false;
}

function handleSolution(method, problem){
    switch(method){
        case 'env':
            if(hasProperty(problem, env)){
                return getProperty(problem, env);
            }
        case 'path':
            return path.join(basedir, problem);
        case 'config':
            return searchConfig(problem);
    }
    return;
}

function searchConfig(setting){
    try{
        var lookup = setting.split('.');
        var file = lookup.shift();
        var configpath = path.join(configdir, file + '.js');
        var config = require(configpath);
        var result = lookup.reduce(function(prev, curr) {
            return prev ? prev[curr] : undefined
        }, config || self);
        if (isSolvable(result)){
            return solve(result);
        }else{
            return result;
        }
    }catch(e){
        if (e.code == 'MODULE_NOT_FOUND'){
            return undefined;
        }
        throw e;
    }
}

function solve(problem){
    if(isSolvable(problem)){
        var ors = problem.split('|');
        var solution;
    
        for (var arr in ors){
            if (isSolvable(ors[arr])){
                var arrayproblem = ors[arr].split(":");
                var method = arrayproblem[0];
                var lookup = arrayproblem[1];
                
                solution = handleSolution(method, lookup);
                break;
            }
            solution = problem;
            break;
        }
        return solution;
    }
    return undefined;
}

function get(setting, setupmode){
    if(isSolvable(setting) && hasbeensetup){
        return solve(setting);
    }

    if(hasProperty(setting, appvariables)){
        return getProperty(setting, appvariables);
    }

    if(!setupmode || typeof setupmode == undefined) {
        if(hasProperty(setting, env)){
            return getProperty(setting, env);
        }
        return searchConfig(setting);
    }
}

function set(setting, value){
    appvariables[setting] = value;
    return value;
}

function hasProperty(needle, haystack){
    if (haystack.hasOwnProperty(needle)) {
        return true;
    }
    return false;
}

function getProperty(needle, haystack){
    return haystack[needle];
}

function getenvvars(path){


    return fs.readFileAsync(path, 'utf8')
        .then(data => data.split(require('os').EOL))
        .map(line => line.split('='))
        .filter(keyval => keyval[1] > '')
        .reduce((obj, keyval) => { obj[keyval[0]] = keyval[1]; return obj;}, {})
        .catch(function(err){
            slashed.log('No .env file provided')
            return {};
        });
}

module.exports = function(app, options){
    return configure(app, options);
}