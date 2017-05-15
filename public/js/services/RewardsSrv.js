angular.module('RewardsSrv', []).factory('RewardsService', ['$http', function ($http) {
    return {
        activate: function (id) {
            return $http.post('/reward/activate/' + id);
        },
        create: function (details) {
            return $http.post('/reward', details);
        },
        deactivate: function (id) {
            return $http.post('/reward/deactivate/' + id);
        },
        getMerchRewards: function () {
            return $http.get('/reward/merchant/');
        },
        getReward: function (id) {
            return $http.get('/reward/get/' + id);
        }
    }
}]);