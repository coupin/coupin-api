var passport = require('./../middleware/passport');

// models
const Customer = require('./../models/users');
const CustomerCtrl = require('./../controllers/customer');

module.exports = function(router) {
  router.route('/customer/category')
    .post(passport.verifyJWT1, CustomerCtrl.createInterests)
    .put(passport.verifyJWT1, CustomerCtrl.updateInterests);
    
  router.route('/customer/favourites')
    .get(passport.verifyJWT1, CustomerCtrl.retrieveFavourites)
    .put(passport.verifyJWT1, CustomerCtrl.removeFavourites)
    .post(passport.verifyJWT, CustomerCtrl.addToFavourites);
    
  // Get customer by mobile number
  router.route('/customer/mobile/:mobileNumber')
    .get(CustomerCtrl.retrieveByNo)
    // Used to edit the customer
    .put(CustomerCtrl.update);
      
  router.route('/customer/:id')
    .put(passport.verifyJWT1, CustomerCtrl.updateUser);

};
