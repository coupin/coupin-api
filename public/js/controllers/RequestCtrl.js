angular.module('RequestCtrl', []).controller('RequestController', function($scope, MerchantService){
    $scope.requests = [];
    $scope.currentRequest = {};

    $scope.totalReq = [];
    $scope.totalPen = [];
    $scope.totalCom = [];

    MerchantService.get().then(function(response){
        $scope.requests = response.data;

        for(var i = 0; i < $scope.requests.length; i+=1) {
            if($scope.requests[i].modifiedData && $scope.requests[i].activated == true) {
                $scope.totalCom.push($scope.requests[i]);
            } else if($scope.requests[i].modifiedData && $scope.requests[i].activated == false) {
                $scope.totalPen.push($scope.requests[i]);
            } else {
                $scope.totalReq.push($scope.requests[i]);
            }
        }
    });

    $scope.selectMerch = (x) => {
        $scope.currentRequest = $scope.requests[x];
    };
});