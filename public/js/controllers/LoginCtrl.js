angular.module('LoginCtrl', []).controller('LoginController', function($scope, $http, $window, AdminLoginSrv) {
    $scope.formData = {};
    $scope.showError = true;

    $scope.check = () => {
        $scope.loginError = "";
        $scope.showError = true;

        if(Object.keys($scope.formData).length == 2) {
            AdminLoginSrv.check($scope.formData)
            .then(function(data){
                $window.location.href = '/homepage';
            }, function(error) {
                $scope.loginError = "Email or Password is invalid."
                $scope.showError = false;
            });
        } else {
            $scope.loginError = "Email and Password Cannot Be Empty";
            $scope.showError = false;
        }
    };
});