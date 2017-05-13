angular.module('RewardsSrv', []).factory('RewardsService', ['$http', function ($http) {
    return {
        create: function (details) {
            return $http.post('/reward', details);
        },
        getMerchRewards: function () {
            return $http.get('/reward/merchant/');
        }
    }
}]);