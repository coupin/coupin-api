angular.module('merchappRoutes', []).config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider
    .when('/home', {
        templateUrl: '/views/merchant/home.html',
        controller: 'HomeController'
    })
    .when('/merchant/rewards', {
        templateUrl: '/views/merchant/rewards.html',
        controller: 'RewardsController'
    })
    .when('/profile', {
        templateUrl: '/views/merchant/profile.html',
        controller: 'BaseMController'
    })
    .when('/reward', {
        templateUrl: '/views/merchant/view.html',
        controller: 'RewardsController'
    })
    .otherwise({
        templateUrl: '/views/merchant/home.html',
        controller: 'HomeController'
    });

    $locationProvider.html5Mode({
        enabled: false,
        requireBase: false
    });
}]);