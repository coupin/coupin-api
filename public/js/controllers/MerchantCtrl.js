angular.module('MerchantCtrl', []).controller('MerchantController', function ($scope, $location, MerchantService) {
    MerchantService.getCurrentUser().then(function (result) {
        if (result.status === 200) {
            $scope.user = result.data;
        } else {
            $location.url('/merchant');
        }
    }).catch(function (err) {
        console.log(err);
    });
});