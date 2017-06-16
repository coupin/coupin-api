angular.module('MerchantSrv', []).factory('MerchantService', function($http) {
    return {
        // Complete Registration
        complete : function(id, details) {
            return $http.post('/merchant/' + id + '/confirm/', details);
        },
        // Use to approve or decline
        confirm : function(id, details) {
            return $http.put('/merchant' + id + '/confirm/', details);
        },
        get : function() {
            return $http.get('/merchant');
        },
        // Get currently signed in user
        getCurrentUser : function () {
            return $http.get('/merchant/authenticate');
        },
        login : function(details) {
            return $http.post('/merchant/authenticate', details);
        },
        retrieve : function(id) {
            return $http.get('/merchant/' + id);
        },
        update: function (id, user) {
            return $http.put('/merchant/' + id, user);
        }
    }
});