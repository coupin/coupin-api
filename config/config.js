const cloudinary = require('cloudinary');
const dotenv = require('dotenv');
dotenv.config();
const mailgun = require('mailgun-js')({
  apiKey: process.env.MG_API_KEY,
  domain: process.env.MG_TEST_DOMAIN
});

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CL_CLOUD_NAME,
  api_key: process.env.CL_API_KEY,
  api_secret: process.env.CL_API_SECRET
});

module.exports = {
  cloudinary,
  mailgun
};