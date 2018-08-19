const bodyParser = require('body-parser');
const dotenv = require('dotenv');
// server module
const express = require('express');
//var session = require('express-session');
const methodOverride = require('method-override');

// Express validatory
const expressValidator = require('express-validator');
// Database module
const mongoose = require('mongoose');
// authentication module
const passport = require('passport');
const cookieParser = require('cookie-parser');
// For logging all request
const morgan = require('morgan');
// For token validation
const fs = require('fs-extra');
const busboy = require('connect-busboy');
const cors = require('cors');
// Raven for logging
const Raven = require('raven');

Raven.config('https://d9b81d80ee834f1b9e2169e2152f3f95:73ba5ba410494467aaa97b5932f4fad2@sentry.io/301229').install();

const myRoutes = require('./app/routes');

const app = express();

dotenv.config();

// set our port
var port = process.env.PORT || 5030;

// connect to db
mongoose.connect(process.env.MONGO_URL);
// mongoose.connect(process.env.LOCAL_URL);

/**
 * get all data of the body parameters
 * parse application/json
 */
app.use(Raven.requestHandler());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

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

/**
 * override with the X-HTTP-Override header in the request.
 * Simulate DEvarE and PUT
 */
app.use(methodOverride('X-HTTP-Method-Override'));

// Add express validator
app.use(expressValidator());

// Initialize passport and it's sessions
app.use(passport.initialize());
app.use(passport.session());

// configure our routes
app.use('/api/v1', myRoutes);

app.use(Raven.errorHandler());
app.use(function onError(err, req, res, next) {
  res.status(500).send(res.sentry + '\n');
});

//start on localhost 3030
app.listen(port).on('error', function (err) {
  console.log(err);
});

// confirmation
console.log('Coupin API started on ' + port);

// expose app
module.exports = app;