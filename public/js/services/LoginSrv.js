angular.module('LoginSrv', []).factory('AdminLoginSrv', function($http) {
    return {
        check : function(adminData) {
            return $http.post('/admin/login', adminData);
        },
        registerMerch : function(merchantData) {
            return $http.post('/merchant/register', merchantData);
        }
    }
});