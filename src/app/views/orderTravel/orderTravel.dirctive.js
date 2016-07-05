'use strict';
(function () {
    var app = angular.module('swalk.orderTravel');
    app.directive('swalkOrderTravelList', function () {
        return {
            restrict: 'E',
            scope: {},
            replace: true,
            controller: function controller($http, $filter, config, $scope, $modal, $rootScope, $state, $timeout, alertOrConfirm) {

                //初始化搜索条件
                $scope.orderNo = '';
                $scope.contactsName = '';
                $scope.contactsPhone = '';
                $scope.orderStatus = '';
                $scope.startDate = new Date();
                $scope.endDate = new Date();
                //分页
                $scope.paginationConf = {
                    itemsPerPage: 10,
                    totalItems: -1, //设置一个初始总条数，判断加载状态
                    onChange: function () {
                        load();
                    }
                };
                $scope.reset = function () {
                    $scope.orderNo = '';
                    $scope.searchInfo = false;
                    $scope.contactsName = '';
                    $scope.contactsPhone = '';
                    $scope.orderStatus = '';
                    load();
                };
                $scope.excelExportUrl = function () {
                    return config.urlBase + "/user/ordertravel/excelExport?startDate=" + $filter('date')($scope.startDate, 'yyyy-MM-dd') + "&endDate=" + $filter('date')($scope.endDate, 'yyyy-MM-dd');
                };
                var load = function () {
                    $http({
                        method: "GET",
                        url: config.urlBase + "/user/ordertravel/list",
                        params: {
                            offset: ($scope.paginationConf.currentPage - 1) * $scope.paginationConf.itemsPerPage || 0,
                            limit: $scope.paginationConf.itemsPerPage,
                            orderNo: $scope.orderNo,
                            contactsName: $scope.contactsName,
                            contactsPhone: $scope.contactsPhone,
                            status: $scope.orderStatus
                        }
                    }).success(function (data) {
                        window.localStorage.newTravelOrder = false;
                        $scope.paginationConf.totalItems = data.count;
                        $scope.travelOrderList = data.list;
                        if (data.list !== null) {
                            $scope.travelOrderList.forEach(function (r) {
                                //状态码转文字状态
                                r.orderStatusText = getStatusStr(r.orderStatus);
                                //取消订单
                                r.cancel = function () {
                                    $http({
                                        method: 'GET',
                                        url: config.urlBase + '/user/ordertravel/changeStatus/' + r.id + '/' + '-2'
                                    }).then(function (result) {
                                        if (result.data.status == 200) {
                                            r.orderStatusText = "已取消";
                                            r.orderStatus = -2;
                                            alertOrConfirm.successAlert("取消订单成功!");
                                        } else {
                                            alertOrConfirm.failAlert("取消订单失败!");
                                        }
                                    });
                                };
                                //拒单
                                r.refuse = function () {
                                    var refuseFun = function() {
                                        $http({
                                            method: 'GET',
                                            url: config.urlBase + '/user/ordertravel/changeStatus/' + r.id + '/' + '-3'
                                        }).success(function (result) {
                                            console.log(result);
                                            if (result.status == 200) {
                                                r.orderStatusText = "拒单退款中";
                                                r.orderStatus = -3;
                                                alertOrConfirm.successAlert("拒单成功!请关注退款状态");
                                                load();
                                            } else {
                                                alertOrConfirm.failAlert("拒单失败!");
                                            }

                                        });
                                    };
                                    alertOrConfirm.confirm("您确定要拒单吗？", refuseFun);
                                };
                                //
                                r.success = function () {
                                    $http({
                                        method: 'GET',
                                        url: config.urlBase + '/user/ordertravel/changeStatus/' + r.id + '/' + '3'
                                    }).success(function () {
                                        r.orderStatusText = "已完成";
                                        r.orderStatus = 3;
                                        alertOrConfirm.successAlert("订单完成!");
                                    });
                                };
                                //订单word导出
                                r.wordExport = function() {
                                    return config.urlBase + "/user/orderTravel/wordExport?id=" + r.id;
                                };
                            });
                        }
                    });

                };

                if(window.localStorage.newTravelOrder == '1'){
                    $scope.orderStatus = '-1';
                    load();
                }
                //查询
                $scope.search = function () {
                    $scope.orderNoBackup = angular.copy($scope.orderNo);
                    $scope.contactsNameBackup = angular.copy($scope.contactsName);
                    $scope.contactsPhoneBackup = angular.copy($scope.contactsPhone);
                    $scope.orderStatusStr = getStatusStr($scope.orderStatus) || '';
                    if (!$scope.orderNo && !$scope.contactsName && !$scope.contactsPhone && $scope.orderStatus == '') {
                        $scope.searchInfo = false;
                        $scope.paginationConf.onChange();
                    } else {
                        $scope.searchInfo = true;
                        $scope.paginationConf.onChange();
                    }
                };

                var getStatusStr = function(orderStatus) {
                    switch (orderStatus+""){
                        case "-7":
                            return '已取消退款失败';
                        case "-6":
                            return '拒单退款失败';
                        case "-5":
                            return '已取消退款成功';
                        case "-4":
                            return '已拒单退款成功';
                        case "-3":
                            return '已拒单退款中';
                        case "-2":
                            return '已取消退款中';
                        case "-1":
                            return '取消';
                        case "0":
                            return '预订单';
                        case "1":
                        case "4":
                            return '待支付';
                        case "2":
                            return '已支付';
                        case "3":
                            return '已完成';
                    }
                };
                $scope.print = function(order){
                    console.log(order);
                    if($scope.doubleClick){
                        return;
                    }
                    $scope.doubleClick = true;
                    window.localStorage.orderNo = order.orderNo;
                    window.localStorage.productName = order.productName;
                    window.localStorage.startDate = order.startDate;
                    window.localStorage.endDate = order.endDate;
                    window.localStorage.contactsName = order.contactsName;
                    window.localStorage.contactsPhone = order.contactsPhone;
                    window.localStorage.price = order.price;
                    window.localStorage.orderStatusText = order.orderStatusText;
                    window.localStorage.number = order.number;

                    $http({
                        method: 'GET',
                        url: config.urlBase + '/user/productTravel/getServiceAndPic/' + order.product_id
                    }).then(function(result){
                        window.localStorage.proServiceDesc = result.data.proServiceDesc;
                        $scope.doubleClick = false;
                        console.log(result);
                        $rootScope.modal = $modal.open({
                            templateUrl: 'app/views/orderTravel/orderTravel.print.html',
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
            templateUrl: 'app/views/orderTravel/orderTravel.list.html',
            controllerAs: 'ctrl',
            bindToController: true
        };
    });
})();
