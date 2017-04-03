angular.module('LoginCtrl', []).controller('LoginController', function($scope, $http, $window, AdminLoginSrv) {
    $scope.formData = {};
    $scope.showError = false;

    $scope.check = () => {
        $scope.loginError = "";
        $scope.showError = false;

        if(Object.keys($scope.formData).length == 2) {
            AdminLoginSrv.check($scope.formData)
            .then(function(data){
                $window.location.href = '/homepage';
            }, function(err) {
                console.log(err);
                $scope.loginError = "Email or Password is invalid."
                $scope.showError = true;
            });
        } else {
            $scope.loginError = "Email and Password Cannot Be Empty";
            $scope.showError = true;
        }
    };

    $scope.registerMerch = () => {
        AdminLoginSrv.registerMerch($scope.formData)
        .then(function(response) {
            if(response.data.success) {
                console.log('Success');
                console.log(response.data);
            } else {
                console.log(response.data);
            }
        })
        .catch(function(err) {
            console.log('Catch');
            console.log(err);
        });
    };
});