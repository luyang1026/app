/**
 * Created by mentongwu on 16-2-25.
 */
'use strict';
(function () {
    var app = angular.module('swalk.butlerService');
    app.directive('swalkButlerServiceList', function () {
        return {
            restrict: 'E',
            scope: {},
            replace: true,
            controller: function controller($rootScope, $q, config, $scope, $http, $stateParams, $modal, $timeout,
                                            categoryListService, fileReader, FileUploader, $cookies, alertOrConfirm,waiting,
                                            aspectRatio) {
                $scope.releaseFlag = false;
                $scope.changedPriority = [];
                $scope.picLength = '';
                //截取path后的id
                function getPicId(str) {
                    var str = str;
                    var arr = str.split("/");
                    var val = arr[arr.length - 1];
                    return val;
                }

                //get项目列表
                var getButlerListFun = function (scope) {
                    categoryListService.query("housekeeper_type").then(function (data) {
                        scope.categoryList = data.list;
                    });
                };
                getButlerListFun($scope);
                //初始化资产名称
                var assetSelectize = function (scope) {
                    $http({
                        method: "GET",
                        url: config.urlBase + "/user/assetInfo/listForSelectize",
                        params: {
                            limit: config.selectizeSize,
                            noOrName: scope.butler.assetName || "",
                            assetId: scope.butler.assetId
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
                                items:[scope.butler.assetId],
                                create: false,
                                load: function (input, callback) {
                                    $http({
                                        method: "GET",
                                        url: config.urlBase + "/user/assetInfo/listForSelectize",
                                        params: {
                                            limit: config.selectizeSize,
                                            noOrName: input,
                                            assetId: scope.butler.assetId
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
                var changePriFun = function (scope) {
                    var deferred = $q.defer();
                    if (scope.changedPriority.length == 0) {
                        deferred.resolve();
                    } else {
                        var changeCount = 0;
                        for (var i = 0; i < scope.changedPriority.length; i++) {
                            var pic = scope.changedPriority[i];
                            var id = getPicId(pic.path);
                            $http({
                                method: "GET",
                                url: config.urlBase + '/user/pictureManage/changePriority/' + id + '/' + pic.priority
                            }).success(function (result) {
                                changeCount++;
                                if (changeCount == scope.changedPriority.length) {
                                    deferred.resolve(result);
                                }
                            }).error(function (result) {
                                deferred.reject(result);
                            });
                        }
                    }
                    return deferred.promise;
                };
                //保存
                var saveFun = function (scope, flag) {
                    //阻止重复提交
                    scope.holdDoubleClick = true;
                    scope.uploaderNum = 0;
                    scope.successImages = [];
                    scope.successCount = [];
                    //失败次数，初始化
                    scope.failNum = 0;
                    //检查优先级是否有重复，检查优先级是否具有1
                    if (!checkPriority(scope, scope.uploader2.queue, scope.pictureUrlList)) {
                        //阻止重复提交
                        scope.holdDoubleClick = false;
                        return false;
                    } else {
                        if(scope.uploader2.queue.length > 0) {
                            scope.loadingModel = waiting.loading("图片上传中，请等待。。。");
                        }
                        if (flag != 1) {
                            //修改权重
                            changePriFun(scope);
                        }
                        $http({
                            method: "POST",
                            url: config.urlBase + "/user/butler/save",
                            data: scope.butler
                        }).success(function (result) {
                            if (result.status == 200) {
                                scope.saveSuccess = true;
                                scope.butler.id = result.data.id;
                                if(scope.uploader2.queue.length <= 0 ){
                                    //阻止重复提交
                                    scope.holdDoubleClick = false;
                                    alertOrConfirm.successAlert("保存成功");
                                    $rootScope.modal.close();
                                    load();
                                }
                                //添加图片
                                for (var i = 0; i < scope.uploader2.queue.length; i++) {
                                    scope.uploader2.queue[i].upload();
                                }

                            } else if (result.status == 1000){
                                alertOrConfirm.failAlert("保存失败,保存数据格式错误");
                                scope.saveFail = true;
                            } else {
                                alertOrConfirm.failAlert("保存失败");
                                scope.saveFail = true;
                            }
                        }).error(function () {
                            alertOrConfirm.failAlert("保存失败");
                            scope.saveFail = true;
                        });
                    }
                };
                //获取图片
                var getPictureUrlListFun = function (scope) {
                    $http({
                        method: "GET",
                        url: config.urlBase + '/user/pictureManage/getPicInfo/' + scope.butler.id + '/butler_picture'
                    }).then(function (data) {
                        scope.pictureUrlList = data.data;
                        scope.picLength = data.data.length;
                    }, function () {
                        alertOrConfirm.failAlert("获取图片失败!");
                    })
                };


                var uploaderFun = function (scope) {
                    //下载
                    var uploader = scope.uploader2 = new FileUploader({
                        url: config.urlBase + "/user/pictureManage/saveButlerPic",
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

                    uploader.onWhenAddingFileFailed = function (item /*{File|FileLikeObject}*/, filter, options) {
                        if(filter.name == 'imageFilter'){
                            alertOrConfirm.failAlert("格式不正确，只能上传jpg,bmp或png格式文件");
                        }else if(filter.name == 'sizeFilter'){
                            var mb = config.imageSize / 1048576;
                            alertOrConfirm.failAlert("单张图片不能超过"+ mb +"M");
                        }
                    };
                    uploader.onAfterAddingFile = function (fileItem) {

                        // console.info('onAfterAddingFile', fileItem);
                        scope.fileitem = '';
                        fileItem.isPro = '未上传';
                        scope.showOldPic0 = false;
                        fileItem.priority = scope.index;
                        scope.listA.push(scope.index);
                        scope.index++;

                    };
                    uploader.onBeforeUploadItem = function (item) {
                        item.formData.splice(0,1);
                        item.formData.push({
                            foreignId: scope.butler.id,
                            priority: item.priority
                        });
                        // console.info('onBeforeUploadItem', item);
                    };
                    uploader.onProgressItem = function (fileItem, progress) {
                        fileItem.isPro = '正在上传';
                        // console.info('onProgressItem', fileItem, progress);
                    };
                    uploader.onSuccessItem = function (fileItem, response, status, headers) {
                        scope.uploaderNum++;
                        if(response.data != null){
                            fileItem.isPro = '上传成功';
                            scope.successImages.push({
                                priority: response.data.priority,
                                path: response.data.path
                            });

                            scope.successCount.push(scope.uploaderNum-1);
                        }else{
                            fileItem.isPro = '上传失败';
                            console.log(1);
                            scope.failNum++;
                        }
                        if(scope.uploader2.queue.length == scope.uploaderNum){
                            scope.pictureUrlList = scope.pictureUrlList || [];
                            for(var j = 0; j < scope.successImages.length; j++){
                                scope.pictureUrlList.push(scope.successImages[j]);
                            }
                            for(var j = scope.successCount.length-1;j>= 0;j--){
                                scope.uploader2.queue.splice(scope.successCount[j],1)
                            }
                            if(scope.failNum == 0){
                                scope.loadingModel();
                                alertOrConfirm.successAlert("保存成功!");
                                $rootScope.modal.close();
                                load();

                            }else{
                                scope.loadingModel();
                                var text = "上传的图片中有" + scope.failNum + "张保存失败！请重新上传！";
                                scope.picLength = scope.picLength + scope.uploaderNum - scope.failNum;
                                alertOrConfirm.successAlert(text);
                            }
                            //阻止重复提交
                            scope.holdDoubleClick = false;
                            scope.loadingModel();
                        }
                    };
                    uploader.onErrorItem = function (fileItem, response, status, headers) {
                        fileItem.isPro = '上传失败';
                        scope.loadingModel();
                        scope.uploaderNum++;
                        scope.failNum++;
                    };
                    uploader.onCancelItem = function (fileItem, response, status, headers) {
                    };
                    uploader.onCompleteItem = function (fileItem, response, status, headers) {
                        // console.info('onCompleteItem', fileItem, response, status, headers);
                    };
                };


                var load = function () {
                    $http({
                        method: "POST",
                        url: config.urlBase + "/user/butler/list",
                        params: {
                            offset: ($scope.paginationConf.currentPage - 1) * $scope.paginationConf.itemsPerPage,
                            limit: $scope.paginationConf.itemsPerPage,
                            assetName: $scope.searchVal,
                            selectItem: $scope.selectItem
                        }
                    }).then(function (result) {
                        $scope.butlerlist = result.data.data.list;
                        $scope.paginationConf.totalItems = result.data.data.count;
                        if ($scope.butlerlist !== null) {
                            $scope.butlerlist.forEach(function (r) {
                                //详情和修改两个按钮都是调用的这个方法
                                r.detail = function (flag) {
                                    $rootScope.modal = $modal.open({
                                        templateUrl: "app/views/butlerService/butlerService.card.html",
                                        backdrop: "static",
                                        controller: function ($scope) {
                                            $scope.butler = r;
                                            $scope.editorInfo = function () {
                                                $scope.isEditor = true;
                                            };
                                            $scope.listA = [];
                                            $scope.index = 1;
                                            $scope.picCount = 0;
                                            $scope.saveTotel = false;

                                            $scope.updateOrSelect = function () {
                                                if (flag == "1") {
                                                    $scope.editorInfo();
                                                    $scope.isRead = true;
                                                    $scope.selectPicAble = false;
                                                    $scope.detailShow = false;
                                                    $scope.changedPriority = [];

                                                    //删除图片
                                                    $scope.delete = function (index, picInfo) {
                                                        var id = getPicId(picInfo.path);
                                                        var deleteImageFun = function(){
                                                            //阻止重复提交
                                                            $scope.holdDoubleClick = true;
                                                            $http({
                                                                method: "GET",
                                                                url: config.urlBase + '/user/pictureManage/deletePicture/' + id
                                                            }).then(function () {
                                                                $scope.pictureUrlList.splice(index,1);
                                                                $scope.picLength = $scope.picLength - 1;
                                                                //阻止重复提交
                                                                $scope.holdDoubleClick = false;
                                                                alertOrConfirm.successAlert("删除成功");
                                                            },function(){
                                                                alertOrConfirm.successAlert("删除失败");
                                                                //阻止重复提交
                                                                $scope.holdDoubleClick = false;
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
                                                    }
                                                } else {
                                                    $scope.isRead = false;
                                                    $scope.selectPicAble = true;
                                                    $scope.saveTotel = false;
                                                    $scope.detailShow = true;
                                                }
                                            };

                                            //添加图片
                                            $scope.showOldPic0 = true;
                                            getPictureUrlListFun($scope);
                                            uploaderFun($scope);

                                            $scope.updateOrSelect();
                                            $scope.closeModal = function () {
                                                $scope.modal.close();
                                                load();
                                            };

                                            $scope.getOnebutlerService = function () {
                                                $http({
                                                    method: "POST",
                                                    url: config.urlBase + "/user/butler/detail/" + r.id,
                                                    params: {
                                                        id: r.id
                                                    }
                                                }).success(function (data) {
                                                    $scope.butler = data;
                                                })
                                            };
                                            $scope.getOnebutlerService();
                                            getButlerListFun($scope);
                                            //资产selectize
                                            $scope.assetList = [{id:$scope.butler.assetId, assetName: $scope.butler.assetName}];
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
                                            url: config.urlBase + "/user/butler/delete/" + r.id
                                        }).success(function (data) {
                                            load();
                                        })
                                    };
                                    alertOrConfirm.deleteConfirm(deleteFun);
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
                $scope.reset = function(){
                    $scope.searchVal = '';
                    $scope.searchInfo = false;
                    load();
                };
                $scope.load = function(){
                    $scope.searchValBackup = angular.copy($scope.searchVal);
                    if(!$scope.searchVal){
                        $scope.searchInfo = false;
                        load();
                    }else{
                        $scope.searchInfo = true;
                        load();
                    }
                };
                $scope.add = function () {
                    $rootScope.modal = $modal.open({
                        templateUrl: "app/views/butlerService/butlerService.card.html",
                        backdrop: "static",
                        controller: function ($scope) {
                            $scope.releaseFlag = true;
                            $scope.addFlag = true;
                            $scope.picObjs = [];
                            $scope.butler = {};
                            $scope.butler.assetId = "";
                            $scope.closeModal = function () {
                                $scope.modal.close();
                                load();
                            };
                            $scope.butler.date = new Date();
                            $scope.isEditor = true;
                            $scope.showButton = true;
                            getButlerListFun($scope);
                            $scope.index = 1;
                            $scope.listA = [];
                            //添加图片
                            $scope.showOldPic0 = true;
                            uploaderFun($scope);

                            assetSelectize($scope);

                            $scope.assign = function () {
                                saveFun($scope, 1);
                            };
                            $scope.editorInfo = function () {
                                $scope.showButton = true;
                                $scope.beginEdit = true;
                            };

                            $scope.isRead = true;
                            $scope.selectPicAble = true;
                            $scope.saveTotel = true;

                        }
                    })
                };
            },
            link: function () {
            },
            templateUrl: 'app/views/butlerService/butlerService.list.html',
            controllerAs: 'ctrl',
            bindToController: true
        };
    });
})();
