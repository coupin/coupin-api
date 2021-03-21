var cloudinary = require('cloudinary');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

module.exports = {
  singleUpload: function (req, res) {
    cloudinary.v2.uploader.upload_stream({
      public_id: req.body.public_id,
      overwrite: true,
      resource_type: 'image',
      timeout: 120000
    }, function (err, result) {
      if (err) {
        res.status(500).send({ error: err.message });
      } else {
        res.status(200).send(result);
      }
    }).end(req.file.buffer);
  },

  multipleUploads: function (req, res) {
    var counter = 0;
    var error = false;
    var errorMsg = null;
    var total = req.files.length;
    var urls = [];

    req.files.forEach(function (file) {
      if (!error) {
        cloudinary.v2.uploader.upload_stream({
          overwrite: true,
          resource_type: 'image',
          timeout: 120000
        }, function (err, result) {
          if (err) {
            error = true;
            errorMsg = err;
            res.status(500).send({ error: errorMsg.message });
          } else {
            counter++;
            urls.push({
              id: result.public_id,
              url: result.secure_url
            });
            if (counter === total) {
              res.status(200).send(urls);
            }
          }
        }).end(file.buffer);
      }
    });
  }
};
