angular.module('LoginCtrl', []).controller('LoginController', function($scope, $http, $window, $alert, AdminLoginSrv) {
    // scope variable to hold form data
    $scope.formData = {};
    // to show error and loading
    $scope.showError = false;
    $scope.loading = false;
    // to hold categories
    $scope.categories = {
        foodndrinks : false,
        shopping : false,
        entertainment : false,
        healthnbeauty : false, 
        gadgets : false, 
        tickets : false, 
        travel : false
    }

    // Non-scope variables
    var multipleAlerts = [];
    var hideAllAlerts = () => {
        if(multipleAlerts.length > 0) {
            for(var j = 0; j < multipleAlerts.length; j++) {
                multipleAlerts[j].hide();
            }
        }
    };

    // Add selected category to Object
    $scope.addCat = (x) => {
        if($scope.categories[x] === false) {
            $scope.categories[x] = true;
        } else {
            $scope.categories[x] = false;
        }
    };

    // For Admin Login
    $scope.check = () => {
        // show loading
        $scope.loading = true;
        // reset show error back to false
        $scope.showError = false;

        // only go through if the object has 2 keys
        if(Object.keys($scope.formData).length == 2) {
            // check if the login details are correct, if so log in and redirect else show error
            AdminLoginSrv.check($scope.formData)
            .then(function(data){
                $window.location.href = '/homepage';
            }, function(err) {
                $scope.loading = false;
                $scope.loginError = "Email or Password is invalid."
                $scope.showError = true;
            });
        } else {
            $scope.loginError = "Email and Password Cannot Be Empty";
            $scope.showError = true;
        }
    };

    // Register a Merchant
    $scope.registerMerch = () => {
        // Hide any existing alert
        hideAllAlerts();
        
        // Get final categories picked
        var finalCat = [];
        for(x in $scope.categories) {
            if($scope.categories[x] === true)
                finalCat[finalCat.length] = x;
        }
        $scope.formData.categories = finalCat;

        // Show loading icon
        $scope.loading = true;

        // User service to register merchant
        AdminLoginSrv.registerMerch($scope.formData)
        .then(function(response) {
            if(response.data.success) {
                // Hide loading icon
                $scope.loading = false;

                // Reset form data
                $scope.formData = {};
                $scope.categories = {
                    foodndrinks : false,
                    shopping : false,
                    entertainment : false,
                    healthnbeauty : false, 
                    gadgets : false, 
                    tickets : false, 
                    travel : false
                }

                // Send out success alert
                $alert({
                    'title': "Success",
                    'content': response.data.message,
                    'placement': 'top-right',
                    'show' : true ,
                    'type' : 'success'
                });
            } else {
                // hide loading icon
                $scope.loading = false;
                var errorArray = response.data.message;

                // check if errorArray is an object, if so send an alert for each item
                if(typeof errorArray === 'object') {
                    for(var i = 0; i < errorArray.length; i++) {
                        multipleAlerts[multipleAlerts.length] = $alert({
                            'title': "Request Failed",
                            'content': errorArray[i].msg,
                            'duration': 5,
                            'placement': 'top-right',
                            'show' : true ,
                            'type' : 'danger'
                        });
                    }
                } else {
                    // else just show the message
                    $alert({
                        'title': "Request Failed",
                        'content': response.data.message,
                        'duration': 5,
                        'placement': 'top-right',
                        'show' : true ,
                        'type' : 'danger'
                    });
                }
            }
        })
        .catch(function(err) {
            $scope.loading = false;
                $alert({
                    'title': "Request Failed",
                    'content': err,
                    'duration': 5,
                    'placement': 'top-right',
                    'show' : true ,
                    'type' : 'danger'
                });
        });
    };
});