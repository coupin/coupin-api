angular.module('MerchantSrv', []).factory('MerchantService', function($http) {
    return {
        get : function() {
            return $http.get('/api/merchant');
        },
        // Use to approve or decline
        confirm: function(id, details) {
            return $http.put('/api/merchant/confirm/' + id, details);
        }
    }
});