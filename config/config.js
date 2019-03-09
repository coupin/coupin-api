'use strict';

var cloudinary = require('cloudinary');
var dotenv = require('dotenv');
var gcm = require('node-gcm');
var mailgun = require('mailgun-js');
var Raven = require('@sentry/node');

dotenv.config();


var sender = new gcm.Sender(process.env.GCM_SERVER_KEY);

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
  secret: process.env.SECRET,
  GCMSender: sender
};