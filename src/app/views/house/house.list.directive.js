'use strict';
(function() {
    var app = angular.module('swalk.house.list');
    app.directive('swalkHouseList', function () {
        return {
            restrict: 'E',
            scope: {},
            replace: true,
            controller: function($rootScope, config, $scope, $http, $stateParams, $modal, $timeout, $state) {
                var pageChanged = function () {
                    $http({
                        method: "GET",
                        url: config.urlBase + "/user/house/list",
                        params: {
                            offset: ($scope.paginationConf.currentPage-1)*$scope.paginationConf.itemsPerPage,
                            limit: $scope.paginationConf.itemsPerPage,
                            houseName: $scope.houseName
                            //TODO noticeType:$('#noticeType option:selected').val()
                        }
                    }).success(function (data) {
                        $scope.paginationConf.totalItems = data.count;
                        $scope.houseList = data.list;
                        if($scope.houseList != null) {
                            $scope.houseList.forEach(function (r) {
                                r.detail = function () {
                                    $rootScope.houseInfo = r;
                                    $rootScope.houseButton = 'MD_detail';
                                    $state.go('user',{menu: 'house',submenu: 'info'});
                                };

                                r.modify = function () {
                                    $rootScope.houseInfo = r;
                                    $rootScope.houseButton = 'MD_modify';
                                    $state.go('user',{menu: 'house',submenu: 'info'});
                                };
                            })
                        }
                    });

                };

                //分页
                $scope.paginationConf = {
                    itemsPerPage: 10,
                    totalItems: -1, //设置一个初始总条数，判断加载状态
                    onChange: function () {
                        pageChanged();
                    }
                };

                //新增按钮
                $scope.addHouse = function(){
                    $rootScope.houseInfo = null;
                    $rootScope.houseButton = 'add';
                    $state.go('user',{menu: 'house',submenu: 'info'});
                };

                $scope.pageChanged = function() {
                    pageChanged();
                };
                $scope.reset = function(){
                    $scope.houseName = '';
                    $scope.searchInfo = false;
                    pageChanged();
                };
                $scope.getData = function () {
                    $scope.searchValBackup = angular.copy($scope.houseName);
                    if(!$scope.houseName){
                        $scope.searchInfo = false;
                        pageChanged();
                    }else{
                        $scope.searchInfo = true;
                        pageChanged();
                    }
                };

            },
            link: function () {
            },
            templateUrl : 'app/views/house/house.list.html',
            controllerAs : 'ctrl',
            bindToController : true
        };
    });
})();