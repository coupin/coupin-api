angular.module('merchappRoutes', []).config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider
    .when('/merchant/home', {
        templateUrl: '/views/merchant/home.html',
        controller: 'RewardsController'
    })
    .when('/merchant/rewards', {
        templateUrl: '/views/merchant/rewards.html',
        controller: 'RewardsController'
    })
    .otherwise({
        templateUrl: '/views/merchant/home.html',
        controller: 'RewardsController'
    });

    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
}]);