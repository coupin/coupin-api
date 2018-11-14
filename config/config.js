'use strict';

var cloudinary = require('cloudinary');
var dotenv = require('dotenv');
var Raven = require('@sentry/node');
var mailgun = require('mailgun-js');

dotenv.config();


Raven.init({
  dsn: process.env.SENTRY
});

module.exports = {
  cloudinary: cloudinary.config({
    cloud_name: process.env.CL_CLOUD_NAME,
    api_key: process.env.CL_API_KEY,
    api_secret: process.env.CL_API_SECRET
  }),
  mailgun: mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN
  }),
  Raven: Raven,
  secret: process.env.SECRET
};