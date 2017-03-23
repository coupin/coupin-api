angular.module('AdminCtrl', []).controller('AdminController', function($location, $scope, $window){

    // Function to change views
    $scope.changeView = (view) => {
        $location.path(view);
    }

    // Function to log user out
    $scope.logout = () => {
        $window.location.href = '/logout';
    };
});