const rewardCtrl = require('../../controllers/api/reward');
const passport = require('../../middleware/passport');

const rewardRoutes = function (router) {
    router.route('/reward/code')
        .get(passport.verifyJWT1, rewardCtrl.getAll)
        .post(passport.verifyJWT1, rewardCtrl.getCode);

    router.route('/reward/me/later')
        .get(passport.verifyJWT1, rewardCtrl.getRewardsForLater);

    router.route('/reward/me/now')
        .get(passport.verifyJWT1, rewardCtrl.getRewardsForNow);
};

module.exports = rewardRoutes;