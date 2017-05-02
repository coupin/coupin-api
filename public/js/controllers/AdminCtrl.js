angular.module('AdminCtrl', []).controller('AdminController', function($location, $scope, $window, AdminSrv){
    // form Data
    $scope.newAdminData = {};
    $scope.errorMessages = {};
    // Boolean variables for error or success
    $scope.showError = false;
    $scope.showSuccess = false;

    if(!$scope.user) {
        AdminSrv.getCurrentUser().then(function(response) {
            $scope.user = response.data;
        }).catch(function(err){
            console.log(err);
        });
    }

    // Add New Admin
    $scope.addAdmin = () => {
        AdminSrv.create($scope.newAdminData).then(function(data){
            var response = data.data;
            $scope.errorMessages = {};
            if(response.success) {
                $scope.newAdminData = {};
                $scope.registerMessage = response.message;
                $scope.showError = false;
                $scope.showSuccess = true;
            } else {
                // If it is a form Error
                if(response.errors) {
                    response = response.errors;
                    console.log(response);
                    for(var i = 0; i < response.length; i++) {
                        $scope.errorMessages[response[i].param] = response[i].msg;
                    }
                } else {
                    $scope.registerError = response.message;
                    $scope.showSuccess = false;
                    $scope.showError = true;   
                }
            }
        }).catch(function (err){
            console.log("Inside Error");
            $scope.registerError = err;
            $scope.showSuccess = false;
            $scope.showError = true;
        });
    };

    // Function to change views
    $scope.changeView = (view) => {
        $location.path(view);
    };

    // Function to log user out
    $scope.logout = () => {
        $window.location.href = '/logout';
    };
});