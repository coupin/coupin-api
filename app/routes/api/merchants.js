const merchantCtrl = require('./../../controllers/api/merchant');

const merchantRoutes = function (router) {
    router.route('/merchant')
        .post(merchantCtrl.markerInfo);

    router.route('/merchant/hot')
        .get(merchantCtrl.retrieveHotList);
    
    router.route('/merchant/search')
        .post(merchantCtrl.search); 
        
    router.route('/merchant/:id')
        .post(merchantCtrl.deleteOne);

};

module.exports = merchantRoutes;