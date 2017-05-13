angular.module('RequestCtrl', []).controller('RequestController', function($scope, $alert, MerchantService){
    $scope.requests = [];
    $scope.currentRequest = {};

    // loading value
    $scope.loading = false;

    // Requests
    $scope.totalReq = [];
    $scope.totalPen = [];
    $scope.totalCom = [];
    $scope.totalDec = [];

    MerchantService.get().then(function(response){
        console.log(response.data);
        $scope.requests = response.data;

        for(var i = 0; i < $scope.requests.length; i+=1) {
            if($scope.requests[i].activated) {
                $scope.totalCom.push($scope.requests[i]);
            } else if($scope.requests[i].rejected) {
                $scope.totalDec.push($scope.requests[i]);
            } else if($scope.requests[i].isPending) {
                $scope.totalPen.push($scope.requests[i]);
            } else {
                $scope.totalReq.push($scope.requests[i]);
            }
        }
        console.log($scope.requests);
    });

    $scope.selectMerch = (x) => {
        $scope.currentRequest = $scope.totalReq[x];
    };
    
    $scope.confirm = (id, approve, details) => {
        // Show loading screen and add details for decline
        $scope.loading = true;
        var reason = {
            reason : details
        };

        MerchantService.confirm($scope.currentRequest._id, reason).then(function(data) {
            $scope.loading = false;
            if(data.data.success) {
                console.log(data.data);
                if(!data.data.rejected) {
                    // Send an alert that approval has been successful
                    $alert({
                        'title': "Success",
                        'content': $scope.currentRequest.companyName + " has been activated and email has been sent",
                        'duration': 10,
                        'placement': 'top-right',
                        'show' : true ,
                        'type' : 'success'
                    });
                } else {
                    // Send an alert that approval has been successful
                    $alert({
                        'title': "Success",
                        'content': $scope.currentRequest.companyName + " has been declined and email has been sent",
                        'duration': 10,
                        'placement': 'top-right',
                        'show' : true ,
                        'type' : 'success'
                    });
                }

                // Change it in the data being shown
                $scope.requests = $scope.requests.filter(function(request) {
                    if(request._id == $scope.currentRequest._id) {
                        if(approve === true) {
                            request.isPending = true;
                        } else {
                            request.rejected = true;
                        }
                    }
                    return request;
                });
            } else {
                // Send an alert that approval failed
                showError('Activation Failed', data.data.message);
            }
        }).catch(function(err) {
            $scope.loading = false;
            showError('Activation Failed', err);
        });
    };

    const showError = function (title, msg) {
        $alert({
            'title': title,
            'content': msg,
            'duration': 5,
            'placement': 'top-right',
            'show' : true ,
            'type' : 'danger'
        });
    };
});