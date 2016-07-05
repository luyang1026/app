'use strict';
(function () {
    var app = angular.module('swalk.repair');
    app.directive('swalkRepairList', function () {
        return {
            restrict: 'E',
            scope: {},
            replace: true,
            controller: function controller($rootScope, $q, config, $scope, $http, $stateParams, $modal, $timeout,
                                            categoryListService, fileReader, typeConversion, FileUploader, $cookies,
                                            alertOrConfirm,waiting, aspectRatio) {
                //分页
                $scope.paginationConf = {
                    itemsPerPage: 10,
                    totalItems: -1, //设置一个初始总条数，判断加载状态
                    onChange: function () {
                        load();
                    }
                };
                //初始化删除的图片
                $scope.deletedPic = [];
                //初始化改变的优先级
                $scope.changedPriority = [];
                //截取图片的id
                function getPicId(str) {
                    var str = str;
                    var arr = str.split("/");
                    var val = arr[arr.length - 1];
                    return val;
                }

                //get维修列表
                var getRepairFun = function (scope) {
                    categoryListService.query("repair_type").then(function (data) {
                        scope.categoryList = data.list;
                    });
                };
                getRepairFun($scope);
                //初始化资产名称
                var assetSelectize = function (scope) {
                    $http({
                        method: "GET",
                        url: config.urlBase + "/user/assetInfo/listForSelectize",
                        params: {
                            limit: config.selectizeSize,
                            noOrName: scope.repair.assetName || "",
                            assetId: scope.repair.assetId
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
                                items: [scope.repair.assetId],
                                create: false,
                                load: function (input, callback) {
                                    $http({
                                        method: "GET",
                                        url: config.urlBase + "/user/assetInfo/listForSelectize",
                                        params: {
                                            limit: config.selectizeSize,
                                            noOrName: input,
                                            assetId: scope.repair.assetId
                                        }
                                    }).success(function (results) {
                                        $('#assetSelectize')[0].selectize.clearOptions();
                                        callback(results);
                                    }).error(function () {
                                        callback();
                                    })
                                }
                            });
                        });
                    }).error(function () {
                    })
                };

                //检查优先级是否有重复，检查优先级是否具有1
                var checkPriority = function (scope, uploaderPicList, oldPicList) {
                    var priorityArry = [];
                    if (uploaderPicList) {
                        for (var i = 0; i < uploaderPicList.length; i++) {
                            priorityArry.push(uploaderPicList[i].priority)
                        }
                    }
                    if (oldPicList) {
                        for (var i = 0; i < oldPicList.length; i++) {
                            priorityArry.push(oldPicList[i].priority)
                        }
                    }
                    priorityArry.sort();
                    for (var i = 0; i < priorityArry.length; i++) {
                        if (priorityArry[i] == priorityArry[i + 1]) {
                            alertOrConfirm.failAlert("优先级不能重复，请修改优先级后再保存");
                            return false;
                        }
                    }
                    if (priorityArry[0] == 0) {
                        alertOrConfirm.failAlert("优先级不能为0或空，请修改优先级后再保存");
                        return false;
                    }
                    return true;
                };

                //修改权重
                var changeCount = 0;
                var changePriFun = function (scope) {
                    var deferred = $q.defer();
                    if (scope.changedPriority.length == 0) {
                        deferred.resolve();
                    } else {
                        changeCount = 0;
                        for (var i = 0; i < scope.changedPriority.length; i++) {
                            var pic = scope.changedPriority[i];
                            var id = getPicId(pic.path);
                            $http({
                                method: "GET",
                                url: config.urlBase + '/user/pictureManage/changePriority/' + id + '/' + pic.priority
                            }).then(function (result) {
                                if (result.data.status == 200) {
                                    changeCount++;
                                    if (changeCount == scope.changedPriority.length) {
                                        deferred.resolve(result);
                                    }
                                } else {
                                    deferred.reject(result);
                                }
                            }, function (result) {
                                deferred.reject(result);
                            });
                        }
                    }
                    return deferred.promise;
                };
                var getPictureUrlListFun = function (scope, type) {
                    //获取房型图片
                    $http({
                        method: "GET",
                        url: config.urlBase + '/user/pictureManage/getPicInfo/' + scope.repair.id + '/' + 'repair_picture'
                    }).then(function (data) {
                        scope.pictureUrlList = data.data;
                        scope.houseTypeLength = data.data.length;

                        scope.picObjs = data.data;

                    }, function () {
                        alertOrConfirm.failAlert("获取图片失败!");
                    });
                };

                var uploaderFun = function (scope) {
                    //下载

                    var uploader = scope.uploader0 = new FileUploader({
                        url: config.urlBase + "/user/pictureManage/saveRepairPic",
                        headers: {'token': $cookies.get("token")}
                    });

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

                    //所有新增图片都已准备就绪之后，判断图片的宽高比
                    uploader.onAfterAddingAll = function (addedItems) {
                        var param = {
                            items: addedItems,
                            queue: uploader.queue,
                            imgWidth: 324,
                            imgHeight: 136
                        };
                        aspectRatio.query(param);

                    };

                    uploader.onAfterAddingFile = function (fileItem) {
                        scope.fileitem = '';
                        fileItem.isPro = '未上传';
                        fileItem.priority = scope.index;
                        scope.index++;
                    };
                    uploader.onBeforeUploadItem = function (item) {
                        item.formData.push({
                            foreignId: scope.repair.id,
                            priority: item.priority
                        });
                    };


                    uploader.onProgressItem = function (fileItem, progress) {
                        fileItem.isPro = '正在上传';
                    };
                    uploader.onSuccessItem = function (fileItem, response, status, headers) {
                        scope.uploaderImgNum++;
                        scope.pictureUrlList = scope.pictureUrlList || [];
                        if (response.status == 200) {
                            scope.picSuccess.push(scope.uploaderImgNum - 1);
                            scope.pictureUrlList.push(response.data);
                            fileItem.isPro = '上传成功';
                        } else if (response.status == 1000) {
                            fileItem.isPro = '上传失败';
                            alertOrConfirm.failAlert("图片上传失败,参数传输错误");
                            scope.loadingModel();
                        } else {
                            fileItem.isPro = '上传失败';
                            alertOrConfirm.failAlert("图片上传失败");
                            scope.loadingModel();
                        }
                        if(scope.uploaderImgNum == scope.uploader0.queue.length){
                            scope.loadingModel();
                            if (scope.uploaderImgNum == scope.picSuccess.length) {
                                $rootScope.modal.close();
                                alertOrConfirm.successAlert("保存成功");
                                load();
                                scope.holdDoubleClick = false;
                            } else {
                                for(var j = scope.picSuccess.length - 1; j >=0 ; j--) {
                                    scope.uploader0.queue.splice(scope.picSuccess[j], 1);
                                }
                                scope.holdDoubleClick = false;
                            }
                        }
                    };
                    uploader.onErrorItem = function (fileItem, response, status, headers) {
                        alertOrConfirm.failAlert("图片上传失败");
                        fileItem.isPro = '上传失败';
                    };
                    uploader.onCancelItem = function (fileItem, response, status, headers) {
                    };
                    uploader.onCompleteItem = function (fileItem, response, status, headers) {

                    };
                };

                var load = function () {
                    $http({
                        method: "POST",
                        url: config.urlBase + "/user/repair/list",
                        params: {
                            offset: ($scope.paginationConf.currentPage - 1) * $scope.paginationConf.itemsPerPage,
                            limit: $scope.paginationConf.itemsPerPage,
                            assetName: $scope.searchVal,
                            selectItem: $scope.selectItem
                        }
                    }).success(function (data) {
                        $scope.repairlist = data.data.list;
                        $scope.paginationConf.totalItems = data.data.count;
                        if (data.data.list !== null) {
                            $scope.repairlist.forEach(function (r) {
                                //详情和修改两个按钮都是调用的这个方法
                                r.detail = function (flag) {
                                    $rootScope.modal = $modal.open({
                                        templateUrl: "app/views/repair/repair.card.html",
                                        backdrop: "static",
                                        controller: function ($scope) {
                                            //初始化删除的图片
                                            $scope.deletedPic = [];
                                            //初始化改变的优先级
                                            $scope.changedPriority = [];
                                            $scope.repair = r;
                                            $scope.editorInfo = function () {
                                                $scope.beginEdit = true;
                                                $scope.showButton = true;
                                                $scope.releaseFlag = false;
                                            };
                                            $scope.picCount = 0;
                                            $scope.saveTotel = false;
                                            $scope.index = 1;
                                            getPictureUrlListFun($scope);
                                            uploaderFun($scope);
                                            //删除图片
                                            $scope.delete = function (index, picInfo) {
                                                var picId = getPicId(picInfo.path);
                                                var deleteImageFun = function(){
                                                    $scope.holdDoubleClick = true;
                                                    $http({
                                                        method: "GET",
                                                        url: config.urlBase + '/user/pictureManage/deletePicture/' + picId
                                                    }).then(function (result) {
                                                        $scope.holdDoubleClick = false;

                                                        if (result.data.status == 200) {
                                                            $scope.pictureUrlList.splice(index, 1);
                                                            $scope.houseTypeLength = $scope.houseTypeLength - 1;
                                                            alertOrConfirm.successAlert("删除成功！")
                                                        } else {
                                                            alertOrConfirm.failAlert("删除失败！")
                                                        }
                                                    }, function () {
                                                        $scope.holdDoubleClick = false;
                                                        alertOrConfirm.failAlert("删除失败！")
                                                    });
                                                };
                                                alertOrConfirm.deleteTextConfirm("是否删除此张图片？",deleteImageFun);
                                            };
                                            //储存改变的优先级
                                            $scope.changePriority = function (picInfo) {
                                                $scope.changedPriority.push(picInfo);
                                                for (var i = 0; i < $scope.changedPriority.length; i++) {
                                                    var newId = getPicId($scope.changedPriority[$scope.changedPriority.length - 1].path);
                                                    var nowId = getPicId($scope.changedPriority[i].path);
                                                    if (newId == nowId && i != 0 && i != $scope.changedPriority.length - 1) {
                                                        $scope.changedPriority.splice(i, 1);
                                                    }
                                                }
                                            };
                                            $scope.updateOrSelect = function () {
                                                if (flag == "1") {
                                                    $scope.editorInfo();
                                                    $scope.isRead = true;
                                                    $scope.selectPicAble = false;

                                                    $scope.detailShow = false;

                                                } else {
                                                    $scope.isRead = false;
                                                    $scope.selectPicAble = true;
                                                    $scope.saveTotel = false;
                                                    $scope.detailShow = true;

                                                }
                                            };
                                            //添加附件
                                            $scope.getFile = function (inputName) {
                                                getFile($scope);
                                            };
                                            $scope.updateOrSelect();
                                            $scope.closeModal = function () {
                                                $scope.modal.close();
                                            };
                                            $scope.getOneReapir = function () {
                                                $http({
                                                    method: "POST",
                                                    url: config.urlBase + "/user/repair/detail/" + r.id,
                                                    params: {
                                                        id: r.id
                                                    }
                                                }).success(function (data) {
                                                    $scope.repair = data;
                                                })
                                            };
                                            $scope.getOneReapir();
                                            getRepairFun($scope);
                                            //资产selectize
                                            $scope.assetList = [{id:$scope.repair.assetId, assetName: $scope.repair.assetName}];
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
                                            };
                                        }
                                    })
                                };
                                r.delete = function () {
                                    var deleteFun = function () {
                                        $http({
                                            method: "GET",
                                            url: config.urlBase + "/user/repair/delete/" + r.id
                                        }).success(function (data) {
                                            load();
                                        })
                                    };
                                    alertOrConfirm.deleteConfirm(deleteFun);
                                };
                            })
                        }
                    });
                    $scope.getData = function () {
                        $scope.flushPage = false;
                        load();
                    };


                };
                //查询
                $scope.load = function () {
                    load();
                };
                //保存
                var saveFun = function (scope) {
                    scope.holdDoubleClick = true;
                    scope.picSuccess = [];
                    //检查优先级是否有重复，检查优先级是否具有1
                    if (!checkPriority(scope, scope.uploader0.queue, scope.pictureUrlList)) {
                        return false;
                    } else {
                        if(scope.uploader0.queue.length > 0){
                            scope.loadingModel = waiting.loading("图片上传中，请等待。。。");
                        }
                        //上传的数据
                        scope.uploadVal = angular.copy(scope.repair);
                        scope.uploadVal.fee = typeConversion.doubleToLong(scope.repair.fee);
                        $http({
                            method: "POST",
                            url: config.urlBase + "/user/repair/save",
                            data: scope.uploadVal
                        }).then(function (result) {
                            if (result.data.status == 200) {
                                scope.repair.id = result.data.data.id;
                                scope.saveSuccess = true;
                                scope.selectPicAble = false;
                                scope.flagPic = true;
                                scope.uploaderImgNum = 0;
                                //修改权重后上传图片
                                changePriFun(scope).then(function () {
                                    //添加图片
                                    for (var i = 0; i < scope.uploader0.queue.length; i++) {
                                        scope.uploader0.queue[i].upload();
                                    }
                                    if (scope.uploader0.queue.length == 0) {
                                        $rootScope.modal.close();
                                        alertOrConfirm.successAlert("保存成功");
                                        load();
                                        scope.holdDoubleClick = false;
                                    }
                                }, function () {
                                    $rootScope.modal.close();
                                    alertOrConfirm.failAlert("修改图片权限失败");
                                    load();
                                    scope.holdDoubleClick = false;
                                });
                            } else if (result.data.status == 1000) {
                                scope.holdDoubleClick = false;
                                alertOrConfirm.failAlert("保存失败,保存的数据格式错误");
                            } else {
                                scope.holdDoubleClick = false;
                                alertOrConfirm.failAlert("保存失败");
                            }
                        }, function () {
                            scope.holdDoubleClick = false;
                            alertOrConfirm.failAlert("保存失败");
                        });
                    }
                };

                $scope.add = function () {
                    $rootScope.modal = $modal.open({
                        templateUrl: "app/views/repair/repair.card.html",
                        backdrop: "static",
                        controller: function ($scope) {
                            //初始化删除的图片
                            $scope.deletedPic = [];
                            //初始化改变的优先级
                            $scope.changedPriority = [];
                            $scope.releaseFlag = true;
                            $scope.closeModal = function () {
                                $scope.modal.close();
                                load();
                            };
                            //定义repair实体类
                            $scope.repair = {};
                            $scope.repair.date = new Date();
                            $scope.repair.assetId = "";
                            $scope.picObjs = [];
                            $scope.picCount = 0;
                            $scope.beginEdit = true;
                            $scope.showButton = true;
                            getRepairFun($scope);

                            $scope.index = 1;
                            uploaderFun($scope);

                            assetSelectize($scope);
                            //$scope.searchInit();

                            $scope.assign = function () {
                                saveFun($scope);
                            };
                            // ---->
                            $scope.editorInfo = function () {
                                $scope.showButton = true;
                                $scope.beginEdit = true;
                            };

                            $scope.isRead = true;
                            $scope.selectPicAble = true;
                            $scope.saveTotel = true;

                            //添加附件
                            $scope.getFile = function (inputName) {
                                getFile($scope);
                            };
                            // $scope.editorInfo();

                        }
                    })
                };
                $scope.reset = function(){
                    $scope.searchVal = '';
                    $scope.searchInfo = false;
                    load();
                };
                //搜索
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
            },
            link: function () {
            },
            templateUrl: 'app/views/repair/repair.list.html',
            controllerAs: 'ctrl',
            bindToController: true
        };
    });
})();
