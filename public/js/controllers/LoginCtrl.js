angular.module('LoginCtrl', []).controller('LoginController', function($scope, $http, $location, $window, $alert, AdminLoginSrv, MerchantService) {
    // scope variable to hold form data
    $scope.formData = {};
    
    // to show error and loading
    $scope.showError = false;
    $scope.loading = [false, false];

    // Get merchant id
    const merchId = $location.$$absUrl.match(/(\w)*$/g);

    // States
    $scope.states = ['lagos'];

    // Get current merchant if merchant route called
    if(($location.$$absUrl).includes('merchant/confirm')) {
        MerchantService.retrieve(merchId[0]).then(function(response) {
            $scope.merchant = response.data;
        }).catch(function() {
            console.log("The user doesn't exist.");
        });
    }

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
        $scope.loading[0] = true;
        // reset show error back to false
        $scope.showError = false;

        // only go through if the object has 2 keys
        if(Object.keys($scope.formData).length == 2) {
            // check if the login details are correct, if so log in and redirect else show error
            AdminLoginSrv.check($scope.formData)
            .then(function(data){
                $window.location.href = '/homepage';
            }, function(err) {
                $scope.loading[0] = false;
                $scope.loginError = "Email or Password is invalid."
                $scope.showError = true;
            });
        } else {
            $scope.loading[0] = false;
            $scope.loginError = "Email and Password Cannot Be Empty";
            $scope.showError = true;
        }
    };

    /**
     * Used to complete merchants registration
     */
    $scope.completeMerch = () => {
        $scope.loading[1] = true;
        
        MerchantService.complete(merchId[0], $scope.formData).then(function(response){
            // Get response data
            let data = response.data;

            // Show loading icon/screen
            $scope.loading[1] = false;

            // Handle service response
            if(data.success === true) {
                $alert({
                    'title': "Confirmation Success",
                    'content': data.message,
                    'placement': 'top-right',
                    'show' : true ,
                    'type' : 'success'
                });
                $window.location.href = '/merchant/register';
            } else {
                // hide loading icon
                $scope.loading[1] = false;

                $scope.showErrors("Confirmation Failed", response);
            }
        }).catch(function(err){
            $scope.loading[1] = false;
            console.log(err);
            $alert({
                'title': "Confirmation Failed",
                'content': err,
                'duration': 5,
                'placement': 'top-right',
                'show' : true ,
                'type' : 'danger'
            });
        });
    };

    /**
     * Logs merchant into the system
     */
    $scope.loginMerch = () => {
        let details = {
            email : $scope.formData.loginEmail,
            password : $scope.formData.loginPassword
        };

        MerchantService.login(details).then(function(response) {
            if(response.status === 200) {
                $window.location.href = "/merchant";
            }
        }).catch(function(err) {
            $scope.loading[1] = false;
            $scope.showErrors("Request Failed", err);
        });
    }

    /**
     * Used to register a merchant after they have been approved
     */
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
        $scope.loading[1] = true;

        // User service to register merchant
        AdminLoginSrv.registerMerch($scope.formData)
        .then(function(response) {
            if(response.data.success) {
                // Hide loading icon
                $scope.loading[1] = false;

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
                $scope.loading[1] = false;

                // display errors using alerts
                $scope.showErrors("Request Failed", response);
            }
        })
        .catch(function(err) {
            $scope.loading[1] = false;
            $scope.showErrors("Request Failed", err);
        });
    };

    /**
     * Used to show errors from the service response
     */
    $scope.showErrors = function(title, response) {
        var data = response.data.message;

        console.log(response.data);
        
        // check if errorArray is an object, if so send an alert for each item
        if(typeof data === 'object') {
            for(var i = 0; i < data.length; i++) {
                multipleAlerts[multipleAlerts.length] = $alert({
                    'title': title,
                    'content': data[i].msg,
                    'duration': 5,
                    'placement': 'top-right',
                    'show' : true ,
                    'type' : 'danger'
                });
            }
        } else {
            // else just show the message
            $alert({
                'title': title,
                'content': data,
                'duration': 5,
                'placement': 'top-right',
                'show' : true ,
                'type' : 'danger'
            });
        }
    };
});