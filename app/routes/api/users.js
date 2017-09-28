const passport = require('./../../middleware/passport');
const userCtrl = require('./../../controllers/api/user');

const userRoute = function (router) {
  router.route('/user')
    .get(passport.verifyJWT1, userCtrl.retrieveUser);

  router.route('/user/category')
    .post(passport.verifyJWT1, userCtrl.createInterests)
    .put(passport.verifyJWT1, userCtrl.updateInterests);

  router.route('/user/favourites')
    .get(passport.verifyJWT1, userCtrl.retrieveFavourites)
    .put(passport.verifyJWT1, userCtrl.removeFavourites)
    .post(passport.verifyJWT, userCtrl.addToFavourites);
};

module.exports = userRoute;