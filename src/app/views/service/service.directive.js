'use strict';
(function () {
    var app = angular.module('swalk.service');
    app.directive('swalkServiceList', function () {
        return {
            restrict: 'E',
            scope: {},
            replace: true,
            controller: function controller($http, config, $scope, $modal, $rootScope, categoryListService, FileUploader,
                                            $cookies, typeConversion, alertOrConfirm, $timeout,waiting) {
                var others = {
                    //是否不是图片
                    isNotPicture: false,
                    //图片保存成功
                    picSaveSuccess: false,
                    //图片保存失败
                    picSaveFail: false,
                    //显示添加图片
                    picShow:true,
                    //显示保存失败
                    saveFail: false,
                    //显示保存成功
                    saveSuccess: false
                };

                var typeList = [{id:0,name:"平台服务"},{id:1,name:"服务"}];

                var saveFun = function(scope){
                    if(scope.uploader0.queue[0] != null || scope.uploader1.queue[0] != null){
                        scope.loadingModel = waiting.loading("正在上传图片，请等待。。。");
                    }
                    scope.holdDoubleClick = true;
                    scope.uploaderService = angular.copy(scope.service);
                    scope.uploaderService.price = typeConversion.doubleToLong(scope.service.price);
                    var serviceTo = {};
                    serviceTo.service = scope.uploaderService;
                    serviceTo.ids = [];
                    if(!scope.showOldPic0){
                        serviceTo.ids.push("00");
                    } else{
                        serviceTo.ids.push("");
                    }
                    if(!scope.showOldPic1){
                        serviceTo.ids.push("01");
                    }else{
                        serviceTo.ids.push("");
                    }
                    $http({
                        method: "POST",
                        url: config.urlBase + "/user/serviceMenu/save",
                        data: serviceTo
                    }).then(function (result) {
                        if (result.data.status == 200) {
                            scope.service.id = result.data.data;
                            var flagPic = true;
                            if(scope.uploader0.queue[0] != null && scope.flagPic0){
                                flagPic = false;
                                scope.uploader0.queue[0].upload();
                            }
                            if(scope.uploader1.queue[0] != null && scope.flagPic1){
                                flagPic = false;
                                scope.uploader1.queue[0].upload();
                            }
                            scope.others.saveFail = false;
                            scope.others.saveSuccess = true;
                            if (flagPic) {
                                alertOrConfirm.successAlert("保存成功!");
                                scope.modal.close();
                                load();
                            }
                            $timeout(function(){
                                scope.holdDoubleClick = false;
                            },800)
                        } else if (result.data.status == 1000) {
                            alertOrConfirm.failAlert("数据格式错误!");
                            scope.holdDoubleClick = false;
                        } else {
                            alertOrConfirm.failAlert("保存失败!");
                            scope.holdDoubleClick = false;
                        }

                    }, function(){
                        scope.others.saveFail = true;
                        scope.others.saveSuccess = false;
                        scope.others.picSaveSuccess = false;
                        scope.others.picSaveFail = true;
                        alertOrConfirm.failAlert("保存失败!");
                        scope.holdDoubleClick = false;
                    });
                };

                //上传图片
                var uploaderFun = function(scope, type) {
                    //下载
                    if (type == 0) {
                        var uploader = scope.uploader0 = new FileUploader({
                            url: config.urlBase + "/user/pictureManage/saveServicePic",
                            headers: {'token': $cookies.get("token")}
                        });
                    } else{
                        var uploader = scope.uploader1 = new FileUploader({
                            url: config.urlBase + "/user/pictureManage/saveServicePic",
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
                        if(uploader.queue.length > 1) {
                            uploader.queue.splice(0, 1);
                        }
                        scope.fileitem = '';
                        scope.isPro = '未上传';
                        if(type == 0){
                            scope.flagPic0 = true;
                            scope.showOldPic0 = false;
                        } else {
                            scope.flagPic1 = true;
                            scope.showOldPic1 = false;
                        }

                    };
                    uploader.onBeforeUploadItem = function (item) {
                        item.formData.push({
                            foreignId: scope.service.id,
                            priority:type,
                            name:scope.service.name
                        });
                    };
                    uploader.onProgressItem = function (fileItem, progress) {
                        scope.isPro = '正在上传';
                    };
                    uploader.onSuccessItem = function (fileItem, response, status, headers) {
                        if (response.status == 1000 && type == 0) {
                            alertOrConfirm.failAlert("保存第一张图片失败,参数数据格式错误！");
                            scope.isPro = '上传失败';
                        } else if (response.status == 500 && type == 0){
                            alertOrConfirm.failAlert("保存第一张图片失败！");
                            scope.isPro = '上传失败';
                        } else if (response.status == 1000 && type == 1) {
                            alertOrConfirm.failAlert("保存第二张图片失败,参数数据格式错误！");
                            scope.isPro = '上传失败';
                        } else if (response.status == 500 && type == 1) {
                            alertOrConfirm.failAlert("保存第二张图片失败！");
                            scope.isPro = '上传失败';
                        } else if (response.status == 200 && type == 0) {
                            scope.flagPic0 = false;
                            if (scope.uploader1.queue[0] == null) {
                                alertOrConfirm.successAlert("保存成功!");
                                scope.modal.close();
                                load();
                            }
                        } else {
                            scope.flagPic1 = false;
                            if (!scope.flagPic0) {
                                alertOrConfirm.successAlert("保存成功!");
                                scope.modal.close();
                                load();
                            }
                        }
                        scope.loadingModel();
                    };
                    uploader.onErrorItem = function (fileItem, response, status, headers) {
                        if (type == 0) {
                            alertOrConfirm.failAlert("保存第一张图片失败！");
                        } else {
                            alertOrConfirm.failAlert("保存第二张图片失败！");
                        }
                        scope.isPro = '上传失败';
                        scope.loadingModel();
                    };
                    uploader.onCancelItem = function (fileItem, response, status, headers) {
                    };
                    uploader.onCompleteItem = function (fileItem, response, status, headers) {
                    };
                };

                var getPictureUrlListFun = function(scope){
                    $http({
                        method: "GET",
                        url: config.urlBase + '/user/pictureManage/getPicPathForArray/'+scope.service.id+"/service_picture"
                    }).then(function(data){
                        scope.pictureUrlList = data.data;
                    }, function(){
                        alertOrConfirm.failAlert("获取图片失败!");
                    })
                };

                var load = function () {
                    $http({
                        method: "GET",
                        url: config.urlBase + '/user/serviceMenu/list',
                        params: {
                            type: $scope.type,
                            offset: ($scope.paginationConf.currentPage - 1) * $scope.paginationConf.itemsPerPage,
                            limit: $scope.paginationConf.itemsPerPage
                        }
                    }).success(function (data) {
                        $scope.serviceList = data.list;
                        $scope.paginationConf.totalItems = data.count;
                        if (data.list !== null) {
                            $scope.serviceList.forEach(function (r) {
                                r.detail = function () {
                                    $rootScope.modal = $modal.open({
                                        templateUrl: "app/views/service/service.card.html",
                                        backdrop: "static",
                                        keyboard: false,
                                        controller: function ($scope) {
                                            $scope.service = r;
                                            $scope.typeList = typeList;
                                            $scope.others = angular.copy(others);
                                            $scope.pictureMDB = {};
                                            categoryListService.query("service_type").then(function (data) {
                                                $scope.serviceTypeList = data.list;
                                            });
                                            $scope.closeModal = function () {
                                                $scope.modal.close();
                                            };
                                            $scope.isRead = true;
                                            $scope.showOldPic0 = true;
                                            $scope.showOldPic1 = true;
                                            getPictureUrlListFun($scope);
                                            uploaderFun($scope, 0);
                                            uploaderFun($scope, 1);
                                        }
                                    })
                                };
                                r.modify = function () {
                                    $rootScope.modal = $modal.open({
                                        templateUrl: "app/views/service/service.card.html",
                                        backdrop: "static",
                                        keyboard: false,
                                        controller: function ($scope) {
                                            categoryListService.query("service_type").then(function (data) {
                                                $scope.serviceTypeList = data.list;
                                            });
                                            $scope.service = r;
                                            $scope.pictureMDB = {};
                                            $scope.typeList = typeList;
                                            $scope.others = angular.copy(others);
                                            $scope.save = function () {
                                                saveFun($scope);
                                            };
                                            $scope.closeModal = function () {
                                                $scope.modal.close();
                                                load();
                                            };
                                            getPictureUrlListFun($scope);
                                            $scope.showOldPic0 = true;
                                            $scope.showOldPic1 = true;
                                            uploaderFun($scope, 0);
                                            uploaderFun($scope, 1);
                                        }
                                    });
                                };
                                r.delete = function () {
                                    var deletefun = function() {
                                        $http({
                                            method: "POST",
                                            url: config.urlBase + "/user/serviceMenu/delete",
                                            data: r.id
                                        }).then(function(result){
                                            if (result.data.status == 200) {
                                                alertOrConfirm.successAlert("删除成功!");
                                                load();
                                            } else {
                                                alertOrConfirm.failAlert("删除失败!");
                                            }
                                        }, function() {
                                            alertOrConfirm.failAlert("删除失败!");
                                        })
                                    };
                                    alertOrConfirm.deleteConfirm(deletefun);
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
                        load();
                    }
                };
                $scope.load = load;
                $scope.add = function () {
                    $rootScope.modal = $modal.open({
                        templateUrl: "app/views/service/service.card.html",
                        backdrop: "static",
                        keyboard: false,
                        controller: function ($scope) {
                            $scope.service = {};
                            $scope.pictureMDB = {};
                            $scope.others = angular.copy(others);
                            $scope.showOldPic0 = true;
                            $scope.showOldPic1 = true;
                            $scope.typeList = typeList;
                            uploaderFun($scope, 0);
                            uploaderFun($scope, 1);
                            categoryListService.query("service_type").then(function (data) {
                                $scope.serviceTypeList = data.list;
                            });
                            $scope.closeModal = function () {
                                $scope.modal.close();
                                load();
                            };
                            //保存提交
                            $scope.save = function () {
                                saveFun($scope);
                            }
                        }
                    })
                }
            },
            link: function () {
            },
            templateUrl: 'app/views/service/service.list.html',
            controllerAs: 'ctrl',
            bindToController: true
        };
    });
})();
