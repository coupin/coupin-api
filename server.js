const bodyParser = require('body-parser');
// server module
const express = require('express');
//var session = require('express-session');
const app = express();
const methodOverride = require('method-override');

// Express validatory
const expressValidator = require('express-validator');
// Database module
const mongoose = require('mongoose');
// authentication module
const passport = require('passport');
// session module
const session = require('express-session');
const cookieParser = require('cookie-parser');
// For logging all request
const morgan = require('morgan');
// For token validation
const jwt = require('jsonwebtoken');
const passportJWT = require("passport-jwt");
const fs = require('fs-extra');
const busboy = require('connect-busboy');
const cloudinary = require('cloudinary');


var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

var port = process.env.PORT || 5030;
var LocalStrategy = require('passport-local').Strategy;

// Configuration
var db = require('./config/db');
var config = require('./config/env');

// set our port
var port = process.env.PORT || 5030;

// connect to db
mongoose.connect(db.url);

/**
 * get all data of the body parameters
 * parse application/json
 */
app.use(busboy());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan('dev'));
// Allow data in url encoded format
app.use(bodyParser.urlencoded({ extended: true }));

// Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// app.use(expressValidator());
// parse application/vnd.api+json as json

/**
 * override with the X-HTTP-Override header in the request.
 * Simulate DEvarE and PUT
 */
app.use(methodOverride('X-HTTP-Method-Override'));

// Add express validator
app.use(expressValidator());

// required for passport to handle sessions
app.use(session({secret: config.secret}));

// Initialize passport and it's sessions
app.use(passport.initialize());
app.use(passport.session());


// set the static files location /public/img will be /img
app.use(express.static(__dirname + '/public'));

// Cloudinary config
cloudinary.config({
  cloud_name: 'mybookingngtest',
  api_key: '254821729494622',
  api_secret: 'F4SmP0wD7kQonfuybQjixWFYzP0'
});


// app.use('/admin', function (req, res) {
//   res.sendfile('public/views/index.html');
// });

app.post('/upload', function (req, res) {
  cloudinary.uploader.upload(req.body.file, function (result) {
    res.status(200).send(result);
  });
});

// configure our routes
require('./app/routes')(app);
// app.use('/login', );

//start app

//start on localhost 3030
app.listen(port);

// confirmation
console.log('Too Cool for port ' + port);

// expose app
exports = module.exports = app;