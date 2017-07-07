const rewardCtrl = require('../../controllers/api/reward');
const passport = require('../../middleware/passport');

const rewardRoutes = function (router) {
    router.route('/reward/code')
        .get(passport.verifyJWT1, rewardCtrl.getCode);
};

module.exports = rewardRoutes;