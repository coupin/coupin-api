var multer = require('multer');
var FileCtrl = require('./../controllers/file');

var upload = multer();

module.exports = function (router) {
  router.post('/uploads', upload.array('photos'), FileCtrl.multipleUploads);
  router.post('/upload', upload.single('file'), FileCtrl.singleUpload)
};
