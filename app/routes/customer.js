var passport = require('./../middleware/passport');

// models
var auth = require('./../middleware/auth');
var AddressCtrl = require('./../controllers/addresses');
var AddressValidator = require('../validators/addresses');
var CustomerCtrl = require('./../controllers/customer');

module.exports = function(router) {
  router.route('/customer/addresses')
    .post(
      passport.verifyJWT1,
      auth.isCustomer,
      AddressValidator.validateAdd,
      AddressCtrl.addAddress
    )
    .get(
      passport.verifyJWT1,
      auth.isCustomer,
      AddressCtrl.retrieveAddresses
    );

  router.route('/customer/addresses/:id')
    .delete(
      passport.verifyJWT1,
      auth.isCustomer,
      AddressCtrl.deleteAddress
    )
    .put(
      passport.verifyJWT1,
      auth.isCustomer,
      AddressValidator.validateUpdate,
      AddressCtrl.updateAddress
    );

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

  router.route('/customer/notifications/:id')
    .post(
      passport.verifyJWT1,
      auth.isCustomer,
      CustomerCtrl.setToken
    );
      
  router.route('/customer/:id')
    .put(
      passport.verifyJWT1,
      auth.isCustomer,
      CustomerCtrl.updateUser
    );
};
