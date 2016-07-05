/**
 * Created by zhangjiayu on 2016/3/24.
 *
 */
'use strict';
(function(){
    var app = angular.module('swalk.city');
    app.directive('swalkCityList', function () {
        return {
            restrict: 'E',
            scope: {},
            replace: true,
            controller: function controller($rootScope, $scope, $http, $timeout, $stateParams, $modal, config, alertOrConfirm){
                //初始化搜索结果提示条
                $scope.searchInfo = false;
                //分页
                $scope.paginationConf = {
                    itemsPerPage: 10,
                    totalItems: -1, //设置一个初始总条数，判断加载状态
                    onChange: function () {
                        load();
                    }
                };
                $scope.searchVal = '';

                $scope.search = function(){
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
                var load = function(){
                    $http({
                        method: 'GET',
                        url: config.urlBase + '/user/cityMenu/list',
                        params: {
                            name: $scope.searchVal,
                            offset: ($scope.paginationConf.currentPage - 1) * $scope.paginationConf.itemsPerPage,
                            limit: $scope.paginationConf.itemsPerPage
                        }
                    }).success(function(data){
                        $scope.cityList = data.list;
                        $scope.paginationConf.totalItems = data.count;
                        if(data.list !== null) {
                            $scope.cityList.forEach(function(r){
                                r.detail = function (flag){
                                    $rootScope.modal = $modal.open({
                                        templateUrl: 'app/views/city/city.card.html',
                                        backdrop: 'static',
                                        keyboard: false,
                                        controller: function ($scope){
                                            $scope.city = r;
                                            $scope.isRead = true;
                                            $scope.closeModal = function () {
                                                $scope.modal.close();
                                            };

                                            if(flag == 1){
                                                $scope.isRead = false;

                                            }

                                            $scope.save = function(){
                                                saveFun($scope, r.id)
                                            };
                                            $scope.closeModal = function(){
                                                $scope.modal.close();
                                            };
                                        }
                                    });
                                };
                                var delFun = function(){
                                    $http({
                                        method: "GET",
                                        url: config.urlBase + "/user/cityMenu/delete",
                                        params: {
                                            id: r.id
                                        }
                                    }).then(function(){
                                        alertOrConfirm.successAlert("删除成功!");
                                        load();
                                    },function(){
                                        alertOrConfirm.failAlert("删除失败!");
                                        load();
                                    });
                                };
                                r.delete = function () {
                                    alertOrConfirm.deleteConfirm(delFun)
                                }
                            });
                        }

                    });
                };

                var saveFun = function(scope,flag){
                    scope.enableClick = true;
                    flag == undefined ? flag = null : flag = flag;
                    $http({
                        method: 'POST',
                        url: config.urlBase + '/user/cityMenu/save',
                        data: {
                            id: flag,
                            name: scope.city.name,
                            pinyin: scope.city.pinyin
                        }
                    }).then(function (result){
                        if(result.data.status == 200) {
                            scope.saveSuccess = true;
                            scope.saveFail = false;
                            scope.modal.close();
                            load();
                        }else if (result.data.status == 1000){
                            alertOrConfirm.failAlert("保存失败,数据格式错误");
                            scope.saveSuccess = false;
                            scope.saveFail = true;
                        } else {
                            alertOrConfirm.failAlert("保存失败");
                            scope.saveSuccess = false;
                            scope.saveFail = true;
                        }
                        $timeout(function(){
                            scope.enableClick = false;
                        },500);
                    },function(){
                        alertOrConfirm.failAlert("保存失败");
                        scope.saveSuccess = false;
                        scope.saveFail = true;
                        scope.enableClick = false;
                    })
                };

                $scope.add = function(){
                    $rootScope.modal = $modal.open({
                        templateUrl: 'app/views/city/city.card.html',
                        backdrop: 'static',
                        keyboard: false,
                        controller: function ($scope){
                            $scope.saveSuccess = false;
                            $scope.saveFail = false;

                            $scope.save = function(){
                                saveFun($scope);
                            };

                            $scope.closeModal = function(){
                                $scope.modal.close();
                            };
                        }
                    });
                }

            },
            link: function (){},
            templateUrl: 'app/views/city/city.list.html',
            controllerAs: 'ctrl',
            bindToController: true
        }
    });
})();