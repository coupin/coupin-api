angular.module('CookieSrv', []).factory('CookieService', [
  '$cookies', function(
    $cookies
  ) {
    return {
      clearToken: function() {
        $cookies.remove('ctk');
      },
      clearUser: function() {
        $cookies.remove('user');
      },
      getToken: function() {
        return $cookies.get('ctk');
      },
      getUser: function() {
        return $cookies.get('user');
      },
      isLoggedIn: function() {
        return angular.isDefined($cookies.get('ctk'));
      },
      setToken: function(token) {
        $cookies.put('ctk', token);
      },
      setUser: function(user) {
        $cookies.put('user', user);
      }
    };
  }]);