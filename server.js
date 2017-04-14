var bodyParser = require('body-parser');
// server module
var express = require('express');
//var session = require('express-session');
var app = express();
var methodOverride = require('method-override');

// Express validatory
var expressValidator = require('express-validator');
// Database module
var mongoose = require('mongoose');
// authentication module
var passport = require('passport');
// session module
var session = require('express-session');
var cookieParser = require('cookie-parser');
// For logging all request
var morgan = require('morgan');
// For token validation
var jwt = require('jsonwebtoken');
var passportJWT = require("passport-jwt");


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

// Passport Configuration
require('./config/passport')(passport);

/**
 * get all data of the body parameters
 * parse application/json
 */
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
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());


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