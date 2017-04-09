angular.module('MerchantSrv', []).factory('MerchantService', function($http) {
    return {
        get : function() {
            return $http.get('/api/merchant');
        }
    }
});