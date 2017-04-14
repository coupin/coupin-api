angular.module('MerchantSrv', []).factory('MerchantService', function($http) {
    return {
        get : function() {
            return $http.get('/api/merchant');
        },
        // Complete Registration
        complete : function(id, details) {
            return $http.post('/api/merchant/confirm/' + id, details);
        },
        // Use to approve or decline
        confirm : function(id, details) {
            return $http.put('/api/merchant/confirm/' + id, details);
        },
        login : function(details) {
            return $http.post('/api/merchant/login', details);
        },
        retrieve : function(id) {
            return $http.get('/api/merchant/' + id);
        }
    }
});