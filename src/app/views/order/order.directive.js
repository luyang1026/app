'use strict';
(function () {
    var app = angular.module('swalk.order');
    app.directive('swalkOrderList', function () {
        return {
            restrict: 'E',
            scope: {},
            replace: true,
            controller: function controller($http, config, $scope, $filter, $timeout, alertOrConfirm, typeConversion, $modal, $rootScope) {
                $scope.orderNo = '';
                $scope.contactsName = '';
                $scope.contactsPhone = '';
                $scope.orderStatus = '1000';
                //分页
                $scope.paginationConf = {
                    itemsPerPage: 10,
                    totalItems: -1, //设置一个初始总条数，判断加载状态
                    onChange: function () {
                        load();
                    }
                };
                $scope.startDate = new Date();
                $scope.endDate = new Date();
                var load = function () {
                    $http({
                        method: "GET",
                        url: config.urlBase + '/user/order/list',
                        params: {
                            offset: ($scope.paginationConf.currentPage - 1) * $scope.paginationConf.itemsPerPage || 0,
                            limit: $scope.paginationConf.itemsPerPage,
                            orderNo: $scope.orderNo,
                            isOnline: $scope.isOnline,
                            status: $scope.status,
                            contactsName: $scope.contactsName,
                            contactsPhone: $scope.contactsPhone
                        }
                    }).then(function (data) {
                        window.localStorage.newHouseOrder = false;
                        $scope.paginationConf.totalItems = data.data.count;
                        $scope.orderList = data.data.list;
                        if (data.data.list != null) {
                            $scope.orderList.forEach(function (r) {
                                r.refuse = function () {
                                    var refuseFun = function () {
                                        $http({
                                            method: "POST",
                                            url: config.urlBase + "/user/order/refuse",
                                            params: {id: r.id}
                                        }).then(function (result) {
                                            if (result.data.status == 200) {
                                                alertOrConfirm.successAlert("拒单成功！请关注退款状态");
                                                load();
                                            } else {
                                                alertOrConfirm.failAlert("拒单失败!");
                                                load();
                                            }
                                        }, function (){
                                            alertOrConfirm.failAlert("拒单失败!");
                                            load();
                                        });
                                    };
                                    alertOrConfirm.confirm("您确定要拒单吗？", refuseFun);
                                };
                                r.cancel = function () {
                                    var cancelFun = function () {
                                        $http({
                                            method: "POST",
                                            url: config.urlBase + "/user/order/cancel",
                                            params: {id: r.id}
                                        }).then(function (result) {
                                            if (result.data.status == 200) {
                                                alertOrConfirm.successAlert("取消订单成功！");
                                                load();
                                            } else {
                                                alertOrConfirm.failAlert("取消订单失败!");
                                                load();
                                            }
                                        }, function () {
                                            alertOrConfirm.failAlert("取消订单失败！");
                                            load();
                                        });
                                    };
                                    alertOrConfirm.confirm("您确定要取消该订单吗？", cancelFun);
                                };
                                r.wordExport = function () {
                                    return config.urlBase + "/user/order/wordExport?id=" + r.id;
                                };
                                r.blur = function () {
                                    if (r.thirdPartNo != null && r.thirdPartNo != r.oldThirdPartNo) {
                                        var blurFun = function () {
                                            $http({
                                                method: "POST",
                                                url: config.urlBase + "/user/order/updateThirdPartNo",
                                                params: {
                                                    id: r.id,
                                                    thirdPartNo: r.thirdPartNo
                                                }
                                            }).then(function (data) {
                                                if (data.data.status == 200) {
                                                    alertOrConfirm.successAlert("修改成功！");
                                                } else {
                                                    alertOrConfirm.failAlert(data.data.msg);
                                                }
                                                load();
                                            });
                                        };
                                        alertOrConfirm.confirm("您确定要保存该修改吗？", blurFun, load);
                                    }
                                    if (r.thirdPartNo == null) {
                                        load();
                                    }
                                };
                            });
                        }
                    });
                };
                //$scope.getData = load;
                $scope.excelExport = function () {
                    window.open(config.urlBase + "/user/order/excelExport?startDate=" + $filter('date')($scope.startDate, 'yyyy-MM-dd') + "&endDate=" + $filter('date')($scope.endDate, 'yyyy-MM-dd'), '_parent', '');
                };
                $scope.excelExportUrl = function () {
                    return config.urlBase + "/user/order/excelExport?startDate=" + $filter('date')($scope.startDate, 'yyyy-MM-dd') + "&endDate=" + $filter('date')($scope.endDate, 'yyyy-MM-dd');
                };
                $scope.reset = function () {
                    $scope.orderNo = '';
                    $scope.orderName = '';
                    $scope.orderPhone = '';
                    $scope.orderStatus = '1000';
                    $scope.status = '';
                    $scope.searchInfo = false;
                    $scope.contactsName = '';
                    $scope.contactsPhone = '';
                    $scope.paginationConf.onChange();
                };
                $scope.search = function () {
                    $scope.orderNoBackup = angular.copy($scope.orderNo);
                    $scope.contactsNameBackup = angular.copy($scope.contactsName);
                    $scope.contactsPhoneBackup = angular.copy($scope.contactsPhone);
                    if ($scope.orderStatus.indexOf("线上") > -1) {
                        $scope.isOnline = 1;
                    } else if ($scope.orderStatus.indexOf("线下") > -1) {
                        $scope.isOnline = 0;
                    } else {
                        $scope.isOnline = '';
                    }
                    if ($scope.orderStatus.indexOf("已支付") > -1) {
                        $scope.status = 2;
                    } else if ($scope.orderStatus.indexOf("未支付") > -1) {
                        $scope.status = 1;
                    } else if ($scope.orderStatus.indexOf("已取消") > -1) {
                        $scope.status = -2;
                    } else if ($scope.orderStatus.indexOf("已完成") > -1) {
                        $scope.status = 3;
                    } else if ($scope.orderStatus.indexOf("取消") > -1) {
                        $scope.status = -1;
                    } else {
                        $scope.status = '';
                    }
                    if (!$scope.orderNo && !$scope.contactsName && !$scope.contactsPhone && $scope.orderStatus == "1000") {
                        $scope.searchInfo = false;
                        $scope.paginationConf.onChange();
                    } else {
                        $scope.searchInfo = true;
                        $scope.paginationConf.onChange();
                    }
                };

                if(window.localStorage.newHouseOrder == 1){
                    $scope.orderStatus = '取消';
                    $scope.status = -1;
                    load();
                }

                $scope.print = function(order){
                    if($scope.doubleClick){
                        return;
                    }
                    $scope.doubleClick = true;

                    $http({
                        method: 'POST',
                        url: config.urlBase + '/user/order/printDetail',
                        params: {
                            id: order.id
                        }
                    }).then(function(result){
                        console.log(result);
                        window.localStorage.orderNo = result.data.data.orderNO;
                        window.localStorage.contactsName = result.data.data.contactsName;
                        window.localStorage.dates = result.data.data.dates;
                        window.localStorage.houseName = result.data.data.houseName;
                        window.localStorage.name = result.data.data.name;
                        window.localStorage.payType = result.data.data.payType;
                        window.localStorage.priceList = result.data.data.priceList;
                        window.localStorage.contactsPhone = result.data.data.contactsPhone;
                        window.localStorage.isBack = result.data.data.isBack;
                        window.localStorage.number = result.data.data.number;
                        window.localStorage.status = result.data.data.status;
                        window.localStorage.thirdPartNo = result.data.data.thirdPartNo;

                        $scope.doubleClick = false;
                        $rootScope.modal = $modal.open({
                            templateUrl: 'app/views/order/order.print.html',
                            backdrop: 'static',
                            keyboard: false,
                            controller: function ($scope){
                                $scope.closeModal = function(){
                                    $scope.modal.close();
                                };
                            }
                        });
                    },function(){
                        alertOrConfirm.failAlert("读取数据失败，请稍后重试")
                    });

                }
            },
            link: function () {
            },
            templateUrl: 'app/views/order/order.list.html',
            controllerAs: 'ctrl',
            bindToController: true
        };
    });
})();
