var passport = require('./../middleware/passport');

// models
const auth = require('./../middleware/auth');
const Customer = require('./../models/users');
const CustomerCtrl = require('./../controllers/customer');

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
      passport.verifyJWT,
      auth.isCustomer,
      CustomerCtrl.addToFavourites
    );
      
  router.route('/customer/:id')
    .put(
      passport.verifyJWT1,
      auth.isCustomer,
      CustomerCtrl.updateUser
    );

};
