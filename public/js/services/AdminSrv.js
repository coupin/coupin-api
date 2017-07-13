angular.module('AdminSrv', []).factory('AdminSrv', ['$http', function($http){
    return {
        // Activate an admin
        activate: function(id) {
            return $http.post('/admin/activate/' + id);
        },
        // call to POST new admin
        create: function(adminData) {
            return $http.post('/admin/addAdmin/', adminData);
        },
        // Call to GET admins
        get : function() {
            return $http.get('/admin/all');
        },
        getAdmin : function(id) {
            return $http.delete('/admin/' + id);
        },
        // Call to DE-Activate admin
        deactivate: function(id) {
            return $http.post('/admin/deactivate/' + id);
        },
        // call to DELETE an admin
        delete: function(id) {
            return $http.delete('/admin/' + id);
        },
        getCurrentUser: function() {
            return $http.get('/admin/getCurrentUser/');
        }
    }
}]);