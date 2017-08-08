angular.module('RewardsCtrl', []).controller('RewardsController', function ($scope, $alert, $location, RewardsService) {
    const id = $location.search().id;
    const errTitle = 'Error!';
    const errMsg = 'Something went wrong on our end. Please try again.';

    var selectAll = false;
    var weekDays = false;
    var weekEnds = false;

    if (id) {
        $scope.categories = {};
        $scope.update = true;
        RewardsService.getReward(id).then(function(result) {
            $scope.newReward = result.data;
            $scope.newReward.endDate = new Date($scope.newReward.endDate);
            $scope.newReward.startDate = new Date($scope.newReward.startDate);
            $scope.newReward.applicableDays.forEach(function(x) {
                $('#'+x).css('background', '#2e6da4');
                $('#'+x).css('color', '#fff');
            });
            $scope.newReward.categories.forEach(function(category) {
                $scope.categories[category] = true;
            });
        }).catch(function(error) {
            console.log(error);
            showError(errTitle, errMsg);
        });
    } else {
        $scope.newReward = {
            applicableDays: [],
            categories: [],
            multiple: {}
        };
    }

    $scope.loading = false;

    $scope.activeRewards = [];
    $scope.inactiveRewards = [];
    $scope.daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    $scope.addCat = function (category) {
        if ($scope.newReward.categories.indexOf(category) == -1) {
            $scope.newReward.categories.push(category);
        } else {
            $scope.newReward.categories.splice($scope.newReward.categories.indexOf(category), 1);
        }
    };

    $scope.addReward = function() {
        $location.url('/merchant/rewards');
    };

    $scope.editReward = function(id) {
        $location.url('/merchant/rewards?id=' + id);
    };

    $scope.deleteReward = function(id) {
        RewardsService.delete(id).then(function(response) {
            $location.url('/merchant');
        }).catch(function(error) {
            console.log(error);
            showError(errTitle, error.data.message);
        });
    };

    $scope.changeStatus = function(index, isActive, tab) {
        var reward = {};
        if (tab === 0) {
            reward = $scope.rewards[index];
        } else if (tab === 1) {
            reward = $scope.activeRewards[index];
        } else if (tab === 2) {
            rewards = $scope.inactiveRewards[index];
        }

        if (isActive) {
            RewardsService.deactivate(reward._id).then(function (result) {
                if (result.status === 200) {
                    reward.isActive = false;
                    $location.url('/merchant#inactive');
                } else if (result.status === 500) {
                    showError(errTitle, errMsg);
                } else {
                    showError(errTitle, result.data);
                }
            }).catch(function (err) {
                showError(errTitle, errMsg);
            });   
        } else {
            RewardsService.activate(reward._id).then(function (result) {
                if (result.status === 200) {
                    reward.isActive = true;
                    $location.url('/merchant#active');
                } else if (result.status === 500) {
                    showError(errTitle, errMsg);
                } else {
                    showError(errTitle, result.data);
                }
            }).catch(function (err) {
                showError(errTitle, errMsg);
            });
        }
    }

    // Check all the days of the week
    $scope.checkAll = function () {
        if (!selectAll) {
            selectAll = true;
            for (var y = 0; y < 7; y++) {
                if ($scope.newReward.applicableDays.indexOf(y) == -1) {
                    $scope.newReward.applicableDays.push(y);
                    $('#'+y).css('background', '#2e6da4');
                    $('#'+y).css('color', '#fff');
                }
            }
        } else {
            selectAll = false;
            for (var y = 0; y < 7; y++) {
                const index = $scope.newReward.applicableDays.indexOf(y);
                if (index > -1) {
                    $scope.newReward.applicableDays.splice(index, 1);
                    $('#'+y).css('background', '#fff');
                    $('#'+y).css('color', '#2e6da4');
                }
            }
        }
        console.log($scope.newReward.applicableDays);
    };

    // Check weekdays
    $scope.weekDay = function () {
        if (!weekDays) {
            weekDays = true;
            for (var y = 0; y < 5; y++) {
                if ($scope.newReward.applicableDays.indexOf(y) == -1) {
                    $scope.newReward.applicableDays.push(y);
                    $('#'+y).css('background', '#2e6da4');
                    $('#'+y).css('color', '#fff');
                }
            }
        } else {
            weekDays = false;
            for (var y = 0; y < 5; y++) {
                const index = $scope.newReward.applicableDays.indexOf(y);
                if (index > -1) {
                    $scope.newReward.applicableDays.splice(index, 1);
                    $('#'+y).css('background', '#fff');
                    $('#'+y).css('color', '#2e6da4');
                }
            }
        }
    };

    // Check weekends
    $scope.weekEnd = function () {
        if (!weekEnds) {
            weekEnds = true;
            for (var y = 4; y < 7; y++) {
                if ($scope.newReward.applicableDays.indexOf(y) == -1) {
                    $scope.newReward.applicableDays.push(y);
                    $('#'+y).css('background', '#2e6da4');
                    $('#'+y).css('color', '#fff');
                }
            }
        } else {
            weekEnds = false;
            for (var y = 4; y < 7; y++) {
                const index = $scope.newReward.applicableDays.indexOf(y);
                if (index > -1) {
                    $scope.newReward.applicableDays.splice(index, 1);
                    $('#'+y).css('background', '#fff');
                    $('#'+y).css('color', '#2e6da4');
                }
            }
        }
    };

    // Check the day of the week
    $scope.day = function (x) {
        if ($scope.newReward.applicableDays.indexOf(x) == -1) {
            $scope.newReward.applicableDays.push(x);
            $('#'+x).css('background', '#2e6da4');
            $('#'+x).css('color', '#fff');
        } else {
            $scope.newReward.applicableDays.splice($scope.newReward.applicableDays.indexOf(x), 1);
            $('#'+x).css('background', '#fff');
            $('#'+x).css('color', '#2e6da4');
        }
    };

    /**
     * Submit form for a new Reward
     */
    $scope.createReward = function (reward) {
        RewardsService.create(reward).then(function (result) {
            if (result.status === 200) {
                $location.url('/');
            } else if (result.status === 500) {
                $alert({
                    'title' : errTitle,
                    'content' : errMsg,
                    'type' : 'danger',
                    'duration' : 5,
                    'placement' : 'top-right',
                    'show' : true
                });
            } else {
                showError(errTitle, errMsg);
            }
        }).catch(function (err) {
            showError(errTitle, errMsg);
        })
    };

    $scope.updateReward = function (reward) {
        RewardsService.update(reward._id, reward).then(function(response) {
            console.log(response);
        }).catch(function(error) {
            console.log(error);
        });
    };

    /**
     * Load a reward or route to reward page
     */
    $scope.loadReward = function (id) {

        if (id === undefined) {
            const _id = $location.search().id;
            RewardsService.getReward(_id).then(function (result) {
                if (result.status === 200) {
                    $scope.reward = result.data;
                } else {
                    showError(errTitle, errMsg);
                }
            }).catch();
        } else {
            $location.url('/reward?id=' + id);
        }

    };

    /**
     * Load rewards for home screen
     */
    $scope.loadRewards = function () {
        RewardsService.getMerchRewards().then(function (result) {
            if (result.status === 200) {
                $scope.rewards = result.data;
                $scope.inactiveRewards = $scope.rewards.filter(function (reward) {
                    if (reward.isActive === false) {
                        return reward;
                    } else {
                        $scope.activeRewards.push(reward);
                    }
                });
            } else if (result.status === 500) {
                showError(errTitle, errMsg);
            } else {
                showError(errTitle, result.data.message);
            }
        }).catch(function (err) {
            showError(errTitle, errMsg);
        });
    }

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