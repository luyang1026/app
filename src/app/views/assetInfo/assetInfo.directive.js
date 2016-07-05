'use strict';
(function () {
    var app = angular.module('swalk.assetInfo');
    app.directive('swalkAssetInfoList', function () {
        return {
            restrict: 'E',
            scope: {},
            replace: true,
            controller: function controller($rootScope, config, $scope, $http, $stateParams, $modal, $timeout,
                                            categoryListService, $cookies, initTimeService, alertOrConfirm) {

                //分页
                $scope.paginationConf = {
                    itemsPerPage: 10,
                    totalItems: -1, //设置一个初始总条数，判断加载状态
                    onChange: function () {
                        pageChanged();
                    }
                };
                //查询物业列表
                var getHousesFun = function (scope) {
                    categoryListService.query("property_type").then(function (data) {
                        scope.houses = data.list;
                    })
                };
                getHousesFun($scope);
                $scope.excelExport = function () {
                    window.open(config.urlBase + "/user/assetInfo/excelExport", '_parent', '');
                };

                $scope.excelExportUrl = config.urlBase + '/user/assetInfo/excelExport';
                //初始化用户selectize
                function userSelectize (scope) {
                    $http({
                        method: "GET",
                        url: config.urlBase + "/user/user/listForSelectize",
                        params: {
                            userName: scope.assetInfo.userName || "",
                            limit: config.selectizeSize
                        }
                    }).then(function (results) {
                        scope.assetUserList = results.data;
                        $timeout(function(){
                            $('#userSelectize').selectize({
                                persist: false,
                                maxItems: 1,
                                valueField: 'userId',
                                labelField: 'userName',
                                searchField: ['userName'],
                                options: scope.assetUserList,
                                create: false,
                                load: function (input, callback) {
                                    $http({
                                        method: "GET",
                                        url: config.urlBase + "/user/user/listForSelectize",
                                        params: {
                                            userName: input,
                                            limit: config.selectizeSize
                                        }
                                    }).then(function (results) {
                                        $('#userSelectize')[0].selectize.clearOptions();
                                        callback(results.data);
                                    }, function(){
                                        callback();
                                    });
                                },
                                onChange: function(value){
                                    if(!value){
                                        $http({
                                            method: "GET",
                                            url: config.urlBase + "/user/user/listForSelectize",
                                            params: {
                                                userName: "",
                                                limit: config.selectizeSize
                                            }
                                        }).then(function (results) {
                                            $('#userSelectize')[0].selectize.addOption(results.data);
                                        });
                                    }
                                }
                            });
                            $('#userSelectize')[0].selectize.setValue(scope.assetInfo.userId);
                        });
                    });

                }
                var pageChanged = function () {
                    $http({
                        method: "GET",
                        url: config.urlBase + "/user/assetInfo/list",
                        params: {
                            offset: ($scope.paginationConf.currentPage - 1) * $scope.paginationConf.itemsPerPage,
                            limit: $scope.paginationConf.itemsPerPage,
                            assetName: $scope.assetCandition,
                            propertyType: $scope.propertyType
                        }
                    }).success(function (data) {
                        $scope.paginationConf.totalItems = data.count;
                        $scope.assetInfoList = data.list;
                        if ($scope.assetInfoList != null) {
                            $scope.assetInfoList.forEach(function (r) {
                                //详情和修改两个按钮都是调用的这个方法
                                r.detail = function (flag) {
                                    $rootScope.modal = $modal.open({
                                        templateUrl: "app/views/assetInfo/assetInfo.card.html",
                                        backdrop: "static",
                                        controller: function ($scope) {
                                            console.log(r);
                                            //阻止重复提交
                                            $scope.holdDoubleClick = false;
                                            $scope.assetInfo = r;
                                            //阻止第一次打开表单时,房源值变化情况房型数据
                                            $scope.firstOpenCard = true;
                                            $scope.editorInfo = function () {
                                                $scope.beginEdit = true;
                                                $scope.showButton = true;
                                            };
                                            if (flag == "1") {
                                                $scope.editorInfo();
                                            }
                                            $scope.closeModal = function () {
                                                $scope.modal.close();
                                            };
                                            //用户
                                            $scope.assetUserList = [{userId:$scope.assetInfo.userId, userName:$scope.assetInfo.userName}];
                                            userSelectize($scope);
                                            //房型
                                            $scope.houseTypeList = [{id:$scope.assetInfo.houseTypeId, name:$scope.assetInfo.houseTypeName}];
                                            houseTypeSelectize($scope);
                                            //房源
                                            $scope.houseList = [{id:$scope.assetInfo.houseId, name:$scope.assetInfo.houseName}];
                                            houseSelectize($scope);
                                            //获取物业列表
                                            getHousesFun($scope);
                                            //初始化房源,房型
                                            $scope.services = [
                                                {name: '管家服务', id: 1},
                                                {name: '托管服务', id: 2},
                                                {name: '管+托', id: 3}
                                            ];
                                            $scope.save = function () {
                                                saveFun($scope);
                                            };
                                        }
                                    })
                                };
                                r.delete = function () {
                                    var deleteFun = function () {
                                        $http({
                                            method: "POST",
                                            url: config.urlBase + "/user/assetInfo/delete/" + r.id
                                        }).success(function () {
                                            alertOrConfirm.successAlert("删除成功!");
                                            pageChanged();
                                        })
                                    };
                                    alertOrConfirm.deleteConfirm(deleteFun);
                                };

                            })
                        }
                    });
                };

                $scope.getData = function () {
                    $scope.searchValBackup = angular.copy($scope.assetCandition);
                    if(!$scope.assetCandition){
                        $scope.searchInfo = false;
                        pageChanged();
                    }else{
                        $scope.searchInfo = true;
                        pageChanged();
                    }
                };
                $scope.reset = function(){
                    $scope.assetCandition = '';
                    $scope.searchInfo = false;
                    pageChanged();
                };
                //房型selectize
                var houseTypeSelectize = function (scope) {
                    $http({
                        method: "GET",
                        url: config.urlBase + "/user/houseType/listForSelectize",
                        params: {
                            houseId: scope.assetInfo.houseId,
                            houseName: scope.assetInfo.houseTypeName || "",
                            limit: config.selectizeSize
                        }
                    }).then(function (results) {
                        scope.houseTypeList = results.data;
                        $timeout(function() {
                            $('#houseTypeSelectize').selectize({
                                persist: false,
                                maxItems: 1,
                                valueField: 'id',
                                labelField: 'name',
                                searchField: ['name'],
                                options: scope.houseTypeList,
                                create: false,
                                load: function (input, callback) {
                                    $http({
                                        method: "GET",
                                        url: config.urlBase + "/user/houseType/listForSelectize",
                                        params: {
                                            houseId: scope.assetInfo.houseId,
                                            houseName: input,
                                            limit: config.selectizeSize
                                        }
                                    }).then(function (results) {
                                        $('#houseTypeSelectize')[0].selectize.clearOptions();
                                        callback(results.data);
                                    }, function () {
                                        callback();
                                    })
                                },
                                onChange: function () {
                                    var item = $('#houseTypeSelectize')[0].selectize.items[0];
                                    var obj = $('#houseTypeSelectize')[0].selectize.options[item];
                                    if (obj != null && obj.area) {
                                        scope.assetInfo.houseArea = obj.area;
                                    }
                                }
                            });
                            $('#houseTypeSelectize')[0].selectize.setValue(scope.assetInfo.houseTypeId);
                        });
                    })


                };
                //房源selectize
                var houseSelectize = function (scope) {
                    $http({
                        method: "GET",
                        url: config.urlBase + "/user/house/listForSelectize",
                        params: {
                            property: scope.assetInfo.propertyType,
                            houseName: scope.assetInfo.houseName || "",
                            limit: config.selectizeSize
                        }
                    }).then(function (results) {
                        //$('#houseSelectize')[0].selectize.clearOptions();
                        scope.houseList = results.data;
                        $timeout(function() {
                            $('#houseSelectize').selectize({
                                persist: false,
                                maxItems: 1,
                                valueField: 'id',
                                labelField: 'name',
                                searchField: ['name'],
                                options: scope.houseList,
                                create: false,
                                load: function (input, callback) {
                                    $http({
                                        method: "GET",
                                        url: config.urlBase + "/user/house/listForSelectize",
                                        params: {
                                            property: scope.assetInfo.propertyType,
                                            houseName: input,
                                            limit: config.selectizeSize
                                        }
                                    }).then(function (results) {
                                        $('#houseSelectize')[0].selectize.clearOptions();
                                        callback(results.data);
                                    }, function () {
                                        callback();
                                    })
                                },
                                onChange: function (value) {
                                    if (!scope.firstOpenCard) {
                                        // $('#houseTypeSelectize')[0].selectize.items = [];
                                        //清空selectize输入内容
                                        $('#houseTypeSelectize+div>div>div').html("");
                                        $('#houseTypeSelectize')[0].selectize.clearOptions();
                                        scope.assetInfo.houseTypeId = null;
                                        scope.assetInfo.houseArea = null;
                                        var item = $('#houseSelectize')[0].selectize.items[0];
                                        var obj = $('#houseSelectize')[0].selectize.options[item];
                                        if (obj != null && obj.address) {
                                            scope.assetInfo.houseAddress = obj.address;
                                        }
                                        if(value){
                                            $http({
                                                method: "GET",
                                                url: config.urlBase + "/user/houseType/listForSelectize",
                                                params: {
                                                    houseId: value,
                                                    houseName: "",
                                                    limit: config.selectizeSize
                                                }
                                            }).then(function (results) {
                                                $('#houseTypeSelectize')[0].selectize.addOption(results.data);
                                            })
                                        }
                                    } else {
                                        scope.firstOpenCard = false;
                                    }

                                }

                            });
                            $('#houseSelectize')[0].selectize.setValue(scope.assetInfo.houseId);
                            //物业类型改变
                            scope.propertyChange = function () {
                                $('#houseSelectize')[0].selectize.items = [];
                                //清空selectize输入内容
                                $('#houseSelectize+div>div>div').html("");
                                $('#houseSelectize')[0].selectize.clearOptions();
                                $('#houseTypeSelectize')[0].selectize.items = [];
                                $('#houseTypeSelectize+div>div>div').html("");
                                $('#houseTypeSelectize')[0].selectize.clearOptions();
                                scope.assetInfo.houseTypeId = null;
                                scope.assetInfo.houseId = null;
                                scope.assetInfo.houseArea = null;
                                scope.assetInfo.houseAddress = null;
                                $http({
                                    method: "GET",
                                    url: config.urlBase + "/user/house/listForSelectize",
                                    params: {
                                        property: scope.assetInfo.propertyType,
                                        houseName: "",
                                        limit: config.selectizeSize
                                    }
                                }).then(function (results) {
                                    $('#houseSelectize')[0].selectize.addOption(results.data);
                                });
                            };
                        });
                    })

                };

                var saveFun = function (scope) {
                    if(initTimeService.query(scope.assetInfo.startTerm) > initTimeService.query(scope.assetInfo.endTerm)){
                        alertOrConfirm.failAlert("合同开始时间不能大于合同结束时间")
                    }else{
                        //阻止重复提交
                        scope.holdDoubleClick = true;
                        $http({
                            method: "POST",
                            url: config.urlBase + "/user/assetInfo/save",
                            data: scope.assetInfo
                        }).then(function (result) {
                            if (result.data.status == 200) {
                                alertOrConfirm.successAlert("保存成功");
                                scope.saveSuccess = true;
                                scope.saveFail = false;
                                scope.closeModal();
                                pageChanged();
                            } else if (result.data.status == 1000) {
                                alertOrConfirm.failAlert("保存失败,数据传输错误");
                                scope.saveSuccess = false;
                                scope.saveFail = true;
                            } else {
                                alertOrConfirm.failAlert("保存失败");
                                scope.saveSuccess = false;
                                scope.saveFail = true;
                            }
                            //阻止重复提交
                            scope.holdDoubleClick = false;

                        }, function () {
                            alertOrConfirm.failAlert("保存失败");
                            scope.saveSuccess = false;
                            scope.saveFail = true;
                            //阻止重复提交
                            scope.holdDoubleClick = false;
                        });
                    }

                };

                $scope.add = function () {
                    $rootScope.modal = $modal.open({
                        templateUrl: "app/views/assetInfo/assetInfo.card.html",
                        backdrop: "static",
                        controller: function ($scope) {
                            //阻止重复提交
                            $scope.holdDoubleClick = false;
                            //定义assetInfo实体类
                            $scope.assetInfo = {};
                            $scope.assetInfo.startTerm = new Date();
                            $scope.assetInfo.endTerm = new Date();
                            $scope.closeModal = function () {
                                $scope.modal.close();
                            };

                            $scope.beginEdit = true;
                            $scope.showButton = true;
                            //获取物业列表
                            getHousesFun($scope);

                            userSelectize($scope);
                            houseTypeSelectize($scope);
                            houseSelectize($scope);
                            $scope.services = [
                                {name: '管家服务', id: 1},
                                {name: '托管服务', id: 2},
                                {name: '管+托', id: 3}
                            ];

                            $scope.save = function () {
                                saveFun($scope);
                            };
                        }
                    })
                };
            },
            link: function () {
            },
            templateUrl: 'app/views/assetInfo/assetInfo.list.html',
            controllerAs: 'ctrl',
            bindToController: true
        };
    });
})();
