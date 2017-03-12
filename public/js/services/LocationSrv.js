angular.module('LocationSrv', []).factory('Location', ['$http', function($http){
    return {
        // Call to GET nerds
        get : function() {
            return $http.get('/api/locations');
        },
        // call to POST new locations
        create: function(locationData) {
            return $http.post('/api/locations', locationData);
        },
        // call to DELETE location
        delete: function(id) {
            return $http.delete('/api/locations/' + id);
        }
    }
}]);