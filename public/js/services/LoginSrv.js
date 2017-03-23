angular.module('LoginSrv', []).factory('AdminLoginSrv', function($http) {
    return {
        check : function(adminData) {
            return $http.post('/admin/login', adminData);
        }
    }
});