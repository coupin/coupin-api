angular.module('RewardsSrv', ['ngCookies']).factory('RewardsService', [
    '$http',
    'CookieService',
    function (
        $http,
        CookieService
    ) {
        var token = CookieService.getToken();
        var authHeader = {
            'x-access-token': token
        };

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
            delete: function (id) {
                return $http.post('/reward/' + id);
            },
            getMerchRewards: function (details) {
                return $http({
                    method: 'GET',
                    url: '/reward',
                    params: details,
                    headers: authHeader
                });
            },
            getReward: function (id) {
                return $http.get('/reward/' + id);
            },
            update: function(id, details) {
                return $http.put('/reward/' + id, details);
            }
        }
    }
]);