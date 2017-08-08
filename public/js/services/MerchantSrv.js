angular.module('MerchantSrv', []).factory('MerchantService', function($http) {
    return {
        adminCreate: function (data) {
            return $http.post('/merchant/override', data);
        },
        changePassword : function (password) {
            return $http.post('/auth/password', {password: password});
        }
        ,
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
        getAllMerchants : function () {
            return $http.get('/merchant/all');
        },
        // Get currently signed in user
        getCurrentUser : function () {
            return $http.get('/merchant/authenticate');
        },
        login : function(details) {
            return $http.post('/merchant/authenticate', details);
        },
        logOut : function() {
            return $http.get('/logout/' + 0);
        },
        retrieve : function(id) {
            return $http.get('/merchant/' + id);
        },
        update: function (id, user) {
            return $http.put('/merchant/' + id, user);
        },
        upload: function (image) {
            return $http.post('/upload', image);
        }
    }
});