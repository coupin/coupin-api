angular.module('HomeCtrl', []).controller('HomeController', function(
  $scope,
  CookieService,
  RewardsService
) {
  $scope.user = CookieService.getUser();
  $scope.rewards = [];

  /**
   * Change status of a reward
   * @param {*} index 
   * @param {*} isActive 
   * @param {*} tab 
   */
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

  /**
   * Go to rewards
   * @param {rewardId} id 
   */
  $scope.goToReward = function(id) {
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
   * Edit Reward
   * @param {rewardId} id 
   */
  $scope.goToEditReward = function(id) {
    $location.url('/merchant/rewards?id=' + id);
  };

  /**
   * Load a reward or route to reward page
   */
  $scope.loadRewards = function () {
    var details = {};

    if (angular.isDefined($scope.query)) {
      details['query'] = $scope.query;
    }

    RewardsService.getMerchRewards(details).then(function (result) {
      $scope.rewards = result.data;
    }).catch(function (err) {
        console.log(err);
        // showError(errTitle, errMsg);

    });
  };
});