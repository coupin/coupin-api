angular.module('merchappRoutes', []).config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider
    .otherwise({
        templateUrl: '/views/merchantHome.html',
        controller: 'MerchantController'
    });

    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
}]);