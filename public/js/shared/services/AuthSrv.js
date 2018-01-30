angular.module('AuthSrv', []).factory('AuthService', function($http) {
  return {
    signupM: function(details) {
      return $http.post('/auth/signin/m', details);
    }
  };
});