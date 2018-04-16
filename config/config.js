const cloudinary = require('cloudinary');

// Cloudinary config
cloudinary.config({
  cloud_name: 'saintlawal',
  api_key: '254821729494622',
  api_secret: 'F4SmP0wD7kQonfuybQjixWFYzP0'
});

module.exports = {
  cloudinary
};