const merchantCtrl = require('./../../controllers/api/merchant');

const merchantRoutes = function (router) {
    router.route('/merchant')
        .get(merchantCtrl.markerInfo);
};

module.exports = merchantRoutes;