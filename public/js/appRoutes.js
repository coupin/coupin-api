angular.module('appRoutes', []).config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider
    // Home Page
        .when('/', {
            templateUrl: 'views/home.html',
            controller: 'MainController'
        })
        // locations page that will use the location controller
        .when('/addAdmin', {
            templateUrl: 'views/addAdmin.html',
            controller: 'AdminController'
        })
        .when('/viewAdmin', {
            templateUrl: 'views/viewAdmin.html',
            controller: 'SuperAdminController'
        })
        .when('/viewRequests', {
            templateUrl: 'views/viewRequests.html',
            controller: 'RequestController'
        })
        .otherwise({
            templateUrl: 'views/home.html',
            controller: 'MainController'
        });

        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });
}])