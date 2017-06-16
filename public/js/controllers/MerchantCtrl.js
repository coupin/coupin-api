angular.module('MerchantCtrl', []).controller('MerchantController', function ($scope, $location, MerchantService) {
    $scope.states = ['lagos'];
    $scope.position = {
        lat : '',
        long: ''
    };
    $scope.loadingPosition = false;

    MerchantService.getCurrentUser().then(function (result) {
        if (result.status === 200) {
            $scope.user = result.data;
        } else {
            $location.url('/merchant');
        }
    }).catch(function (err) {
        console.log(err);
    });

    $scope.getLocation = function () {
        $scope.loadingPosition = true;
        navigator.geolocation.getCurrentPosition(function (position) {
            $scope.position.lat = position.coords.latitude;
            $scope.position.long = position.coords.longitude;
            console.log(typeof position.coords.latitude);
            $scope.loadingPosition = false;
            $scope.$digest();
        });
    };
});