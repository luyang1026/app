'use strict';
(function () {
    var app = angular.module('swalk.category', ['tm.pagination']);
    app.directive('swalkCategoryList', function () {
        return {
            restrict: 'E',
            scope: {},
            replace: true,
            controller: function controller($http, config, $scope, $modal, $rootScope, fileReader, FileUploader, $cookies, $timeout, alertOrConfirm, waiting) {
                var others = {
                    //是否是房型设施(显示添加图片信息)
                    isDevice: false,
                    //是否不是图片
                    isNotPicture: false,
                    //图片保存成功k
                    picSaveSuccess: false,
                    //图片保存失败
                    picSaveFail: false,
                    //显示添加图片
                    picShow: false,
                    //显示保存失败
                    saveFail: false,
                    //显示保存成功
                    saveSuccess: false
                };

                var uploaderFun = function (scope, type) {
                    //下载
                    if (type == 0) {
                        var uploader = scope.uploader0 = new FileUploader({
                            url: config.urlBase + "/user/pictureManage/saveDevicePic",
                            headers: {'token': $cookies.get("token")}
                        });
                    } else {
                        var uploader = scope.uploader1 = new FileUploader({
                            url: config.urlBase + "/user/pictureManage/saveDevicePic",
                            headers: {'token': $cookies.get("token")}
                        });
                    }

                    uploader.filters.push({
                        name: 'imageFilter',
                        fn: function(item /*{File|FileLikeObject}*/, options) {
                            var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
                        }
                    },{
                        name: 'sizeFilter',
                        fn: function(item){
                            return item.size <= config.imageSize;
                        }
                    });

                    uploader.onWhenAddingFileFailed = function (item /*{File|FileLikeObject}*/, filter, options) {
                        if(filter.name == 'imageFilter'){
                            alertOrConfirm.failAlert("格式不正确，只能上传jpg,bmp或png格式文件");
                        }else if(filter.name == 'sizeFilter'){
                            var mb = config.imageSize / 1048576;
                            alertOrConfirm.failAlert("单张图片不能超过"+ mb +"M");
                        }
                    };
                    uploader.onAfterAddingFile = function (fileItem) {
                        if (uploader.queue.length > 1) {
                            uploader.queue.splice(0, 1);
                        }
                        // console.info('onAfterAddingFile', fileItem);
                        scope.fileitem = '';
                        scope.isPro = '未上传';
                        if (type == 0) {
                            scope.flagPic0 = true;
                            scope.showOldPic0 = false;
                        } else {
                            scope.flagPic1 = true;
                            scope.showOldPic1 = false;
                        }

                    };
                    uploader.onBeforeUploadItem = function (item) {
                        item.formData.push({
                            foreignId: scope.category.id,
                            priority: type,
                            name: scope.category.name
                        });
                        // console.info('onBeforeUploadItem', item);
                    };
                    uploader.onProgressItem = function (fileItem, progress) {
                        scope.isPro = '正在上传';
                        // console.info('onProgressItem', fileItem, progress);
                    };
                    uploader.onSuccessItem = function (fileItem, response, status, headers) {
                        if (response.status == 500 && type == 0) {
                            alertOrConfirm.failAlert("保存第一张图片失败！");
                        } else if (response.status == 500 && type == 1) {
                            alertOrConfirm.failAlert("保存第二张图片失败！");
                        } else if (response.status == 200 && type == 0) {
                            scope.flagPic0 = false;
                            if (scope.uploader1.queue[0] == null) {
                                alertOrConfirm.successAlert("保存成功");
                                $rootScope.modal.close();
                                load();
                            }
                        } else if (response.status == 200 && type == 1) {
                            scope.flagPic1 = false;
                            if (!scope.flagPic0) {
                                alertOrConfirm.successAlert("保存成功");
                                $rootScope.modal.close();
                                load();
                            }
                        } else if (type == 0) {
                            alertOrConfirm.failAlert("保存第一张图片失败,参数数据格式错误");
                        } else {
                            alertOrConfirm.failAlert("保存第二张图片失败,参数数据格式错误");
                        }
                        scope.loadingModel();
                        $rootScope.modal.close();
                        load();
                        //scope.isPro = '上传成功';
                        //console.info('onSuccessItem', fileItem, response, status, headers);
                    };
                    uploader.onErrorItem = function (fileItem, response, status, headers) {
                        if (type == 0) {
                            alertOrConfirm.failAlert("保存第一张图片失败！");
                        } else {
                            alertOrConfirm.failAlert("保存第二张图片失败！");
                        }
                        scope.loadingModel();
                        //scope.isPro = '上传失败';
                    };
                    uploader.onCancelItem = function (fileItem, response, status, headers) {
                    };
                    uploader.onCompleteItem = function (fileItem, response, status, headers) {
                        // console.info('onCompleteItem', fileItem, response, status, headers);
                    };
                };

                //获取图片
                var getPictureUrlListFun = function (scope) {
                    $http({
                        method: "GET",
                        url: config.urlBase + '/user/pictureManage/getPicPathForArray/' + scope.category.id + '/housetype_device'
                    }).then(function (data) {
                        scope.pictureUrlList = data.data;
                    }, function () {
                        alertOrConfirm.failAlert("获取图片失败!");
                    })
                };

                var load = function () {
                    $http({
                        method: "GET",
                        url: config.urlBase + '/user/categoryMenu/list',
                        params: {
                            type: $scope.type,
                            offset: ($scope.paginationConf.currentPage - 1) * $scope.paginationConf.itemsPerPage,
                            limit: $scope.paginationConf.itemsPerPage
                        }
                    }).success(function (data) {
                        $scope.categoryList = data.list;
                        $scope.paginationConf.totalItems = data.count;
                        $scope.typeMap = map;
                        if (data != null) {
                            $scope.categoryList.forEach(function (r) {
                                r.detail = function () {
                                    $rootScope.modal = $modal.open({
                                        templateUrl: "app/views/category/category.card.html",
                                        backdrop: "static",
                                        keyboard: false,
                                        controller: function ($scope) {
                                            $scope.others = angular.copy(others);
                                            $scope.typeList = typeList;
                                            $scope.category = r;
                                            $scope.pictureMDB = {};
                                            $scope.isRead = true;
                                            $scope.closeModal = function () {
                                                $scope.modal.close();
                                            };
                                            if ($scope.category.type == "house_type_device") {
                                                $scope.others.isDevice = true;
                                                $scope.others.picShow = false;

                                                $scope.showOldPic0 = true;
                                                $scope.showOldPic1 = true;
                                                getPictureUrlListFun($scope);
                                                uploaderFun($scope, 0);
                                                uploaderFun($scope, 1);
                                            }
                                        }
                                    });
                                };
                                r.modify = function () {
                                    $rootScope.modal = $modal.open({
                                        templateUrl: "app/views/category/category.card.html",
                                        backdrop: "static",
                                        keyboard: false,
                                        controller: function ($scope) {
                                            $scope.typeList = typeList;
                                            $scope.others = angular.copy(others);
                                            $scope.category = r;
                                            $scope.pictureMDB = {};

                                            var oldType = false;
                                            $scope.isRead = false;
                                            $scope.closeModal = function () {
                                                $scope.modal.close();
                                                load();
                                            };
                                            if ($scope.category.type == "house_type_device") {
                                                oldType = true;
                                                $scope.others.isDevice = true;
                                                $scope.others.picShow = true;

                                                getPictureUrlListFun($scope);
                                                $scope.showOldPic0 = true;
                                                $scope.showOldPic1 = true;
                                                uploaderFun($scope, 0);
                                                uploaderFun($scope, 1);
                                            }
                                            //保存提交
                                            $scope.save = function () {
                                                saveFun($scope);
                                                load();
                                                //$scope.modal.close();
                                                if (oldType && $scope.category.type != "house_type_device") {
                                                    deletePicFun($scope);
                                                }
                                            };
                                            $scope.typeChange = function () {
                                                typeChangeFun($scope);
                                                if ($scope.category.type == "house_type_device") {
                                                    oldType = true;
                                                    $scope.others.isDevice = true;
                                                    $scope.others.picShow = true;

                                                    getPictureUrlListFun($scope);
                                                    $scope.showOldPic0 = true;
                                                    $scope.showOldPic1 = true;
                                                    uploaderFun($scope, 0);
                                                    uploaderFun($scope, 1);
                                                }
                                            };
                                        }
                                    });
                                };
                                r.delete = function () {
                                    var deletefun = function () {
                                        $http({
                                            method: "POST",
                                            url: config.urlBase + "/user/categoryMenu/delete",
                                            data: r.id
                                        }).then(function () {
                                            if (r.type == "house_type_device") {
                                                $scope.category = r;
                                                deletePicFun($scope);
                                            }
                                            load();
                                        })
                                    };
                                    alertOrConfirm.deleteConfirm(deletefun);
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
                        load();
                    }
                };
                var typeList = [{id: "notice_type", name: "通知类型"},
                    {id: "housekeeper_type", name: "管家服务类型"},
                    {id: "repair_type", name: "维修服务类型"},
                    {id: "appointment_type", name: "预约服务类型"},
                    {id: "service_type", name: "服务类型"},
                    {id: "house_type", name: "房型"},
                    {id: "house_type_service", name: "房型服务"},
                    {id: "house_type_device", name: "房型设施"},
                    {id: "property_type", name: "物业类型"}
                ];

                $scope.typeList = typeList;
                var map = {};
                for (var i = 0; i < typeList.length; i++) {
                    map[typeList[i].id] = typeList[i].name;
                }
                //判断是否选填房型设施类型
                var typeChangeFun = function (scope) {
                    console.log(scope.category.type);
                    if (scope.category.type == 'house_type_device') {
                        scope.others.isDevice = true;
                        scope.others.picShow = true;
                        scope.others.isDevices = true;
                    } else {
                        scope.others.isDevice = false;
                    }
                };

                var saveFun = function (scope) {
                    if(scope.category.type == "house_type_device" && scope.uploader0.queue[0]){
                        if(scope.uploader0.queue[0] != null || scope.uploader1.queue[0] != null){
                            scope.loadingModel = waiting.loading("正在上传图片，请等待。。。");
                        }
                    }
                    scope.holdDoubleClick = true;
                    $http({
                        method: "POST",
                        url: config.urlBase + "/user/categoryMenu/save",
                        data: scope.category
                    }).then(function (result) {
                        if (result.data.status == 200) {
                            scope.category.id = result.data.data.id;
                            scope.others.saveFail = false;
                            scope.others.saveSuccess = true;
                            var flagDevice = true;
                            if (scope.category.type == "house_type_device") {
                                if (scope.uploader0.queue[0] != null && scope.flagPic0) {
                                    flagDevice = false;
                                    scope.uploader0.queue[0].upload();
                                }
                                if (scope.uploader1.queue[0] != null && scope.flagPic1) {
                                    flagDevice = false;
                                    scope.uploader1.queue[0].upload();
                                }
                                scope.others.picSaveSuccess = true;
                                scope.others.picSaveFail = false;
                                $timeout(function(){
                                    scope.holdDoubleClick = false;
                                },800);
                            }else{
                                alertOrConfirm.successAlert("保存成功");
                            }
                            if (flagDevice) {
                                $rootScope.modal.close();
                                load();
                                scope.holdDoubleClick = false;
                            }
                        } else if (result.data.status == 1000) {
                            alertOrConfirm.failAlert("保存失败,数据格式错误");
                        } else {
                            alertOrConfirm.failAlert("保存失败");
                        }

                    }, function () {
                        scope.others.picSaveSuccess = false;
                        scope.others.picSaveFail = true;
                        alertOrConfirm.failAlert("保存失败");
                        scope.holdDoubleClick = false;
                    });
                };

                var deletePicFun = function (scope) {
                    $http({
                        method: "GET",
                        url: config.urlBase + "/user/pictureManage/deletePicture/" + scope.category.id + "/housetype_device"
                    });
                };

                $scope.load = load;
                $scope.add = function () {
                    $rootScope.modal = $modal.open({
                        templateUrl: "app/views/category/category.card.html",
                        backdrop: "static",
                        keyboard: false,
                        controller: function ($scope) {
                            $scope.category = {};
                            $scope.pictureMDB = {id: null, foreignId: null, picture: null, type: "housetype_device"};
                            $scope.others = angular.copy(others);
                            $scope.releaseFlag = true;
                            $scope.typeList = typeList;

                            $scope.showOldPic0 = true;
                            $scope.showOldPic1 = true;
                            uploaderFun($scope, 0);
                            uploaderFun($scope, 1);
                            $scope.closeModal = function () {
                                $scope.modal.close();
                                load();
                            };
                            //保存提交
                            $scope.save = function () {
                                saveFun($scope);
                            };
                            $scope.typeChange = function () {
                                typeChangeFun($scope);
                            };
                        }
                    });
                };
            },
            link: function () {
            },
            templateUrl: 'app/views/category/category.list.html',
            controllerAs: 'ctrl',
            bindToController: true
        };
    });
})();
