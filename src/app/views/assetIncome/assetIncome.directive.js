/**
 * Created by mentongwu on 16-2-25.
 */
'use strict';
(function () {
    var app = angular.module('swalk.assetIncome');
    app.directive('swalkAssetIncomeList', function () {
        return {
            restrict: 'E',
            scope: {},
            replace: true,
            controller: function controller($rootScope, config, $scope, $http, $stateParams, $modal, $timeout, typeConversion,
                                            alertOrConfirm) {
                //serchInit
                var assetSelectize = function (scope) {
                    $http({
                        method: "GET",
                        url: config.urlBase + "/user/assetInfo/listForSelectize",
                        params: {
                            limit: config.selectizeSize,
                            noOrName: scope.income.assetName || "",
                            assetId: scope.income.assetId
                        }
                    }).success(function (results) {
                        //$('#assetSelectize')[0].selectize.clearOptions();
                        scope.assetList = results;
                        $timeout(function () {
                            $('#assetSelectize').selectize({
                                persist: false,
                                maxItems: 1,
                                valueField: 'id',
                                labelField: 'assetName',
                                searchField: ['assetName'],
                                options: scope.assetList,
                                items:[scope.income.assetId],
                                create: false,
                                load: function (input, callback) {
                                    $http({
                                        method: "GET",
                                        url: config.urlBase + "/user/assetInfo/listForSelectize",
                                        params: {
                                            limit: config.selectizeSize,
                                            noOrName: input,
                                            assetId: scope.income.assetId
                                        }
                                    }).success(function (results) {
                                        $('#assetSelectize')[0].selectize.clearOptions();
                                        callback(results);
                                    }).error(function () {
                                        callback();
                                    })
                                },
                                onChange: function (value) {
                                    console.log(value);
                                    var item = $('#assetSelectize')[0].selectize.options[value];
                                    scope.income.userId = null;
                                    scope.income.userName = null;
                                    if (item != null) {
                                        $http({
                                            method: "GET",
                                            url: config.urlBase + "/user/user/findById",
                                            params: {
                                                userId: item.userId
                                            }
                                        }).then(function(results) {
                                            scope.income.userName = results.data.userName;
                                        });
                                    }
                                }
                            });
                        });
                    });
                };

                //保存
                var saveFun = function (scope) {
                    //阻止重复提交
                    scope.holdDoubleClick = true;
                    var incomeSave ={};
                    incomeSave.id = scope.income.id;
                    incomeSave.assetId = scope.income.assetId;
                    incomeSave.date = scope.income.date;
                    incomeSave.userId = scope.income.userId;
                    incomeSave.homeIncome = typeConversion.doubleToLong(scope.income.homeIncome);
                    incomeSave.taxation = typeConversion.doubleToLong(scope.income.taxation);
                    incomeSave.commission = typeConversion.doubleToLong(scope.income.commission);
                    incomeSave.ownerIncome = typeConversion.doubleToLong(scope.income.ownerIncome);
                    incomeSave.rentalRate = typeConversion.doubleToLong(scope.income.rentalRate);
                    incomeSave.realIncome = typeConversion.doubleToLong(scope.income.realIncome);
                    incomeSave.otherDeductions = typeConversion.doubleToLong(scope.income.otherDeductions);
                    incomeSave.finalIncome = typeConversion.doubleToLong(scope.income.finalIncome);
                    $http({
                        method: "POST",
                        url: config.urlBase + "/user/income/save",
                        data: incomeSave
                    }).then(function (result) {
                        //阻止重复提交
                        scope.holdDoubleClick = false;
                        if (result.data.status == 200) {
                            scope.saveSuccess = true;
                            scope.saveFail = false;
                            alertOrConfirm.successAlert("保存成功");
                            scope.modal.close();
                            pageChanged();
                        } else if (result.data.status == 1000) {
                            alertOrConfirm.failAlert("保存失败,数据格式错误");
                            scope.saveSuccess = false;
                            scope.saveFail = true;
                        } else {
                            alertOrConfirm.failAlert("保存失败!");
                            scope.saveSuccess = false;
                            scope.saveFail = true;
                        }
                    }, function () {
                        //阻止重复提交
                        scope.holdDoubleClick = false;
                        alertOrConfirm.failAlert("保存失败!");
                        scope.saveSuccess = false;
                        scope.saveFail = true;
                    });
                };

                var pageChanged = function () {
                    $http({
                        method: "GET",
                        url: config.urlBase + "/user/income/list",
                        params: {
                            offset: ($scope.paginationConf.currentPage - 1) * $scope.paginationConf.itemsPerPage,
                            limit: $scope.paginationConf.itemsPerPage,
                            assetName: $scope.searchVal
                            //type: 1
                        }
                    }).success(function (data) {
                        $scope.incomeList = data.list;
                        $scope.paginationConf.totalItems = data.count;
                        if(data.list != null){
                            $scope.incomeList.forEach(function (r) {
                                //详情和修改两个按钮都是调用的这个方法
                                r.detail = function (flag) {
                                    $rootScope.modal = $modal.open({
                                        templateUrl: "app/views/assetIncome/assetIncome.card.html",
                                        backdrop: "static",
                                        controller: function ($scope) {
                                            $scope.income = r;

                                            //阻止第一次打开表单时, assetSelectize Onchange方法执行
                                            $scope.firstOpenCard = true;

                                            $scope.editorInfo = function () {
                                                $scope.beginEdit = true;
                                                $scope.showButton = true;
                                                $scope.releaseFlag = false;
                                            };

                                            $scope.updateOrSelect = function () {
                                                if (flag == "1") {
                                                    $scope.editorInfo();
                                                }
                                            };
                                            $scope.updateOrSelect();
                                            $scope.closeModal = function () {
                                                $scope.modal.close();
                                            };
                                            //资产selectize
                                            $scope.assetList = [{id:$scope.income.assetId, assetName: $scope.income.assetName,
                                                userId:$scope.income.userId, userName:$scope.income.userName}];
                                            assetSelectize($scope);
                                            $scope.open_start = function () {
                                                $timeout(function () {
                                                    $scope.opened_start = true;
                                                });
                                            };

                                            $scope.contentChange = function () {
                                                $scope.editorInfo();
                                            };

                                            $scope.assign = function () {
                                                saveFun($scope);
                                            }
                                        }
                                    })
                                };
                                r.delete = function () {
                                    var deleteFun = function () {
                                        $http({
                                            method: "GET",
                                            url: config.urlBase + "/user/income/delete/" + r.id
                                        }).success(function (data) {
                                            pageChanged();
                                        })
                                    };
                                    alertOrConfirm.deleteConfirm(deleteFun)
                                };

                            })
                        }
                    });
                    $scope.getData = function () {
                        $scope.searchValBackup = angular.copy($scope.searchVal);
                        if(!$scope.searchVal){
                            $scope.searchInfo = false;
                            pageChanged();
                        }else{
                            $scope.searchInfo = true;
                            pageChanged();
                        }
                    };
                    $scope.reset = function(){
                        $scope.searchVal = '';
                        $scope.searchInfo = false;
                        pageChanged();
                    };

                };
                $scope.pageChanged = pageChanged;

                $scope.paginationConf = {
                    itemsPerPage: 10,
                    totalItems: -1, //设置一个初始总条数，判断加载状态
                    onChange: function () {
                        pageChanged();
                    }
                };

                $scope.add = function () {
                    $rootScope.modal = $modal.open({
                        templateUrl: "app/views/assetIncome/assetIncome.card.html",
                        backdrop: "static",
                        controller: function ($scope) {
                            $scope.releaseFlag = true;
                            $scope.income = {
                                assetId :""
                            };
                            $scope.income.date = new Date();
                            $scope.closeModal = function () {
                                $scope.modal.close();
                            };
                            $scope.beginEdit = true;
                            $scope.showButton = true;
                            $http({
                                method: "GET",
                                url: config.urlBase + "/user/assetInfo/listForSelectize"
                            }).success(function (data) {
                                $scope.assetList = data;
                            });
                            assetSelectize($scope);
                            $scope.assign = function () {
                                saveFun($scope);
                            };
                            $scope.editorInfo = function () {
                                $scope.showButton = true;
                                $scope.beginEdit = true;
                            };
                        }
                    })
                };
            },
            link: function () {
            },
            templateUrl: 'app/views/assetIncome/assetIncome.list.html',
            controllerAs: 'ctrl',
            bindToController: true
        };
    });
})();
