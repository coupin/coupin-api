//@ts-check
const rewardCtrl = require('../../controllers/api/reward');
const passport = require('../../middleware/passport');
const validation = require('../../middleware/validation');

const rewardRoutes = function (router) {
    router.route('/reward/coupin')
        .get(passport.verifyJWT1, rewardCtrl.getAll)
        .post(passport.verifyJWT1, rewardCtrl.coupin);

    router.route('/reward/me/later')
        .get(passport.verifyJWT1, rewardCtrl.getRewardsForLater)
        .post(passport.verifyJWT1, rewardCtrl.save);

    router.route('/reward/me/now')
        .get(passport.verifyJWT1, rewardCtrl.getRewardsForNow);

    router.route('/reward/temp')
        .get(rewardCtrl.testdelete);

};

module.exports = rewardRoutes;