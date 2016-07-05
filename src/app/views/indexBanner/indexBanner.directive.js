
/**
 * Created by zhangjiayu on 2016/3/24.
 */
'use strict';
(function(){
    var app = angular.module('swalk.indexBanner');
    app.directive('swalkIndexBannerList', function () {
        return {
            restrict: 'E',
            scope: {},
            replace: true,
            controller: function controller($rootScope, $scope, $http, $timeout, $stateParams, $modal, config,fileReader,
                                            $cookies,$q,FileUploader, alertOrConfirm, waiting){
                //初始化优先值
                $scope.index = 1;
                //初始化链接
                $scope.link = '';
                //初始化删除图片、改变的优先级
                $scope.picLength = 0;
                $scope.deletedPic = [];
                $scope.changedPriority = [];
                //成功上传的图片
                $scope.successPics = [];
                //初始化单个保存按钮
                $scope.saveButton = '请保存';
                //截取path后的id
                function getPicId(str){
                    var str = str;
                    var arr = str.split("/");
                    var val = arr[arr.length - 1];
                    return val;
                }
                //删除图片
                var delImgFun = function(scope,id){
                    var deferred = $q.defer();
                    scope.holdDoubleClick = true;
                    $http({
                        method: "GET",
                        url: config.urlBase + '/user/pictureManage/deletePicture/' + id
                    }).success(function(result){
                        deferred.resolve(result);
                    });
                    return deferred.promise;
                };

                //检查优先级是否有重复，检查优先级是否具有1
                var checkPriority = function(scope,uploaderPicList,oldPicList){
                    var priorityArry = [];
                    if(uploaderPicList){
                        for(var i = 0; i<uploaderPicList.length;i++){
                            priorityArry.push(uploaderPicList[i].priority)
                        }
                    }
                    if(oldPicList) {
                        for(var i = 0; i < oldPicList.length; i++) {
                            priorityArry.push(oldPicList[i].priority)
                        }
                    }
                    priorityArry.sort();
                    for(var i = 0;i<priorityArry.length;i++) {
                        if(priorityArry[i] == priorityArry[i+1]) {
                            alertOrConfirm.failAlert("优先级不能重复，请修改优先级后再保存!");
                            return false;
                        }
                    }
                    if(priorityArry[0] == 0){
                        alertOrConfirm.failAlert("优先级不能为0或空，请修改优先级后再保存!");
                        return false;
                    }
                    return true;
                };
                //修改权重/链接
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
                                url: config.urlBase + '/user/pictureManage/changePriority/' + id,
                                params: {
                                    linkedPath: pic.linkedPath,
                                    priority: pic.priority
                                }
                            }).success(function (result) {
                                if(result.status != 500){
                                    changeCount++;
                                    if (changeCount == scope.changedPriority.length) {
                                        deferred.resolve(result);
                                    }
                                }else{
                                    alertOrConfirm.failAlert(result.msg);
                                    pic.msg = '更新权重失败';
                                    deferred.reject(result);
                                }
                            }).error(function (result) {
                                deferred.reject(result);
                            });
                        }
                    }
                    return deferred.promise;
                };
                var uploaderFun = function(scope) {
                    //下载
                    var uploader = scope.uploader2 = new FileUploader({
                        url: config.urlBase + "/user/pictureManage/saveBannerPic",
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
                    uploader.onAfterAddingFile = function (fileItem) {
                        scope.fileitem = '';
                        fileItem.isPro = '未上传';
                        //scope.showOldPic0 = false;
                        fileItem.priority = scope.index;
                        //scope.listA.push(scope.index);
                        scope.index++;

                        //初始化link
                        fileItem.link = '';
                    };
                    uploader.onBeforeUploadItem = function (item) {
                        if (item.link != "") {
                            item.formData.push({
                                priority: item.priority,
                                linkedPath: item.link
                            });
                        }
                    };
                    uploader.onProgressItem = function (fileItem, progress) {
                        fileItem.isPro = '正在上传';
                    };
                    uploader.onSuccessItem = function (fileItem, response, status, headers) {
                        if (response.status == 200) {
                            fileItem.isPro = '上传成功';
                            scope.successPics.push(scope.uploaderUpImg);
                            scope.uploaderUpImg++;
                            //判断是否最后一张图片是否执行
                            if(scope.uploader2.queue.length == scope.uploaderUpImg){
                                //在判断全部成功
                                if (scope.successPics.length == scope.uploaderUpImg) {
                                    scope.loadingModel();
                                    alertOrConfirm.successAlert("保存成功");
                                    scope.uploader2.queue.splice(0,scope.uploader2.queue.length);
                                    load();
                                } else {
                                    alertOrConfirm.failAlert("保存失败");
                                    load();
                                }
                            }
                        } else if (response.status == 1000) {
                            scope.uploaderUpImg++;
                            fileItem.isPro = '上传失败';
                        } else {
                            scope.uploaderUpImg++;
                            fileItem.isPro = '上传失败';
                        }
                    };
                    uploader.onErrorItem = function (fileItem, response, status, headers) {
                        scope.uploaderUpImg++;
                        fileItem.isPro = '上传失败';
                    };
                    uploader.onCancelItem = function (fileItem, response, status, headers) {
                    };
                    uploader.onCompleteItem = function (fileItem, response, status, headers) {
                    };
                };
                uploaderFun($scope);
                var load = function(){
                    $http({
                        method: 'GET',
                        url: config.urlBase + '/user/pictureManage/getBannerInfo'
                    }).success(function(data){
                        $scope.pictureUrlList = data;
                        $scope.picLength = data.length;

                        $scope.pictureUrlList.forEach(function(r){
                            r.msg = '已上传';
                            r.picInfoBackup = angular.copy(r);
                            $scope.link = r.linkedPath;
                            //删除图片
                            r.delete = function(index, picInfo) {
                                var deletePic = function() {
                                    var id = getPicId(picInfo.path);
                                    delImgFun($scope,id).then(function(result){
                                        $scope.pictureUrlList.splice(index, 1);
                                        $scope.picLength = $scope.picLength -1;
                                        $scope.holdDoubleClick = false;
                                    });
                                };
                                alertOrConfirm.deleteTextConfirm("请确认是否删除该张图片!", deletePic);
                            };
                            //初始化改变的优先级
                            $scope.changedPriority = [];
                            //储存改变的优先级/链接
                            $scope.changePriority = function (picInfo) {
                                $scope.changedPriority.push(picInfo);
                                Array.prototype.unique = function(){
                                    var res = [this[0]];
                                    for(var i = 1; i < this.length; i++){
                                        var repeat = false;
                                        for(var j = 0; j < res.length; j++){
                                            if(this[i] == res[j]){
                                                repeat = true;
                                                break;
                                            }
                                        }
                                        if(!repeat){
                                            res.push(this[i]);
                                        }
                                    }
                                    return res;
                                };
                                $scope.changedPriority = $scope.changedPriority.unique();
                            };
                        });
                        if ($scope.successPics.length != 0) {
                            for (var i = ($scope.successPics.length -1); i >= 0; i--) {
                                $scope.uploader2.queue.splice($scope.successPics[i], 1);
                            }
                        }
                    });
                };
                load();

                var checkLink = function(scope){
                    for(var i = 0; i<scope.uploader2.queue.length;i++){
                        if(scope.uploader2.queue[i].link == ''){
                            return false;
                        }
                    }
                    return true;
                };
                $scope.saveFun = function(){

                    //检查优先级是否有重复
                    if(!checkPriority($scope,$scope.uploader2.queue,$scope.pictureUrlList)){
                        return false;
                    }else if(!checkLink($scope)){
                        alertOrConfirm.failAlert("链接不能为空");
                    } else {
                        if($scope.uploader2.queue.length > 0){
                            $scope.loadingModel = waiting.loading("正在上传图片，请等待。。。");
                        }
                        changePriFun($scope).then(function(){
                            if($scope.uploader2.queue.length == 0){
                                alertOrConfirm.successAlert("保存成功");
                                load();
                            } else {
                                $scope.uploaderUpImg = 0;
                                $scope.successPics = [];
                                //添加图片
                                for(var i = 0; i<$scope.uploader2.queue.length;i++){
                                    $scope.uploader2.queue[i].upload();
                                }
                            }
                        });

                    }
                };

                $scope.add = function(){
                    $rootScope.modal = $modal.open({
                        templateUrl: 'app/views/indexBanner/indexBanner.card.html',
                        backdrop: 'static',
                        keyboard: false,
                        controller: function ($scope) {
                            $scope.saveSuccess = false;
                            $scope.saveFail = false;
                            $scope.enableClick = true;

                            $scope.save = function () {
                                saveFun($scope);
                            }
                        }
                    })
                }

            },
            link: function (){},
            templateUrl: 'app/views/indexBanner/indexBanner.list.html',
            controllerAs: 'ctrl',
            bindToController: true
        }
    });
})();