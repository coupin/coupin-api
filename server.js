/**
 * modules
 */
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var methodOverride = require('method-override');
var mongoose = require('mongoose');

// Configuration
var db = require('./config/db').module;

// set our port
var port = process.env.PORT || 3030;

// connect to db
mongoose.connect(db.url);

/**
 * get all data of the body parameters
 * parse application/json
 */
app.use(bodyParser.json());

// parse application/vnd.api+json as json
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
}));

/**
 * override with the X-HTTP-Override header in the request.
 * Simulate DEvarE and PUT
 */
app.use(methodOverride('X-HTTP-Method-Override'));

// set the static files location /public/img will be /img
app.use(express.static(__dirname + '/public'));

// routes


// configure our routes
require('./app/routes')(app);

//start app

//start on localhost 3030
app.listen(port);

// confirmation
console.log('Too Cool for port ' + port);

// expose app
exports = module.exports = app;