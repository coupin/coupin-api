angular.module('MerchantCtrl', []).controller('MerchantController', function ($scope, $alert, $location, MerchantService) {
    $scope.states = ['lagos'];
    $scope.position = {};
    $scope.loadingPosition = false;
    $scope.updating = false;

    MerchantService.getCurrentUser().then(function (result) {
        if (result.status === 200) {
            $scope.user = result.data;
            $scope.position = $scope.user.merchantInfo.location;
        } else {
            $location.url('/merchant');
        }
    }).catch(function (err) {
        console.log(err);
    });

    $scope.changePassword = function (password, confirm) {
        if (password.match(confirm)) {
            MerchantService.changePassword(password).then(function (response) {
                $alert({
                    'title': 'Success!',
                    'content': 'Password was updated successfully',
                    'duration': 5,
                    'placement': 'top-right',
                    'show' : true ,
                    'type' : 'success'
                });
                $('#passwordModal').modal('hide');
            }).catch(function (err) {
                if (err.status === 500) {
                    showError('Oops!', 'An Error Occured, Please Try Again');
                } else {
                    showError('oops!', err.data.message);
                }
            });
        } else {
            showError('Oops', 'The passwords do not match');
        }
    };

    $scope.getLocation = function () {
        $scope.loadingPosition = true;
        navigator.geolocation.getCurrentPosition(function (position) {
            $scope.position.lat = position.coords.latitude;
            $scope.position.long = position.coords.longitude;
            $scope.loadingPosition = false;
            $scope.$digest();
        });
    };

    $scope.goToProfile = function() {
        $location.url('/profile');
    };

    $scope.logOut = function() {
        MerchantService.logOut();
    };

    $scope.update = function () {
        if (validateUser($scope.user)) {
            $scope.updating = true;
            if ('lat' in $scope.position && 'long' in $scope.position) {
                $scope.user.merchantInfo.location = [
                    $scope.position.long,
                    $scope.position.lat
                ];
            }

            MerchantService.update($scope.user._id, $scope.user).then(function (response) {
                $alert({
                    'title': 'Success!',
                    'content': 'Profile updated successfully',
                    'duration': 5,
                    'placement': 'top-right',
                    'show' : true ,
                    'type' : 'success'
                });
                $scope.updating = false;
            }).catch(function (err) {
                $scope.updating = false;
                if (err.status === 500) {
                    showError('Oops!', 'An Error Occured, Please Try Again');
                } else {
                    showError('oops!', err.data.message);
                }
            });
        }
    };

    /**
     * Validate User details
     * @param {*} user 
     */
    const validateUser = function (user) {
        var error = '';

        if (!('email' in user)) {
            showError('An error occured', 'Email cannot be empty');
            return false;
        } else if (!isEmail(user.email)) {
            showError('An error occured', 'Email is invalid');
            return false;
        }

        if ('companyName' in user.merchantInfo && user.merchantInfo.companyName.length === 0) {
            showError('An error occured', 'Company name cannot be empty');
            return false;
        }

        if ('companyDetails' in user.merchantInfo && user.merchantInfo.companyDetails.length < 15) {
            showError('An error occured', 'Company details must be more than 15 characters');
            return false;
        }

        if ('mobileNumber' in user.merchantInfo && !isNumber(user.merchantInfo.mobileNumber)) {
            showError('An error occured', 'Mobile number is invalid');
            return false;
        }

        if ('address' in user.merchantInfo && user.merchantInfo.address.length < 10) {
            showError('An error occured', 'Address is too vague. Please put more detail.');
            return false;
        }

        if ('city' in user.merchantInfo && user.merchantInfo.city.length < 3) {
            showError('An error occured', 'City name is too short. Please try again');
            return false;
        }

        if ('state' in user.merchantInfo && user.merchantInfo.state.length < 3) {
            showError('An error occured', 'State name is too short. Please try again');
            return false;
        }

        if ('location' in user.merchantInfo && (!('lat' in user.merchantInfo.location) || !('long' in user.merchantInfo.location))) {
            showError('An error occured', 'Location must have both latitude and longitude');
            return false;
        } else if ('location' in user.merchantInfo && (!isDecimal(user.merchantInfo.location.lat.toString()) || !isDecimal(user.merchantInfo.location.long.toString()))) {
            showError('An error occured', 'Location, latitude and longitude, must be decimals');
            return false;
        }

        return true;

    };

    /**
     * Check if email is valid
     * @param {String} email 
     */
    const isEmail = function (email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    };

    /**
     * Check if mobile nuber is valid
     * @param {String} number 
     */
    const isNumber = function (number) {
        if (/^\d+$/mg.test(number) && ([11, 13, 14].indexOf(number.length) > -1)) {
            return true;
        }
        
        return false;
    };

    /**
     * Check if number is decimal
     * @param {String} number 
     */
    const isDecimal = function (number) {
        if (/^\d\.{1}\d+$/mg.test(number) && number.length >= 8) {
            return true;
        }
        
        return false;
    };

    /**
     * Show error alert dialog.
     * @param {String} title 
     * @param {String} msg 
     */
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