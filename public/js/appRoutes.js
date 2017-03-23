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
        }).otherwise({
            templateUrl: 'views/welcome.html',
            controller: 'WelcomeController'
        });;

        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        })
}])