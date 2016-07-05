'use strict';
(function () {
    var app = angular.module('swalk.providerTravel');
    app.directive('swalkProviderTravel', function () {
        return {
            restrict: 'E',
            scope: {},
            replace: true,
            controller: function controller($rootScope, config, $scope, $http, $stateParams, $modal, alertOrConfirm) {
                $scope.reset = function(){
                    $scope.searchVal = '';
                    $scope.searchInfo = false;
                    load();
                };
                //初始化搜索名
                $scope.searchVal = null;
                $scope.seller = {
                    id: null,
                    name: null,
                    contact: null,
                    phone: null
                };
                //分页
                $scope.paginationConf = {
                    itemsPerPage: 10,
                    totalItems: -1, //设置一个初始总条数，判断加载状态
                    onChange: function () {
                        load();
                    }
                };
                //初始化商户类
                $scope.productTravel = {
                    id: null,
                    name: null,
                    contact: null,
                    phone: null
                };
                var saveFun = function (scope) {
                    $scope.enableClick = true;
                    $http({
                        method: "POST",
                        url: config.urlBase + "/user/providerTravel/save",
                        data: scope.productTravel
                    }).then(function (result) {
                        if (result.data.status == 200) {
                            alertOrConfirm.successAlert("保存成功");
                            $rootScope.modal.close();
                            load();
                        } else if (result.data.status == 1000) {
                            alertOrConfirm.failAlert("保存失败，数据格式错误！");
                        } else {
                            alertOrConfirm.failAlert("保存失败");
                        }
                        $scope.enableClick = false;
                    }, function () {
                        alertOrConfirm.failAlert("保存失败");
                        $scope.enableClick = false;
                    })
                };

                var load = function () {
                    $http({
                        method: "GET",
                        url: config.urlBase + "/user/providerTravel/list",
                        params: {
                            offset: ($scope.paginationConf.currentPage - 1) * $scope.paginationConf.itemsPerPage,
                            limit: $scope.paginationConf.itemsPerPage,
                            name: $scope.searchVal
                        }
                    }).success(function (result) {
                        $scope.sellerList = result.list;
                        $scope.paginationConf.totalItems = result.count;
                        if (result.list != null) {
                            $scope.sellerList.forEach(function (r) {
                                r.detail = function (flag) {
                                    $rootScope.modal = $modal.open({
                                        templateUrl: 'app/views/providerTravel/providerTravel.card.html',
                                        backdrop: 'static',
                                        keyboard: false,
                                        controller: function ($scope) {
                                            $scope.seller = r;
                                            $scope.isRead = true;
                                            $scope.enableClick = true;

                                            $scope.closeModal = function () {
                                                $scope.modal.close();
                                            };

                                            if (flag == 1) {
                                                $scope.isRead = false;

                                            }
                                            $scope.save = function () {
                                                $scope.productTravel = {
                                                    id: r.id,
                                                    name: r.name,
                                                    contact: r.contact,
                                                    phone: r.phone
                                                };
                                                saveFun($scope)
                                            }
                                        }
                                    });
                                };
                                r.delete = function () {
                                    var deleteFun = function () {
                                        $http({
                                            method: "GET",
                                            url: config.urlBase + "/user/providerTravel/delete/" + r.id
                                        }).then(function (result) {
                                            if (result.data.status == 200) {
                                                alertOrConfirm.successAlert("删除成功");
                                                load();
                                            } else {
                                                alertOrConfirm.failAlert("删除失败");
                                            }
                                        }, function () {
                                            alertOrConfirm.failAlert("删除失败");
                                        });
                                    };
                                    alertOrConfirm.deleteConfirm(deleteFun);
                                }
                            });
                        }
                    });

                };

                $scope.add = function () {
                    $rootScope.modal = $modal.open({
                        templateUrl: 'app/views/providerTravel/providerTravel.card.html',
                        backdrop: 'static',
                        keyboard: false,
                        controller: function ($scope) {
                            $scope.saveSuccess = false;
                            $scope.saveFail = false;
                            $scope.enableClick = true;

                            //关闭
                            $scope.closeModal = function () {
                                $scope.modal.close();
                            };

                            $scope.save = function () {
                                $scope.productTravel = {
                                    id: null,
                                    name: $scope.seller.name,
                                    contact: $scope.seller.contact,
                                    phone: $scope.seller.phone
                                };
                                saveFun($scope);
                            }

                        }
                    });
                };

                //查询
                $scope.search = (function () {
                    $scope.searchValBackup = angular.copy($scope.searchVal);
                    if(!$scope.searchVal){
                        $scope.searchInfo = false;
                        load();
                    }else{
                        $scope.searchInfo = true;
                        load();
                    }
                });
            },
            link: function () {
            },
            templateUrl: 'app/views/providerTravel/providerTravel.list.html',
            controllerAs: 'ctrl',
            bindToController: true
        };
    });
})();
