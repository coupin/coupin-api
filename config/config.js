'use strict';

var cloudinary = require('cloudinary');
var dotenv = require('dotenv');
var Raven = require('raven');
var mailgun = require('mailgun-js');

dotenv.config();


Raven.config('https://d9b81d80ee834f1b9e2169e2152f3f95:73ba5ba410494467aaa97b5932f4fad2@sentry.io/301229').install();

module.exports = {
  cloudinary: cloudinary.config({
    cloud_name: process.env.CL_CLOUD_NAME,
    api_key: process.env.CL_API_KEY,
    api_secret: process.env.CL_API_SECRET
  }),
  mailgun: mailgun({
    apiKey: process.env.MG_API_KEY,
    domain: process.env.MG_TEST_DOMAIN
  }),
  Raven: Raven,
  secret: process.env.SECRET
};