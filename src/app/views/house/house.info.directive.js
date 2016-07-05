'use strict';
(function () {
    var app = angular.module('swalk.house.info');
    app.directive('swalkHouseInfo', function () {
        return {
            restrict: 'E',
            scope: {},
            replace: true,
            controller: function ($rootScope, $q, config, $scope, $http, $stateParams, $modal, $timeout, $state, fileReader,
                                  categoryListService, FileUploader, $cookies, alertOrConfirm, $location, waiting, typeConversion,
                                  aspectRatio) {
                if($location.search().id == null && $rootScope.houseInfo != null){
                    $location.search({'id': $rootScope.houseInfo.id,'isDetail':$rootScope.houseButton});
                }else{
                    $rootScope.houseButton = $location.search().isDetail;
                }
                //房型列表
                $scope.roomList = [];
                //初始化删除的图片
                $scope.deletedPic = [];
                //初始化改变的优先级
                $scope.changedPriority = [];

                $rootScope.pictureManage = {id: null, foreignId: null, picture: null, type: "house_homepage"};
                //其他信息,计数,图片,权重计数
                $scope.houseOthers = {
                    //首页图片显示数
                    homepagePicNum: 0,
                    //详情图片显示数
                    detailPicNum: 0,
                    //详情图片数组
                    detailPics: [],
                    //详情图片权重计数
                    multipleCount: 1,
                    //是否是图片
                    isPicture: true,
                    //首页保存成功
                    homepagePicSave: true,
                    //首页保存失败
                    homepagePicSaveFail: true
                };
                $scope.housePic = [];
                //初始化按钮文字,按钮控制等
                $scope.infoPage = {
                    //页面主要信息是否可编辑
                    ableEdit: true,
                    //保存信息按钮是否不可点击(酒店信息)
                    ableSaveMessage: false,
                    //保存是否成功(酒店信息)
                    ableSaveSuccess: false,
                    //主要页面显示文字
                    wordInfoPage: "添加",
                    //房型编辑按钮文字
                    wordRoomButton: "编辑"
                };

                $rootScope.infoPageRoot = {roomCount: 1};

                //初始化房型
                var roomInitFun = function (obj, id) {
                    var room = {
                        data: obj,
                        houseTypeEntity: {id: id, name: null},
                        selectPicAble: false,
                        roomPicNum: 0,
                        roomPics: []
                    };
                    //房型设施列表
                    room.data.deviceList = [];
                    //房型服务列表
                    room.data.serviceList = [];
                    //房型原设施id集
                    room.data.oldServiceIds = [];
                    //房型原服务id集
                    room.data.oldDeviceIds = [];
                    return room;
                };

                //截取path后的id（房型）
                function getRoomPicId(str) {
                    var str = str;
                    var arr = str.split("/");
                    var val = arr[arr.length - 1];
                    return val;
                }

                //获取城市列表
                $http({
                    method: "GET",
                    url: config.urlBase + '/user/city/list'
                }).then(function (data) {
                    $scope.cities = data.data.list;
                });
                //获取物业类型列表
                categoryListService.query("property_type").then(function (data) {
                    $scope.houses = data.list;
                });

                //**************房型管理**********************//
                $scope.lists = {
                    //初始房型列表
                    houseTypeList: [],
                    //房型设施列表
                    houseTypeDeviceList: [],
                    //房型服务列表
                    houseTypeServiceList: []
                };
                //获取初始房型列表,设施列表,服务列表
                $http({
                    method: "GET",
                    url: config.urlBase + '/user/houseType/getCategoryLists/'
                }).then(function (data) {
                    //房型列表,房型设施列表,房型服务列表赋值
                    $scope.lists.houseTypeList = data.data.houseTypeList;
                    $scope.lists.houseTypeDeviceList = data.data.houseTypeDeviceList;
                    $scope.lists.houseTypeServiceList = data.data.houseTypeServiceList;

                    //为设施&服务对象添加click功能,并清空复选框选择
                    var deviceAndServiceInitFun = function (scope) {
                        angular.forEach(scope.lists.houseTypeDeviceList, function (roomDevice) {
                            roomDevice.selected = false;
                            roomDevice.deviceClick = function () {
                                var idx = scope.room.data.deviceList.indexOf(roomDevice);
                                if (idx == -1) {
                                    scope.room.data.deviceList.push(roomDevice);
                                } else {
                                    scope.room.data.deviceList.splice(idx, 1);
                                }
                            };
                        });
                        angular.forEach(scope.lists.houseTypeServiceList, function (roomService) {
                            roomService.selected = false;
                            roomService.serviceClick = function () {
                                var idx = scope.room.data.serviceList.indexOf(roomService);
                                if (idx == -1) {
                                    scope.room.data.serviceList.push(roomService);
                                } else {
                                    scope.room.data.serviceList.splice(idx, 1);
                                }
                            };
                        });
                    };
                    //检查优先级是否有重复，检查优先级是否具有1
                    var checkPriority = function (scope, uploaderPicList, oldPicList, type) {
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
                        if (priorityArry[0] != 1 && priorityArry[1] != 1 && type == 1) {
                            alertOrConfirm.failAlert("优先级中必须有一个为1，请修改优先级后再保存");
                            return false;
                        }
                        return true;
                    };
                    //初始化复选框与已选内容
                    var deviceAndServiceDisplayFun = function (scope) {
                        var devices = scope.room.data.deviceList;
                        scope.room.data.deviceList = [];
                        angular.forEach(devices, function (device) {
                            angular.forEach(scope.lists.houseTypeDeviceList, function (roomDevice) {
                                if (device.relationId == roomDevice.id) {
                                    roomDevice.selected = true;
                                    scope.room.data.deviceList.push(roomDevice);
                                }
                            })
                        });
                        var services = scope.room.data.serviceList;
                        scope.room.data.serviceList = [];
                        angular.forEach(services, function (service) {
                            angular.forEach(scope.lists.houseTypeServiceList, function (roomService) {
                                if (service.relationId == roomService.id) {
                                    roomService.selected = true;
                                    scope.room.data.serviceList.push(roomService);
                                }
                            });
                        });
                    };
                    //删除图片
                    var deleteCount = 0;
                    var delImgFun = function (scope) {
                        var deferred = $q.defer();
                        if (scope.deletedPic.length == 0) {
                            deferred.resolve();
                        } else {
                            deleteCount = 0;
                            for (var i = 0; i < scope.deletedPic.length; i++) {
                                var picId = getRoomPicId(scope.deletedPic[i].path);
                                $http({
                                    method: "GET",
                                    url: config.urlBase + '/user/pictureManage/deletePicture/' + picId
                                }).then(function (result) {
                                    if (result.data.status == 200) {
                                        deleteCount++;
                                        if (deleteCount == scope.deletedPic.length) {
                                            deferred.resolve(result);
                                        }
                                    } else {
                                        deferred.reject();
                                    }
                                }, function () {
                                    deferred.reject();
                                });
                            }
                        }
                        return deferred.promise;
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
                                var id = getRoomPicId(pic.path);
                                $http({
                                    method: "GET",
                                    url: config.urlBase + '/user/pictureManage/changePriority/' + id + '/' + pic.priority
                                }).then(function (result) {
                                    changeCount++;
                                    if (changeCount == scope.changedPriority.length) {
                                        deferred.resolve(result);
                                    }
                                }, function (result) {
                                    deferred.reject(result);
                                });
                            }
                        }
                        return deferred.promise;
                    };
                    //保存房型信息
                    var saveRoomtypeFun = function (scope) {
                        //scope.room.saveWord = "(未保存)";
                        scope.room.data.houseType = scope.room.houseTypeEntity.id;
                        scope.room.roomPicNum = scope.uploader0.queue.length + scope.pictureUrlList.length;
                        //保存房型信息

                        //检查优先级是否有重复，检查优先级是否具有1
                        if (!checkPriority(scope, scope.uploader0.queue, scope.pictureUrlList, 1)) {
                            return false;
                        } else {
                            if(scope.uploader0.queue.length > 0) {
                                scope.loadingModel = waiting.loading("图片上传中，请等待。。。");
                            }
                            $http({
                                method: "POST",
                                url: config.urlBase + '/user/houseType/save',
                                data: scope.room.data
                            }).then(function (data) {
                                if (data.data.status == 200) {
                                    //scope.room.saveWord = "(已保存)";
                                    //scope.saveSuccess = true;
                                    //scope.saveFail = false;
                                    scope.room.data.id = data.data.data.id;
                                    scope.room.data.services = data.data.data.services;
                                    scope.room.data.devices = data.data.data.devices;
                                    scope.room.selectPicAble = false;
                                    delImgFun(scope).then(function () {
                                        changePriFun(scope).then(function () {
                                            scope.houseTypeLength = scope.houseTypeLength + scope.uploader0.queue.length;
                                            //添加图片
                                            scope.imgUploadNum = 0;
                                            scope.roomPicSuccess = [];
                                            for (var i = 0; i < scope.uploader0.queue.length; i++) {
                                                scope.uploader0.queue[i].upload();
                                            }
                                            if (scope.uploader0.queue == null || scope.uploader0.queue.length == 0) {
                                                $rootScope.modalService.close();
                                                alertOrConfirm.successAlert("保存成功");
                                            }
                                        }, function () {
                                            scope.houseTypeLength = scope.houseTypeLength - deleteCount;
                                            alertOrConfirm.failAlert("修改图片权重失败！");
                                            $rootScope.modalService.close();
                                        });
                                    }, function () {
                                        scope.houseTypeLength = scope.houseTypeLength - deleteCount;
                                        alertOrConfirm.failAlert("删除图片失败！");
                                        $rootScope.modalService.close();
                                    });
                                } else if (data.data.status == 1000) {
                                    alertOrConfirm.failAlert("保存失败,数据格式错误");
                                    //scope.room.saveWord = "(未保存)";
                                    //scope.saveSuccess = false;
                                    //scope.saveFail = true;
                                } else {
                                    alertOrConfirm.failAlert("保存失败");
                                    //scope.saveSuccess = false;
                                    //scope.saveFail = true;
                                }
                            }, function () {
                                //scope.room.saveWord = "(未保存)";
                                alertOrConfirm.failAlert("保存失败");
                                //scope.saveSuccess = false;
                                //scope.saveFail = true;
                            });

                        }

                    };

                    //定义删除图片
                    var deletePicFun = function (index, id, pics) {
                        $http({
                            method: "GET",
                            url: config.urlBase + '/user/pictureManage/deletePicture/' + id
                        }).then(function (result) {
                            if (result.status == 200) {
                                pics.splice(index, 1);
                            } else {
                                pics[index].deleteFail = false;
                            }
                        }, function () {
                            pics[index].deleteFail = false;
                        });

                    };
                    //定义改变权重
                    var priorityChangePicFun = function (id, priority, scope, uploaderPic, oldPic) {
                        //检查优先级是否有重复，检查优先级是否具有1
                        if (!checkPriority(scope, uploaderPic, oldPic)) {
                            return false;
                        }
                        if (priority != '') {
                            $http({
                                method: "GET",
                                url: config.urlBase + '/user/pictureManage/changePriority/' + id + '/' + priority
                            })
                        }
                    };
                    //获取图片
                    var getPictureUrlListFun = function (scope, type) {
                        if (type == "house_type") {
                            //获取房型图片
                            if (!scope.room.data.id) {
                                return false
                            }
                            $http({
                                method: "GET",
                                url: config.urlBase + '/user/pictureManage/getPicInfo/' + scope.room.data.id + '/' + type
                            }).then(function (data) {
                                scope.pictureUrlList = data.data;
                                scope.houseTypeLength = data.data.length;
                                //$scope.room.saveWord = "(已保存)";

                            }, function () {
                                alertOrConfirm.failAlert("获取图片失败!");
                            });
                        } else {
                            //获取房源图片（首页、详情）
                            getHousePic(scope);
                        }
                    };

                    var getHousePic = function (scope) {
                        //获取房源图片（首页、详情）
                        $http({
                            method: "GET",
                            url: config.urlBase + '/user/pictureManage/getHousePhotoNumber/' + $location.search().id
                        }).then(function (data) {
                            //首页图片
                            scope.houseIndexPic = data.data.homepagePath;
                            //详情图片
                            scope.housePic = data.data.details;
                            //首页图片数量
                            scope.houseOthers.homepagePicNum = data.data.homepageNum;
                            //详情图片数量
                            scope.houseOthers.detailPicNum = data.data.detailNum;
                        }, function () {
                            alertOrConfirm.failAlert("获取图片失败!");
                        });
                    };


                    var uploaderFun = function (scope, type) {
                        //下载
                        if (type == 0) {
                            var uploader = scope.uploader0 = new FileUploader({
                                url: config.urlBase + "/user/pictureManage/saveHouseTypePic",
                                headers: {'token': $cookies.get("token")},
                            });
                        } else if (type == 1) {
                            var uploader = scope.uploader1 = new FileUploader({
                                url: config.urlBase + "/user/pictureManage/saveHouseHomepagePic",
                                headers: {'token': $cookies.get("token")}
                            });
                        } else if (type == 2) {
                            var uploader = scope.uploader2 = new FileUploader({
                                url: config.urlBase + "/user/pictureManage/saveHouseDetailPic",
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
                            if (type == 1 && uploader.queue.length > 1) {
                                uploader.queue.splice(0, 1);
                            }
                            scope.fileitem = '';
                            fileItem.isPro = '未上传';
                            if (type == 1) {
                                scope.showOldPic1 = false;
                            }
                            fileItem.priority = scope.index;
                            scope.index++;
                        };
                        if (type == 0) {
                            uploader.onBeforeUploadItem = function (item) {
                                item.formData.push({
                                    foreignId: scope.room.data.id,
                                    priority: item.priority
                                });
                            };
                        } else if (type == 1) {
                            uploader.onBeforeUploadItem = function (item) {
                                item.formData.push({
                                    foreignId: $location.search().id
                                });
                            };
                        } else if (type == 2) {
                            uploader.onBeforeUploadItem = function (item) {
                                item.formData.push({
                                    foreignId: $location.search().id,
                                    priority: item.priority
                                });
                            };
                        }
                        //所有新增图片都已准备就绪之后，判断图片的宽高比
                        uploader.onAfterAddingAll = function (addedItems) {
                            if(type == 0){
                                var param = {
                                    items: addedItems,
                                    queue: scope.uploader0.queue,
                                    imgWidth: 750,
                                    imgHeight: 460
                                };
                                aspectRatio.query(param);
                            }

                        };
                        uploader.onProgressItem = function (fileItem, progress) {
                            fileItem.isPro = '正在上传';
                        };
                        uploader.onSuccessItem = function (fileItem, response, status, headers) {
                            fileItem.isPro = '上传成功';
                            if (response.status == 200 && type == 0) {
                                fileItem.isPro = '上传成功';
                                scope.pictureUrlList.push(response.data);
                                scope.roomPicSuccess.push(scope.imgUploadNum);
                                scope.imgUploadNum++;
                                if(scope.imgUploadNum == scope.uploader0.queue.length){
                                    scope.loadingModel();
                                    if (scope.imgUploadNum == scope.roomPicSuccess.length) {
                                        $rootScope.modalService.close();
                                        scope.holdDoubleClick = false;
                                        alertOrConfirm.successAlert("修改成功");
                                    } else {
                                        for(var j = scope.roomPicSuccess.length - 1; j >=0 ; j--) {
                                            scope.uploader0.queue.splice(scope.roomPicSuccess[j], 1);
                                        }
                                    }
                                }
                            } else if (response.status == 1000 && type == 0) {
                                scope.imgUploadNum++;
                                fileItem.isPro = '上传失败';
                                alertOrConfirm.failAlert("图片上传失败,参数传输错误");
                            } else if (type == 0) {
                                scope.imgUploadNum++;
                                fileItem.isPro = '上传失败';
                                alertOrConfirm.failAlert("图片上传失败");
                            }
                            if(scope.imgType == 'houseType'){
                                var uploadImgLength = scope.uploader1.queue.length + scope.uploader2.queue.length;
                                scope.imgUploadNumHouse++;
                                if(scope.imgUploadNumHouse == uploadImgLength){
                                    $rootScope.modal.close();
                                    scope.holdDoubleClick = false;
                                    alertOrConfirm.successAlert("修改成功");
                                    scope.imgUploadNumHouse = 0;
                                }
                            }
                        };
                        uploader.onErrorItem = function (fileItem, response, status, headers) {
                            if (type == 0) {
                                scope.imgUploadNum++;
                                fileItem.isPro = '上传失败';
                                alertOrConfirm.failAlert("图片上传失败");
                            }
                            fileItem.isPro = '上传失败';
                        };
                        uploader.onCancelItem = function (fileItem, response, status, headers) {
                        };
                        uploader.onCompleteItem = function (fileItem, response, status, headers) {
                        };
                    };
                    //房型编辑初始化功能
                    var roomModifyInitFun = function (scope, room, lists) {
                        scope.room = room;
                        scope.lists = lists;
                        //模态框标题
                        scope.roomTitle = "添加房型服务";
                        //关闭模态框
                        scope.closeModal = function () {
                            scope.modalService.close();
                        };

                        scope.room.data.deviceList = scope.room.data.devices;
                        scope.room.data.serviceList = scope.room.data.services;
                        scope.pictureUrlList = [];
                        //初始化复选框
                        deviceAndServiceInitFun(scope);
                        //复选框赋值
                        deviceAndServiceDisplayFun(scope);
                        //保存选择
                        scope.saveRoomtype = function () {
                            if (scope.houseTypeForm.$invalid) {
                                alertOrConfirm.failAlert("请将信息填写完全!");
                            } else {
                                saveRoomtypeFun(scope);
                            }
                        };
                    };
                    //第三方服务相关初始化
                    var serviceInitFun = function (scope, service) {
                        service.save = function () {
                            //判断是否重复
                            Array.prototype.unique = function () {
                                var ids = [];
                                for (var i = 0; i < this.length; i++) {
                                    ids.push(this[i].serviceType.id);
                                }
                                var ary = ids.sort();
                                for (var i = 0; i < ary.length; i++) {
                                    if (ary[i] == ary[i + 1]) {
                                        return true;
                                    }
                                }
                                return false;
                            };
                            //判断是否为空
                            Array.prototype.isEmp = function () {
                                for (var i = 0; i < this.length; i++) {
                                    if (!(this[i].serviceType && this[i].houseRelation)) {
                                        return true;
                                    } else {
                                        if (!(this[i].serviceType.name)) {
                                            return true;
                                        }
                                    }

                                }
                                return false;
                            };
                            if (scope.othersServices.isEmp()) {
                                alertOrConfirm.failAlert("服务名称和价格不能为空！")
                            } else {
                                if (scope.othersServices.unique()) {
                                    alertOrConfirm.failAlert("相同的服务不能同时存在！")
                                } else {
                                    service.houseRelation.relationId = service.serviceType.id;
                                    service.houseRelation.price = typeConversion.doubleToLong(service.houseRelation.pcPrice);
                                    $http({
                                        method: "POST",
                                        url: config.urlBase + '/user/houseRelation/save',
                                        data: service.houseRelation
                                    }).then(function (result) {
                                        if (result.data.status == 200) {
                                            service.houseRelation.id = result.data.data;
                                            service.serviceSave = true;
                                        } else {
                                            alertOrConfirm.failAlert("保存失败!");
                                            service.serviceSave = false;
                                        }
                                    }, function () {
                                        alertOrConfirm.failAlert("保存失败!");
                                        service.serviceSave = false;
                                    });
                                }
                            }
                        };

                        service.change = function (flag) {
                            if (flag == "name") {
                                service.houseRelation.pcPrice = 0;
                            }
                            service.serviceSave = false;
                        };

                        service.delete = function (index) {
                            if (service.houseRelation.id !== null) {
                                var deleteFun = function () {
                                    $http({
                                        method: "POST",
                                        url: config.urlBase + '/user/houseRelation/delete',
                                        params: {
                                            id: service.houseRelation.id
                                        }
                                    }).then(function () {
                                        scope.othersServices.splice(index, 1);
                                        alertOrConfirm.successAlert("删除成功!");
                                    }, function () {
                                        alertOrConfirm.failAlert("删除失败!");
                                    });
                                };
                                alertOrConfirm.deleteConfirm(deleteFun);
                            } else {
                                scope.othersServices.splice(index, 1);
                            }
                        };
                    };

                    //展示详情页or修改页
                    if (/^MD_/.test($rootScope.houseButton) || $location.search().id) {
                        //保存是否成功(酒店信息)
                        $scope.infoPage.ableSaveSuccess = true;
                        if ($rootScope.houseButton == "MD_detail") {
                            $scope.infoPage.ableEdit = false;
                            //禁止保存酒店按钮
                            $scope.infoPage.ableSaveMessage = true;
                            //图片按钮显示字
                            $scope.infoPage.wordInfoPage = "查看";
                            //房型操作按钮文字
                            $scope.infoPage.wordRoomButton = "查看";
                        } else {
                            //图片按钮显示字
                            $scope.infoPage.wordInfoPage = "修改";
                            //房型操作按钮文字
                            $scope.infoPage.wordRoomButton = "修改";
                        }
                        //获取图片数量
                        getHousePic($scope);
                        //获取房型信息和第三方服务
                        $http({
                            method: "GET",
                            url: config.urlBase + '/user/houseType/getHouseOthers/' + $location.search().id
                        }).then(function (result) {
                            $scope.house = result.data.house;
                            //获取房型列表后,加载房型相关功能和信息
                            angular.forEach(result.data.houseTypes, function (data) {
                                //初始化房型
                                var room = roomInitFun(data, data.category.id);
                                //在列表显示房型信息
                                angular.forEach($scope.lists.houseTypeList, function (data) {
                                    if (data.id == room.houseTypeEntity.id) {
                                        room.houseTypeEntity = data;
                                    }
                                });
                                //详情页房型图片计数
                                room.roomPicNum = data.picNum;
                                //房型编辑按钮
                                room.modify = function (room, lists) {
                                    $rootScope.modalService = $modal.open({
                                        templateUrl: "app/views/house/house.housetypecard.html",
                                        backdrop: "static",
                                        keyboard: false,
                                        controller: function ($scope) {
                                            var roomPic = {
                                                id: null,
                                                picture: result,
                                                type: "house_type",
                                                priority: $rootScope.infoPageRoot.roomCount,
                                                delete: null,
                                                priorityChange: null,
                                                saveSuccess: true,
                                                saveFail: true,
                                                isNotNum: true,
                                                deleteFail: true
                                            };
                                            //关闭保存提示按钮显示
                                            $scope.saveTotel = false;
                                            //禁止编辑
                                            $scope.isRead = !($rootScope.houseButton == "MD_detail");
                                            //初始化优先级
                                            $scope.index = 1;
                                            //初始化删除的图片
                                            $scope.deletedPic = [];
                                            //初始化改变的优先级
                                            $scope.changedPriority = [];
                                            //房型相关信息初始化
                                            roomModifyInitFun($scope, room, lists);
                                            //获取图片
                                            $scope.showOldPic0 = true;
                                            $scope.showOldPic1 = true;
                                            getPictureUrlListFun($scope, "house_type");
                                            uploaderFun($scope, 0);

                                            //储存删除的图片
                                            $scope.delete = function (index, picInfo) {
                                                $scope.deletedPic.push(picInfo);
                                                $scope.pictureUrlList.splice(index, 1);
                                            };

                                            //储存改变的优先级
                                            $scope.changePriority = function (picInfo) {
                                                $scope.changedPriority.push(picInfo);
                                                for (var i = 0; i < $scope.changedPriority.length; i++) {
                                                    var newId = getRoomPicId($scope.changedPriority[$scope.changedPriority.length - 1].path);
                                                    var nowId = getRoomPicId($scope.changedPriority[i].path);
                                                    if (newId == nowId && i != 0 && i != $scope.changedPriority.length - 1) {
                                                        $scope.changedPriority.splice(i, 1);
                                                    }
                                                }
                                            }
                                        }
                                    });
                                };
                                $scope.roomList.push(room);
                            });

                            //第三方服务
                            $http({
                                method: "GET",
                                url: config.urlBase + '/user/service/listSelect',
                                params: {
                                    type: 1
                                }
                            }).then(function (result2) {
                                $scope.othersServiceList = result2.data;
                                $scope.othersServices = [];
                                angular.forEach(result.data.services, function (data) {
                                    var service = {
                                        houseRelation: {},
                                        serviceType: {
                                            id: null,
                                            name: null,
                                            price: null,
                                            serviceTypeName: null
                                        }
                                    };
                                    angular.forEach($scope.othersServiceList, function (data2) {
                                        if (data.relationId == data2.id) {
                                            service.serviceType = data2;
                                        }
                                    });
                                    service.houseRelation = data;
                                    service.houseRelation.pcPrice = angular.copy(service.houseRelation.price);
                                    service.serviceSave = true;
                                    serviceInitFun($scope, service);
                                    $scope.othersServices.push(service);
                                });
                            });

                        });
                    }
                    //展示新增页
                    else {
                        //初始化第三方服务列表
                        $scope.othersServices = [];
                    }
                    //酒店星级选择 TODO kill
                    $scope.stars = [{id: 1, name: '三星以下'}, {id: 2, name: '三星'}, {id: 3, name: '四星'}, {id: 4,name: '五星'},
                        {id: 5, name: '准三星'}, {id: 6, name: '准四星'}, {id: 7, name: '准五星'}];

                    //保存酒店信息
                    $scope.saveHouse = function () {
                        if ($scope.houseForm.telephone.$invalid) {
                            alertOrConfirm.failAlert("请输入正确的电话号码！");
                            return false;
                        }
                        if ($scope.house.address.length > 37) {
                            alertOrConfirm.failAlert("地址不能超过37字！");
                            return false;
                        }
                        if ($scope.house.content.length > 375) {
                            alertOrConfirm.failAlert("不能超过375字！");
                            return false;
                        }
                        $rootScope.houseInfo = {
                            id: null
                        };
                        if ($scope.houseForm.$invalid) {
                            alertOrConfirm.failAlert("请将信息填写完全!");
                        } else {
                            $http({
                                method: "POST",
                                url: config.urlBase + '/user/house/save',
                                data: $scope.house
                            }).then(function (result) {
                                if (result.data.status == 200) {
                                    $rootScope.houseInfo.id = result.data.data;
                                    $location.search('id',result.data.data);
                                    $scope.house.id = result.data.data;
                                    $scope.infoPage.ableSaveSuccess = true;
                                    alertOrConfirm.successAlert("保存成功!");
                                    $timeout(function(){
                                        location.reload();
                                    },1000);
                                } else if (result.data.status == 1000) {
                                    alertOrConfirm.failAlert("保存失败,数据格式错误!");
                                } else {
                                    alertOrConfirm.failAlert("保存失败!");
                                }
                            }, function () {
                                alertOrConfirm.failAlert("保存失败!");
                            });
                        }
                    };


                    //点击酒店图片,打开图片模态框
                    $scope.addHousePic = function (houseInfo, houseOthers) {
                        $rootScope.modal = $modal.open({
                            templateUrl: "app/views/house/house.housecard.html",
                            backdrop: "static",
                            keyboard: false,
                            controller: function ($scope) {
                                $scope.houseOthers = houseOthers;
                                //关闭模态框
                                $scope.closeModal = function () {
                                    $scope.houseOthers.detailPicNum = $scope.housePic.length;
                                    $scope.modal.close();
                                };
                                $scope.showOldPic1 = true;
                                //初始化优先级
                                $scope.index = 1;
                                //初始化删除的图片
                                $scope.deletedPic = [];
                                //初始化改变的优先级
                                $scope.changedPriority = [];
                                getHousePic($scope);
                                uploaderFun($scope, 1);
                                uploaderFun($scope, 2);

                                //详情/修改页时
                                if (/^MD_/.test($rootScope.houseButton)) {

                                    //获取图片
                                    //$scope.showOldPic1 = true;
                                    getPictureUrlListFun($scope);
                                    //储存删除的图片
                                    $scope.delete = function (index, picInfo) {
                                        $scope.deletedPic.push(picInfo);
                                        $scope.housePic.splice(index, 1);
                                    };

                                    //储存改变的优先级
                                    $scope.changePriority = function (picInfo) {
                                        $scope.changedPriority.push(picInfo);
                                        for (var i = 0; i < $scope.changedPriority.length; i++) {
                                            var newId = getRoomPicId($scope.changedPriority[$scope.changedPriority.length - 1].path);
                                            var nowId = getRoomPicId($scope.changedPriority[i].path);
                                            if (newId == nowId && i != 0 && i != $scope.changedPriority.length - 1) {
                                                $scope.changedPriority.splice(i, 1);
                                            }
                                        }
                                    };

                                    if ($rootScope.houseButton == "MD_detail") {
                                        $scope.multipleDetailShow = true;
                                    } else {
                                        $scope.multipleDetailShow = false;
                                    }


                                }
                                //保存
                                $scope.picSave = function () {
                                    $scope.imgType = 'houseType';
                                    $scope.imgUploadNumHouse = 0;
                                    //检查优先级是否有重复，检查优先级是否具有1
                                    if (!checkPriority($scope, $scope.uploader2.queue, $scope.housePic)) {
                                        return false;
                                    } else {
                                        $scope.holdDoubleClick = true;
                                        //删除图片后修改权重
                                        delImgFun($scope).then(function () {
                                            $scope.houseOthers.detailPicNum = $scope.uploader2.queue.length + $scope.housePic.length;

                                            //上传首页图片
                                            if ($scope.uploader1.queue[0] != null) {
                                                $scope.uploader1.queue[0].upload();
                                                $scope.houseOthers.homepagePicNum = 1;
                                            }
                                            //上传详情图片
                                            for (var i = 0; i < $scope.uploader2.queue.length; i++) {
                                                $scope.uploader2.queue[i].upload();
                                            }

                                            if($scope.uploader1.queue[0] == null && $scope.uploader2.queue[0] == null){
                                                $timeout(function () {
                                                    $scope.modal.close();
                                                    $scope.holdDoubleClick = false;
                                                    alertOrConfirm.successAlert("保存成功!");
                                                }, 500);
                                            }
                                            changePriFun($scope);
                                        });
                                    }

                                };
                            }
                        });
                    };

                    //添加房型
                    $scope.addRoom = function () {
                        //初始化房型
                        var obj = {
                            id: null,
                            name: null,
                            houseId: $scope.house.id,
                            houseType: null,
                            area: null,
                            bed: null,
                            serviceList: null,
                            oldServiceIds: null,
                            deviceList: null,
                            oldDeviceIds: null
                        };
                        var room = roomInitFun(obj, null);
                        room.houseTypeEntity = null;
                        room.selectPicAble = false;

                        //房型图片权重计数重置
                        $rootScope.infoPageRoot.roomCount = 1;

                        //编辑房型
                        room.modify = function (room, lists) {
                            $rootScope.modalService = $modal.open({
                                templateUrl: "app/views/house/house.housetypecard.html",
                                backdrop: "static",
                                keyboard: false,
                                controller: function ($scope) {
                                    $scope.houseTypeLength = 0;

                                    //初始化删除的图片
                                    $scope.deletedPic = [];
                                    //初始化被修改过的优先级
                                    $scope.changedPriority = [];
                                    $scope.isRead = true;
                                    //显示总开关
                                    $scope.saveTotel = true;
                                    roomModifyInitFun($scope, room, lists);
                                    $scope.room.saveWord = "(未保存)";
                                    //获取图片
                                    getPictureUrlListFun($scope, "house_type");
                                    //$scope.getFile = function () {
                                    //    roomPicFun($scope);
                                    //};
                                    //初始化优先级
                                    $scope.index = 1;
                                    //房型相关信息初始化
                                    roomModifyInitFun($scope, room, lists);
                                    //获取图片
                                    $scope.showOldPic0 = true;
                                    $scope.showOldPic1 = true;
                                    uploaderFun($scope, 0);
                                    //删除图片
                                    $scope.delete = function (index, roomPicInfo) {
                                        var roomPicId = getRoomPicId(roomPicInfo.path);
                                        deletePicFun(index, roomPicId, $scope.pictureUrlList);
                                    };

                                    //改变权重
                                    $scope.priorityChange = function (roomPicInfo) {
                                        var roomPicId = getRoomPicId(roomPicInfo.path);
                                        priorityChangePicFun(roomPicId, roomPicInfo.priority, $scope, $scope.uploader0.queue, $scope.pictureUrlList);
                                    };
                                }
                            });
                        };

                        //删除房型
                        room.delete = function (index) {
                            if (room.data.id !== null) {
                                var deleteFun = function() {
                                    $http({
                                        method: "GET",
                                        url: config.urlBase + '/user/houseType/delete/' + room.data.id
                                    }).then(function (result) {
                                        $scope.roomList.splice(index, 1);
                                    }, function () {
                                        alertOrConfirm.failAlert("删除房型信息失败!");
                                    });
                                };
                                alertOrConfirm.deleteConfirm(deleteFun);
                            } else {
                                $scope.roomList.splice(index, 1);
                            }
                        };
                        $scope.roomList.push(room);
                    };

                    //*******************第三方服务**********************
                    $scope.addService = function () {
                        var service = {
                            houseRelation: {
                                id: null,
                                houseId: $scope.house.id,
                                relationId: null,
                                type: 'house_service',
                                price: 0,
                                pcPrice: 0
                            },
                            serviceType: {
                                id: null,
                                name: null,
                                price: null,
                                serviceTypeName: null
                            },
                            serviceSave: false
                        };
                        serviceInitFun($scope, service);
                        $scope.othersServices.push(service);
                    };
                }, function () {
                    alertOrConfirm.failAlert("获取列表失败!");
                });
            },
            link: function () {
            },
            templateUrl: 'app/views/house/house.info.html',
            controllerAs: 'ctrl',
            bindToController: true
        };
    });
})();
