angular.module('appRoutes', []).config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider
    // Home Page
        .when('/', {
            templateUrl: 'views/home.html',
            controller: 'MainController'
        })
        // locations page that will use the location controller
        .when('/locations', {
            templateUrl: 'views/locations.html',
            controller: 'LocationController'
        });

        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });
}])