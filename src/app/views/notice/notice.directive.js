'use strict';
(function () {
    var app = angular.module('swalk.notice');
    app.directive('swalkNoticeList', function () {
        return {
            restrict: 'E',
            scope: {},
            replace: true,
            controller: function ($rootScope, config, $scope, $http, $stateParams, $modal, $timeout, categoryListService, alertOrConfirm) {
                //搜索框
                function selectizeA (scope) {
                    console.log(scope.notice);
                    $http({
                        method: "GET",
                        url: config.urlBase + "/user/house/listForSelectize",
                        params: {
                            property: scope.notice.type,
                            houseName: scope.notice.houseName || "",
                            limit: config.selectizeSize
                        }
                    }).then(function (results) {
                        //$('#houseSearch')[0].selectize.clearOptions();
                        console.log(results)
                        scope.selectizeList = results.data;
                        $timeout(function(){
                            $('#houseSearch').selectize({
                                persist: false,
                                maxItems: 1,
                                valueField: 'id',
                                labelField: 'name',
                                searchField: ['name'],
                                options: scope.selectizeList,
                                create: false,
                                load: function (input, callback) {
                                    $http({
                                        method: "GET",
                                        url: config.urlBase + "/user/house/listForSelectize",
                                        params: {
                                            property: scope.notice.type,
                                            houseName: input,
                                            limit: config.selectizeSize
                                        }
                                    }).then(function (results) {
                                        //$('#houseSearch')[0].selectize.clearOptions();
                                        callback(results.data);
                                    }, function(){
                                        callback();
                                    });
                                }
                            });
                            $('#houseSearch')[0].selectize.setValue(scope.notice.foreignId);
                            //物业类型改变
                            scope.propertyChange = function () {
                                $('#houseSearch')[0].selectize.items = [];
                                $("div[class='item']").html('');
                                $('#houseSearch')[0].selectize.clearOptions();
                                scope.notice.foreignId = null;
                                $http({
                                    method: "GET",
                                    url: config.urlBase + "/user/house/listForSelectize",
                                    params: {
                                        property: scope.notice.type,
                                        houseName: "",
                                        limit: config.selectizeSize
                                    }
                                }).then(function (results) {
                                    console.log(results);
                                    $('#houseSearch')[0].selectize.addOption(results.data);
                                    //callback(results.data);
                                }, function(){
                                    //callback();
                                });
                            };
                        });
                    });

                }


                //获取新闻类型列表
                var categoryList = function(scope){
                    categoryListService.query("notice_type").then(function (data) {
                        scope.categoryList = data.list;
                    });
                };

                //获取物业类型列表
                categoryListService.query("property_type").then(function (data) {
                    $scope.houses = data.list;
                });

                //查询物业列表
                var getHousesFun = function(scope){
                    categoryListService.query("property_type").then(function(data){
                        scope.houses = data.list;
                    });
                };

                //获取初始selectize options
                /*var selectizeOptionsInit = function(scope){
                    $http({
                        method: "GET",
                        url: config.urlBase + "/user/house/listForSelectize",
                        params: {
                            property: scope.notice.type,
                            limit:10,
                            offset:0,
                            id:scope.notice.id
                        }
                    }).then(function(data){

                    });
                };*/

                //卡片初始化
                var cardInit = function(scope, flag) {
                    scope.showButton = false;

                    scope.closeModal = function () {
                        pageChanged();
                        scope.modal.close();
                    };
                    categoryList(scope);
                    //加载物业列表
                    getHousesFun(scope);

                    //初始
                    scope.editorInit = function () {
                        scope.showButton = false;
                        scope.beginEdit = false;
                    };

                    //点击编辑按钮
                    scope.editorInfo = function () {
                        scope.showButton = true;
                        scope.beginEdit = true;
                    };

                    //更新提交
                    scope.assignNew = function() {
                        save(scope);
                    };
                    if(flag == "modify")
                        scope.editorInfo();
                };

                //保存
                var save = function (scope) {
                    scope.holdDoubleClick = true;
                    $http({
                        method: "POST",
                        url: config.urlBase + "/user/notice/save",
                        data: scope.notice
                    }).then(function (result) {
                        if (result.data.status == 200) {
                            scope.saveSuccess = true;
                            scope.saveFail = false;
                            scope.modal.close();
                            pageChanged();
                        } else if (result.data.status == 1000) {
                            alertOrConfirm.failAlert("保存失败！数据格式错误");
                            scope.saveFail = true;
                            scope.saveSuccess = false;
                        } else {
                            alertOrConfirm.failAlert("保存失败！");
                            scope.saveFail = true;
                            scope.saveSuccess = false;
                        }
                        $timeout(function(){
                            scope.holdDoubleClick = false;
                        },200);
                    }, function () {
                        alertOrConfirm.failAlert("保存失败！");
                        scope.saveFail = true;
                        scope.saveSuccess = false;
                        scope.holdDoubleClick = false;
                    });
                };
                //查询
                var pageChanged = function () {
                    $http({
                        method: "GET",
                        url: config.urlBase + "/user/notice/list",
                        params: {
                            offset: ($scope.paginationConf.currentPage-1)*$scope.paginationConf.itemsPerPage,
                            limit: $scope.paginationConf.itemsPerPage,
                            noticeTitle: $scope.noticeTitle,
                            type:$scope.type
                            //TODO noticeType:$('#noticeType option:selected').val()
                        }
                    }).then(function (data) {
                        $scope.noticeList = data.data.list;
                        $scope.paginationConf.totalItems = data.data.count;
                        if(data.data.list !== null) {
                            $scope.noticeList.forEach(function (r) {
                                r.detail = function () {
                                    $rootScope.modal = $modal.open({
                                        templateUrl: "app/views/notice/notice.card.html",
                                        backdrop: "static",
                                        keyboard: false,
                                        controller: function ($scope) {
                                            $scope.notice = r;
                                            cardInit($scope, "detail");
                                            $scope.selectizeList = [{id:$scope.notice.foreignId,name:$scope.notice.houseName}];
                                            selectizeA($scope);
                                        }
                                    });
                                };

                                r.modify = function () {
                                    $rootScope.modal = $modal.open({
                                        templateUrl: "app/views/notice/notice.card.html",
                                        backdrop: "static",
                                        keyboard: false,
                                        controller: function ($scope) {
                                            $scope.notice = r;
                                            cardInit($scope, "modify");
                                            $scope.selectizeList = [{id:$scope.notice.foreignId,name:$scope.notice.houseName}];
                                            selectizeA($scope);
                                        }
                                    });
                                };

                                r.delete = function () {
                                    var deleteFun = function () {
                                        $http({
                                            method: "GET",
                                            url: config.urlBase + "/user/notice/delete/" + r.id
                                        }).success(function (data) {
                                            if (data.status == 200) {
                                                alertOrConfirm.successAlert("删除成功!");
                                                pageChanged();
                                            } else {
                                                alertOrConfirm.failAlert("删除失败!");
                                            }
                                        }).error(function () {
                                            alertOrConfirm.failAlert("删除失败!");
                                        });
                                    };
                                    alertOrConfirm.deleteConfirm(deleteFun)
                                };
                            });
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
                $scope.reset = function(){
                    $scope.searchVal = '';
                    $scope.searchInfo = false;
                    pageChanged();
                };
                $scope.getData = function() {
                    $scope.searchValBackup = angular.copy($scope.noticeTitle);
                    if(!$scope.noticeTitle){
                        $scope.searchInfo = false;
                        pageChanged();
                    }else{
                        $scope.searchInfo = true;
                        pageChanged();
                    }
                };

                $scope.addNotice = function () {
                    $rootScope.modal = $modal.open({
                        templateUrl: "app/views/notice/notice.card.html",
                        backdrop: "static",
                        keyboard: false,
                        controller: function ($scope) {
                            $scope.notice = {};
                            $scope.notice.date = new Date();
                            $scope.selectizeFlag = true;
                            $scope.closeModal = function () {
                                $scope.modal.close();
                            };
                            $scope.showButton = true;
                            $scope.beginEdit = true;
                            categoryList($scope);
                            var selectize = selectizeA ($scope);
                            getHousesFun($scope);
                            //保存提交
                            $scope.assignNew = function () {
                                save($scope);
                            };
                        }
                    });
                };
            },
            link: function () {
            },
            templateUrl: 'app/views/notice/notice.list.html',
            controllerAs: 'ctrl',
            bindToController: true
        };
    });
})();