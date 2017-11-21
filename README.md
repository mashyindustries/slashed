# Slashed

Fast, opinionated, minimalist web framework for nodeJS

## Usage:

```
'use strict'

var slashed = require('./index')
var router = slashed.Router()

var basedir = __dirname

var app = slashed(basedir)

router.get('/', function(req, res){
    res.send('Hello World')
})

app.use(router)

app.listen(8000)
```
