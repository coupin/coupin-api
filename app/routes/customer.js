var passport = require('./../middleware/passport');

// models
var auth = require('./../middleware/auth');
var Customer = require('./../models/users');
var CustomerCtrl = require('./../controllers/customer');

module.exports = function(router) {
  router.route('/customer/category')
    .post(
      passport.verifyJWT1,
      auth.isCustomer,
      CustomerCtrl.createInterests
    )
    .put(
      passport.verifyJWT1,
      auth.isCustomer,
      CustomerCtrl.updateInterests
    );
    
  router.route('/customer/favourites')
    .get(
      passport.verifyJWT1,
      auth.isCustomer,
      CustomerCtrl.retrieveFavourites
    )
    .put(
      passport.verifyJWT1,
      auth.isCustomer,
      CustomerCtrl.removeFavourites
    )
    .post(
      passport.verifyJWT1,
      auth.isCustomer,
      CustomerCtrl.addToFavourites
    );

  router.route('/customer/feedback')
    .post(
      passport.verifyJWT1,
      auth.isCustomer,
      CustomerCtrl.requestSupport
    );
      
  router.route('/customer/:id')
    .put(
      passport.verifyJWT1,
      auth.isCustomer,
      CustomerCtrl.updateUser
    );

};
