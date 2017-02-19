var pa = angular.module("parking-app", ['ngRoute', '720kb.datepicker']);

pa.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider

         .when('/', {
            templateUrl: 'partials/home.html',
            controller: 'HomeCtrl'
        })

        .when('/signup', {
            templateUrl: 'partials/signup.html',
            controller: 'NewuserCtrl'
        })

            .when('/login', {
                templateUrl: 'partials/login.html',
                controller: 'LoginCtrl'
            })

            .when('/dashboard', {
                templateUrl: 'partials/dashboard.html',
                controller: 'DashboardCtrl'
            })

            .when('/reserve', {
                templateUrl: 'partials/reserve.html',
                controller: 'ReservationCtrl'
            })

            .when('/details/:id', {
                templateUrl: 'partials/details.html',
                controller: 'DetailsCtrl'
            })

            .when('/logout', {
                templateUrl: 'partials/logout.html',
                controller: 'LogoutCtrl'
            })

         .otherwise({
            redirectTo: '/'
        });
}]);

pa.controller("HomeCtrl", function($scope) {
    //
})

pa.controller("NewuserCtrl", function($scope, $http, $window) {
    $scope.register = function(user) {
        $http({
            method: 'POST',
            url: 'http://localhost:7066/services/register',
            data: JSON.stringify(user)
        }).success(function(data){
            if(data.status=="ok") {
                $window.location.href = '#/login';
            }
        })
    }

    $scope.checkUsername = function(username) {
        $scope.username_status = false;
        $http({
            method: 'POST',
            url: 'http://localhost:7066/services/username',
            data: JSON.stringify({id: username}),
        }).success(function(data) {
            if(data.status == "found") {
                $scope.username_status = true;
            }
            else{
                $scope.username_status = false;
            }
        })
    }
})

pa.controller("LoginCtrl", function($scope, $http, $window) {
    $scope.init = function() {
        $scope.firstname = sessionStorage.getItem('firstname');
        $scope.lastname = sessionStorage.getItem('lastname');
        $scope.username = sessionStorage.getItem('username');
        $scope.paAuthToken = sessionStorage.getItem('paAuthToken');
        if($scope.firstname && $scope.lastname && $scope.username && $scope.paAuthToken) {
            $window.location.href='#/dashboard';
        }
    }

    $scope.login = function(user) {
        $http({
            method: 'POST',
            url: 'http://localhost:7066/services/login',
            data: JSON.stringify(user)
        }).success(function(data) {
            if(data.status=="ok") {
                sessionStorage.setItem('paAuthToken', data.token);
                sessionStorage.setItem('username', data.username);
                sessionStorage.setItem('firstname', data.firstname);
                sessionStorage.setItem('lastname', data.lastname);
                sessionStorage.setItem('email', data.email);
                $window.location.href = '#/dashboard';
            } else {
                $scope.message = "Login Failed! Please try again!";
            }
        })
    }
})

pa.controller("DashboardCtrl", function($scope, $http, $window) {
    $scope.paAuthToken = "";

    $scope.init = function() {
        $scope.firstname = sessionStorage.getItem('firstname');
        $scope.lastname = sessionStorage.getItem('lastname');
        $scope.username = sessionStorage.getItem('username');
        $scope.paAuthToken = sessionStorage.getItem('paAuthToken');
        if($scope.firstname && $scope.lastname && $scope.username && $scope.paAuthToken) {
            $http({
                method: 'POST',
                url: 'http://localhost:7066/services/history',
                data: JSON.stringify({username: $scope.username}),
                headers : {
                    Authorization: "Bearer "+$scope.paAuthToken
                }
            }).success(function(data) {
                $scope.history = data;

            })
        } else {
            $window.location.href='#/';
        }
    }

    $scope.cancelReservation = function(id) {
        $http({
            method: 'GET',
            url: 'http://localhost:7066/services/cancel/'+id,
            headers : {
                Authorization: "Bearer "+$scope.paAuthToken
            }
        }).success(function(data) {
            $scope.history = data;
        })
    }
})

pa.controller("ReservationCtrl", function($scope, $http, $window) {
    $scope.id = "";
    $scope.price = "";

    $scope.init = function() {
        $scope.firstname = sessionStorage.getItem('firstname');
        $scope.lastname = sessionStorage.getItem('lastname');
        $scope.username = sessionStorage.getItem('username');
        $scope.email = sessionStorage.getItem('email');
        $scope.paAuthToken = sessionStorage.getItem('paAuthToken');
        if($scope.firstname && $scope.lastname && $scope.username && $scope.paAuthToken) {
            $http({
                method: 'GET',
                url: 'http://localhost:7066/services/listing',
                headers : {
                    Authorization: "Bearer "+$scope.paAuthToken
                }
            }).success(function(data) {
                $scope.lots = data;

            })
        } else {
            $window.location.href='#/';
        }
    }
        $scope.sel_parking = "Select a parking lot from left pane";
        $scope.showMap = function(name, id, price) {
        $scope.sel_parking = name;
        $scope.id = id;
        $scope.price = price;
    }

    $scope.reserve = function(formdata) {
        if($scope.id) {
            var amount_paid = formdata.numberOfDays * $scope.price;
         $http({
                method: 'POST',
                url: 'http://localhost:7066/services/reserve',
                data: {lot_id: $scope.id, email: $scope.email, username: $scope.username, amount_paid: amount_paid, numberOfDays: formdata.numberOfDays, start_date: formdata.start_date, end_date: formdata.end_date},
                headers : {
                    Authorization: "Bearer "+$scope.paAuthToken
                }
            }).success(function(data) {
                $window.location.href = '#/dashboard';
            })
        } else {
            alert("Please select a lot!");
        }
    }


});

pa.controller("DetailsCtrl", function($scope, $http, $window, $routeParams) {
    $scope.init = function() {
        $scope.firstname = sessionStorage.getItem('firstname');
        $scope.lastname = sessionStorage.getItem('lastname');
        $scope.username = sessionStorage.getItem('username');
        $scope.paAuthToken = sessionStorage.getItem('paAuthToken');
        if($scope.firstname && $scope.lastname && $scope.username && $scope.paAuthToken) {
            $http({
                method: 'GET',
                url: 'http://localhost:7066/services/details/'+$routeParams.id,
                headers : {
                    Authorization: "Bearer "+$scope.paAuthToken
                }
            }).success(function(data) {
                $scope.details = data;

            })
        } else {
            $window.location.href = '#/';
        }
    }
})

pa.controller("LogoutCtrl", function($scope, $window) {
    sessionStorage.removeItem('paAuthToken');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('firstname');
    sessionStorage.removeItem('lastname');
    $window.location.href = '#/';
})