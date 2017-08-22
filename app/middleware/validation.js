module.exports = {
  validateCodeCreation: function (req, res, next) {
    console.log(req.body);
    console.log(req.params);
    console.log(req);
    next();
  }
};