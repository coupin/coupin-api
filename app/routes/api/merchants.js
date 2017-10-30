const merchantCtrl = require('./../../controllers/api/merchant');

const merchantRoutes = function (router) {
    router.route('/merchant')
        .get(merchantCtrl.markerInfo);

    router.route('/merchant/hot')
        .get(merchantCtrl.retrieveHotList);
    
    router.route('/merchant/:id')
        .post(merchantCtrl.deleteOne);

    router.route('/merchant/:query/search')
        .get(merchantCtrl.search); 
};

module.exports = merchantRoutes;