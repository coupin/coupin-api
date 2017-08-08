angular.module('AdminMerchantCtrl', []).controller('AdminMerchantController', function ($alert, $scope, $location, MerchantService) {
    $scope.loading = false;
    $scope.formData = {};
    $scope.merchants = [];

    $scope.cropped = '';
    $scope.uncropped = '';

    $scope.goToNewMerch = function() {
        $location.url('/newMerch');
    };

    $scope.logOut = function() {
        MerchantService.logOut().then(function(response){
            $location.url('/merchant');
        }).catch(function(error) {
            console.log(error);
        });
    };

    $scope.loadMerchants = function() {
        MerchantService.getAllMerchants()
        .then(function (res) {
            $scope.merchants = res.data;
        })
        .catch(function (err) {
            console.log(err);
        });
    };

    $scope.createMerchant = function (data) {
        if (data.password === data.password2) {
            $scope.loading = true;
            MerchantService.upload({file: $scope.cropped})
            .then(function (response) {
                const url = response.data.url;
                data.merchantInfo.logo = url;
                MerchantService.adminCreate(data)
                .then(function (res) {
                    $scope.loading === false;
                    $scope.cropped = '';
                    $scope.uncropped = '';
                    $scope.formData = {};
                })
                .catch(function (err) {
                    $scope.loading === false;
                    console.log(err);
                });
            }).catch(function (error) {
                $scope.loading === false;
                console.log(error);
            })
        } else {
            $alert.show({
                title: 'Error',
                content: 'Passowrds do not match',
                duration: 5,
                placement: 'top-right',
                type: 'info'
            });
        }
    };

    const handleFileSelect = function (evt) {
        let file = evt.currentTarget.files[0];
        let reader = new FileReader();
        reader.onload = function (evt) {
            $scope.$apply(function ($scope) {
                $scope.uncropped = evt.target.result;
            });
        };
        reader.readAsDataURL(file);
    };

    angular.element(document.querySelector('#fileInput')).on('change', handleFileSelect);
});