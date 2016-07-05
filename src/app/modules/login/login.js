'use strict';

(function () {
    angular.module('ly.login', [])
        .controller('forum.login.controller',function($scope,$state,loginApi){

            $scope.name = '';
            $scope.password = '';
            $scope.login=function(){
                    $state.go('forum.main')
              
            }
        })
})();