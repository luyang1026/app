'use strict';
(function () {
    var app = angular.module('swalk.productTravel');
    app.directive('swalkProductTravelList', function () {
        return {
            restrict: 'E',
            scope: {},
            replace: true,
            controller: function controller($http, config, $scope, $modal, $rootScope,$state, categoryListService,
                                            FileUploader, $cookies, $timeout, alertOrConfirm) {
                //初始化搜索条件
                $scope.searchVal = null;
                //分页
                $scope.paginationConf = {
                    itemsPerPage: 10,
                    totalItems: -1, //设置一个初始总条数，判断加载状态
                    onChange: function () {
                        load();
                    }
                };

                var load = function(){
                    $http({
                        method: "GET",
                        url: config.urlBase + "/user/productTravel/list",
                        params: {
                            offset: ($scope.paginationConf.currentPage-1)*$scope.paginationConf.itemsPerPage,
                            limit: $scope.paginationConf.itemsPerPage,
                            name: $scope.searchVal
                        }
                    }).success(function (data) {
                        $scope.paginationConf.totalItems = data.count;
                        $scope.sellerProductList = data.list;

                        //上架或者下架
                        var pullOrPushFun = function (scope,id,statu,r) {
                            $http({
                                method: 'GET',
                                url: config.urlBase + '/user/productTravel/updateRelease/' + id + '/' + statu
                            }).success(function(){
                                var statusText = statu == 1 ? "上架成功" : "下架成功";
                                r.status = statu == 1 ? '已上架' : '已下架';
                                r.releaseStatus = statu == 1 ? 1 : 2;
                                alertOrConfirm.successAlert(statusText);
                            })
                        };
                        if(data.list != null) {
                            $scope.sellerProductList.forEach(function (r) {
                                //判断产品状态
                                r.releaseStatus == 1 ? r.status = '已上架' : r.releaseStatus == 2 ? r.status = '已下架' : r.releaseStatus == 3 ? r.status = '未发布' : r.status = '未发布';
                                //编辑
                                r.detail = function () {
                                    $rootScope.sellerProductInfo = r;
                                    $rootScope.sellerProductButton = 'MD_detail';
                                    $state.go('user',{menu: 'productTravel',submenu: 'info'});
                                };
                                //修改
                                r.modify = function () {
                                    $rootScope.sellerProductInfo = r;
                                    $rootScope.sellerProductButton = 'MD_modify';
                                    $state.go('user',{menu: 'productTravel',submenu: 'info'});
                                };
                                //上架
                                r.push = function() {
                                    pullOrPushFun($scope, r.id,1,r);
                                };
                                r.pull = function () {
                                    pullOrPushFun($scope, r.id,2,r);
                                }
                            })
                        }

                    });

                };
                //新增
                $scope.add = function (){
                    $rootScope.sellerProductInfo = null;
                    $rootScope.sellerProductButton = '';
                    $state.go('user',{menu: 'productTravel',submenu: 'info'});
                };
                //查询
                $scope.search = function () {
                    $scope.searchValBackup = angular.copy($scope.searchVal);
                    if(!$scope.searchVal){
                        $scope.searchInfo = false;
                        load();
                    }else{
                        $scope.searchInfo = true;
                        load();
                    }
                };
                $scope.reset = function(){
                    $scope.searchVal = '';
                    $scope.searchInfo = false;
                    load();
                };
            },
            link: function () {
            },
            templateUrl: 'app/views/productTravel/productTravel.list.html',
            controllerAs: 'ctrl',
            bindToController: true
        };
    });
})();
