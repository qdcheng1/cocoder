var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/', function (req, res) {
    // send index file from public folder
    res.sendFile("index.html", { root: path.join(__dirname, '../../public/')});
});

module.exports = router;
