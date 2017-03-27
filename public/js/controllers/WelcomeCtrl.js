angular.module('WelcomeCtrl', []).controller('WelcomeController', function($scope) {
    $scope.tagline = 'Welcome';
    $scope.modal = {
        'title': "Title",
        'content': "This is just us testing" 
    };
});