const merchantCtrl = require('./../../controllers/api/merchant');
var passport = require('./../../middleware/passport');

const merchantRoutes = function (router) {
    router.route('/merchant')
        .post(merchantCtrl.markerInfo);

    router.route('/merchant/hot')
        .get(merchantCtrl.retrieveHotList);

    router.route('/merchant/new')
        .post(passport.verifyJWT1, merchantCtrl.notificationUpdates);

    router.route('/merchant/recent')
        .post(passport.verifyJWT1, merchantCtrl.mostRecent);
    
    router.route('/merchant/search')
        .post(merchantCtrl.search); 
        
    router.route('/merchant/:id')
        .post(merchantCtrl.deleteOne);

};

module.exports = merchantRoutes;