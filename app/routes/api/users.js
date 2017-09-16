const userCtrl = require('./../../controllers/api/user');

const userRoute = function (router) {
  router.route('/user/category')
  .post(userCtrl.createInterests)
  .put(userCtrl.updateInterests);
};

module.exports = userRoute;