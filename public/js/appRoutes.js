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
        .when('/newMerch', {
            templateUrl: 'views/newMerch.html',
            controller: 'AdminMerchantController'
        })
        .when('/viewAdmin', {
            templateUrl: 'views/viewAdmin.html',
            controller: 'SuperAdminController'
        })
        .when('/viewMerch', {
            templateUrl: 'views/viewMerch.html',
            controller: 'AdminMerchantController'
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
            enabled: false,
            requireBase: false
        });
}])