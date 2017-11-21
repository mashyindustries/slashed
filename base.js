var router = require('./index').Router()

router.get('/test', function(req, res){
    res.send('html content')
})

module.exports = router