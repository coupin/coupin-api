angular.module('SuperAdminCtrl', []).controller('SuperAdminController', function($scope, $alert, AdminSrv) {
    $scope.admins = [];
    $scope.currentAdmin = {};

    // Validation Checks
    $scope.empty = false;
    $scope.error = false;

    var counter = 0;

    AdminSrv.get().then(function(data){
        $scope.admins = data.data;
        console.log($scope.admins.length);
        if($scope.admins.length == 0) {
            $scope.empty = true;
        }
    }).catch(function(err) {
        $scope.errorMessage = err;
        $scope.error = true;
    });

    $scope.activate = function(id) {
        AdminSrv.activate(id)
        .then(function(data) {
            if(data.data.success) {
                $scope.admins = $scope.admins.filter(function(admin) {
                    if(admin._id == $scope.currentAdmin._id) {
                        admin.local.isActive = true;
                    }
                    return admin;
                });
                console.log($scope.admins);
                $alert({
                    'title': "Success",
                    'content': $scope.currentAdmin.local.email + data.data.message,
                    'duration': 5,
                    'placement': 'top-right',
                    'show' : true ,
                    'type' : 'success'
                });
            } else {
                $alert({
                    'title': "Failure",
                    'content': $scope.currentAdmin.local.email + data.data.message,
                    'duration': 5,
                    'placement': 'top-right',
                    'show' : true ,
                    'type' : 'error'
                });
            }
        }).catch(function(err) {
            $alert({
                    'title': "Failure",
                    'content': err,
                    'duration': 5,
                    'placement': 'top-right',
                    'show' : true ,
                    'type' : 'error'
                });
        });
    };

    $scope.deactivate = function(id) {
        AdminSrv.deactivate(id)
        .then(function(data) {
            if(data.data.success) {
                $scope.admins = $scope.admins.filter(function(admin) {
                    if(admin._id == $scope.currentAdmin._id) {
                        admin.local.isActive = false;
                    }
                    return admin;
                });
                console.log($scope.admins);
                $alert({
                    'title': "Success",
                    'content': $scope.currentAdmin.local.email + data.data.message,
                    'duration': 5,
                    'placement': 'top-right',
                    'show' : true ,
                    'type' : 'success'
                });
            } else {
                $alert({
                    'title': "Failure",
                    'content': $scope.currentAdmin.local.email + data.data.message,
                    'duration': 5,
                    'placement': 'top-right',
                    'show' : true ,
                    'type' : 'error'
                });
            }
        }).catch(function(err) {
            $alert({
                    'title': "Failure",
                    'content': err,
                    'duration': 5,
                    'placement': 'top-right',
                    'show' : true ,
                    'type' : 'error'
                });
        });
    };

    $scope.delete = function(id) {
        AdminSrv.delete(id)
        .then(function(data) {
            if(data.data.success) {
                $scope.admins = $scope.admins.filter( function(admin) {
                    return admin._id !== $scope.currentAdmin._id;
                });
                $alert({
                    'title': "Success",
                    'content': $scope.currentAdmin.local.email + data.data.message,
                    'duration': 5,
                    'placement': 'top-right',
                    'show' : true ,
                    'type' : 'success'
                });
            }
        }).catch(function(err) {
            $alert({
                    'title': "Failed",
                    'content': err,
                    'duration': 5,
                    'placement': 'top-right',
                    'show' : true ,
                    'type' : 'error'
                });
        });
    };

    $scope.selectAdmin = function(x) {
        $scope.currentAdmin = $scope.admins[x];
        $scope.currentAdmin.indexNo = x - 1;
        console.log($scope.currentAdmin);
    };
});