var bodyParser = require('body-parser');
var express = require('express');
var expressValidator = require('express-validator');
var session = require('express-session');
var app = express();
var methodOverride = require('method-override');
var mongoose   = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var jwt = require('jsonwebtoken');
var passportJWT = require("passport-jwt");

var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

// Configuration
var db = require('./config/db').module;
var merchant = require('./app/routes/merchant');
var customer = require('./app/routes/customer');
// set our port
var port = process.env.PORT || 5030;

// connect to db
mongoose.connect(db.url);

app.set('superSecret', db.secret);

/**
 * get all data of the body parameters
 * parse application/json
 */
app.use(bodyParser.json());
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
// parse application/vnd.api+json as json
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
}));


// Handle Sessions
// app.use(session({
//   secret:'secret',
//   saveUninitialized: true,
//   resave: true
// }));

// Passport
app.use(passport.initialize());
app.use(passport.session());


/**
 * override with the X-HTTP-Override header in the request.
 * Simulate DEvarE and PUT
 */
app.use(methodOverride('X-HTTP-Method-Override'));

// set the static files location /public/img will be /img
app.use(express.static(__dirname + '/public'));

// routes
var mongoose = require('mongoose');

// configure our routes


app.use('/api/merchant', merchant);
app.use('/api/customer', customer);

//start app

//start on localhost 3030
app.listen(port);

// confirmation
console.log('Too Cool for port ' + port);

// expose app
exports = module.exports = app;
