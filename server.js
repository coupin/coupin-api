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
// session module
const session = require('express-session');
const cookieParser = require('cookie-parser');
// For logging all request
const morgan = require('morgan');
// For token validation
const fs = require('fs-extra');
const busboy = require('connect-busboy');
const cloudinary = require('cloudinary');
const cors = require('cors');

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

// required for passport to handle sessions
app.use(session({secret: process.env.SECRET}));

// Initialize passport and it's sessions
app.use(passport.initialize());
app.use(passport.session());


// Cloudinary config
cloudinary.config({
  cloud_name: 'saintlawal',
  api_key: '254821729494622',
  api_secret: 'F4SmP0wD7kQonfuybQjixWFYzP0'
});


// app.use('/admin', function (req, res) {
//   res.sendfile('public/views/index.html');
// });

// app.post('/upload', function (req, res) {
//   console.log(req.body);
//   cloudinary.uploader.upload(req.body.file, function (result) {
//     res.status(200).send(result);
//   });
// });

// configure our routes
app.use('/api/v1', myRoutes);

//start on localhost 3030
app.listen(port).on('error', function (err) {
  console.log(err);
});

// confirmation
console.log('Too Cool for port ' + port);

// expose app
module.exports = app;