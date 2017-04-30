angular.module('MerchantSrv', []).factory('MerchantService', function($http) {
    return {
        get : function() {
            return $http.get('/merchant');
        },
        // Complete Registration
        complete : function(id, details) {
            return $http.post('/merchant/confirm/' + id, details);
        },
        // Use to approve or decline
        confirm : function(id, details) {
            return $http.put('/merchant/confirm/' + id, details);
        },
        login : function(details) {
            return $http.post('/merchant/authenticate', details);
        },
        retrieve : function(id) {
            return $http.get('/merchant/' + id);
        }
    }
});