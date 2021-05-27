var goelocationPattern = /^\d{1,3}.\d+$/;
var phonePattern = /^\d{10,11}$/;

module.exports = {
  validateAdd: function(req, res, next) {
    var body = req.body;
    
    if (!body.streetLine1) {
      res.status(400).send({
        message: 'The streetLine1 is required.'
      });
    } else if (!body.city) {
      res.status(400).send({
        message: 'The city is required.'
      });
    } else if (!body.state) {
      res.status(400).send({
        message: 'The state is required.'
      });
    } else if (!body.mobileNumber || !phonePattern.test(body.mobileNumber)) {
      res.status(400).send({
        message: 'The mobileNumber is required.'
      });
    } else if (!body.longitude || !goelocationPattern.test(body.longitude.toString())) {
      res.status(400).send({
        message: 'The longitude is required.'
      });
    } else if (!body.latitude || !goelocationPattern.test(body.latitude.toString())) {
      res.status(400).send({
        message: 'The latitude is required.'
      });
    } else {
      next();
    }
  },
  validateUpdate: function(req, res, next) {
    var body = req.body;
    
    if (body.streetLine1 && body.streetLine1.trim().length === 0) {
      res.status(400).send({
        message: 'The streetLine1 is invalid.'
      });
    } else if (body.mobileNumber && !phonePattern.test(body.mobileNumber)) {
      res.status(400).send({
        message: 'The mobileNumber is invalid.'
      });
    } else if (body.longitude && !goelocationPattern.test(body.longitude.toString())) {
      res.status(400).send({
        message: 'The longitude is invalid.'
      });
    } else if (body.latitude && !goelocationPattern.test(body.latitude.toString())) {
      res.status(400).send({
        message: 'The latitude is invalid.'
      });
    } else {
      next();
    }
  }
};