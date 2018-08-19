const cloudinary = require('cloudinary');
const dotenv = require('dotenv');
const Raven = require('raven');
const mailgun = require('mailgun-js');

dotenv.config();
mailgun({
  apiKey: process.env.MG_API_KEY,
  domain: process.env.MG_TEST_DOMAIN
});

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CL_CLOUD_NAME,
  api_key: process.env.CL_API_KEY,
  api_secret: process.env.CL_API_SECRET
});

Raven.config('https://d9b81d80ee834f1b9e2169e2152f3f95:73ba5ba410494467aaa97b5932f4fad2@sentry.io/301229').install();

module.exports = {
  cloudinary,
  mailgun,
  Raven
};