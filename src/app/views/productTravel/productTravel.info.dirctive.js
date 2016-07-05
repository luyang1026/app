'use strict';
(function() {
    var app = angular.module('swalk.productTravel.info');
    app.directive('swalkProductTravelInfo', function () {
        return {
            restrict: 'E',
            scope: {},
            replace: true,
            controller: function($rootScope, config, $scope, $http, $stateParams, $modal, $timeout, $state, fileReader,
                                 categoryListService,$cookies,FileUploader,$q, typeConversion, initTimeService, alertOrConfirm, $location,
                                 waiting, aspectRatio) {
                $scope.product = [];
                if($location.search().id == null && $rootScope.sellerProductInfo != null){
                    $location.search('id',$rootScope.sellerProductInfo.id);
                    if($rootScope.sellerProductButton == 'MD_detail'){
                        $location.search('isDetail',$rootScope.sellerProductButton);
                    }
                }else{
                    $scope.product.id = $location.search().id;
                    if($location.search().isDetail){
                        $rootScope.sellerProductButton = 'MD_detail';
                    }
                }
                //隐藏不能点击的按钮
                $scope.detailButtonShow = false;
                //init rich text id
                $scope.productDescId = null;
                $scope.productFlowId = null;
                $scope.productNoticeId = null;
                //其他信息,计数,图片,权重计数
                $scope.picOthers = {
                    //首页图片显示数
                    homepagePicNum:0,
                    //详情图片显示数
                    detailPicNum: 0,
                    //详情图片数组
                    detailPics:[],
                    //详情图片权重计数
                    multipleCount: 1,
                    //首页图片
                    indexPic: null
                };

                //rich text options
                $scope.options = {
                    height: 150,
                    toolbar: [
                        ['style', ['style']],
                        ['font', ['bold','italic', 'underline', 'clear']],
                        ['fontname', ['fontname','fontsize']],
                        ['height', ['height']],
                        ['color', ['color']],
                        ['para', ['ul', 'ol', 'paragraph']],
                        ['table', ['table']],
                        ['insert', ['link', 'picture', 'video']],
                        ['view', ['fullscreen', 'codeview', 'help']]
                    ]
                };
                //初始化按钮文字,按钮控制等
                $scope.infoPage = {
                    //页面主要信息是否可编辑
                    ableEdit:true,
                    //保存信息按钮是否不可点击(信息)
                    ableSaveMessage:false,
                    //保存是否成功(信息)
                    ableSaveSuccess:false,
                    //主要页面显示文字
                    wordInfoPage:"添加"
                };


                //初始化服务类
                $scope.service = {
                    id: null,
                    productId: null,
                    providerId: null,
                    service: null,
                    price: null,
                    providerName: null
                };

                //初始化时间类
                $scope.time = {
                    id: null,
                    productId: null,
                    startDate: null,
                    endDate: null,
                    price: null,
                    proTotal: null
                };
                //初始化产品
                $scope.product = {
                    id: null,
                    name: null,
                    cycle: null,
                    timeIntervalStart: null,
                    timeIntervalEnd: null,
                    releaseStatus: null,
                    cityId: null,
                    price: null,
                    cityName: null,
                    theme: null,
                    proServiceDesc: null,
                    proFlow: null,
                    proNotice: null,
                    isBack: null
                };
                //获取城市列表
                $http({
                    method: "GET",
                    url: config.urlBase+'/user/city/list'
                }).then(function (data) {
                    $scope.cities = data.data.list;
                });
                //初始化商户名称
                var searchInit = function (scope) {
                    $timeout(function () {
                        $('#nameSearch').selectize({
                            persist: false,
                            maxItems: 1,
                            valueField: 'id',
                            labelField: 'name',
                            searchField: ['name'],
                            items: [scope.service.providerId],
                            options: scope.providerList,
                            create: false,
                            load: function (input, callback) {
                                $http({
                                    method: "GET",
                                    url: config.urlBase + "/user/providerTravel/list",
                                    params: {
                                        limit: 10,
                                        offset: 0,
                                        name: input
                                    }
                                }).success(function (results) {
                                    //$('#nameSearch')[0].selectize.clearOptions();
                                    callback(results.list);
                                }).error(function () {
                                    callback();
                                })
                            },
                            onChange: function (value) {
                                if(value){
                                    scope.service.providerName = $('#nameSearch')[0].selectize.options[value].name;
                                    scope.service.providerId = $('#nameSearch')[0].selectize.options[value].id;
                                }
                            }
                        });
                    });
                };
                var initSearch = function(scope) {
                    $http({
                        method: "GET",
                        url: config.urlBase + "/user/providerTravel/list",
                        params: {
                            limit: config.selectizeSize,
                            offset: 0,
                            name: scope.service.providerName || ""
                        }
                    }).success(function(res){
                        console.log(res);
                        scope.providerList = res.list;
                        searchInit(scope);
                    });
                };

                //截取图片的id
                function getPicId(str){
                    var str = str;
                    var arr = str.split("/");
                    var val = arr[arr.length - 1];
                    return val;
                }

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
                            alertOrConfirm.failAlert("优先级不能重复，请修改优先级后再保存");
                            return false;
                        }
                    }
                    if(priorityArry[0] == 0){
                        alertOrConfirm.successAlert("优先级不能为0或空，请修改优先级后再保存");
                        return false;
                    }
                    return true;
                };

                //修改权重
                var changePriFun = function(scope) {
                    var deferred = $q.defer();
                    if(scope.changedPriority.length == 0){
                        deferred.resolve();
                    }else{
                        for(var i = 0; i<scope.changedPriority.length;i++) {
                            var pic = scope.changedPriority[i];
                            var id = getPicId(pic.path);
                            $http({
                                method: "GET",
                                url: config.urlBase + '/user/pictureManage/changePriority/' + id + '/' + pic.priority
                            }).then(function(result){
                                var changeCount = 0;
                                changeCount++;
                                if(changeCount == scope.changedPriority.length){
                                    deferred.resolve(result);
                                }
                            }, function(result){
                                deferred.reject(result);
                            });
                        }
                    }
                    return deferred.promise;
                };

                //图片控件
                var uploaderFun = function(scope,type) {
                    //下载
                    if(type == 1){
                        var uploader = scope.uploader1 = new FileUploader({
                            url: config.urlBase + "/user/pictureTravel/saveSingle",
                            headers: {'token': $cookies.get("token")}
                        });
                    }else if(type == 2) {
                        var uploader = scope.uploader2 = new FileUploader({
                            url: config.urlBase + "/user/pictureTravel/saveWithPriority",
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
                    //所有新增图片都已准备就绪之后，判断图片的宽高比
                    uploader.onAfterAddingAll = function (addedItems) {
                        if(type == 2){
                            var param = {
                                items: addedItems,
                                queue: scope.uploader2.queue,
                                imgWidth: 750,
                                imgHeight: 460
                            };
                            aspectRatio.query(param);
                        }
                    };
                    uploader.onAfterAddingFile = function (fileItem) {
                        var addedItems = [fileItem];
                        if(type == 1){
                            var param = {
                                items: addedItems,
                                queue: scope.uploader1.queue,
                                imgWidth: 750,
                                imgHeight: 406
                            };
                            aspectRatio.query(param);
                        }
                        if(type == 1 && uploader.queue.length > 1){
                            uploader.queue.splice(0, 1);
                        }
                        scope.fileitem = '';
                        fileItem.isPro = '未上传';
                        if(type == 1){
                            scope.showOldPic1 = false;
                        }
                        fileItem.priority = scope.index;
                        if(type == 2){
                            scope.index++;
                        }
                    };
                    if (type == 1) {
                        uploader.onBeforeUploadItem = function (item) {
                            item.formData.push({
                                foreignId: scope.product.id
                            });
                        };
                    } else if (type == 2) {
                        uploader.onBeforeUploadItem = function (item) {
                            item.formData.push({
                                foreignId: scope.product.id,
                                priority: item.priority
                            });
                        };
                    }

                    uploader.onProgressItem = function (fileItem, progress) {
                        fileItem.isPro = '正在上传';
                    };
                    uploader.onSuccessItem = function (fileItem, response, status, headers) {
                        if(type == 1){
                            if (response.status == 200) {
                                fileItem.isPro = '上传成功';
                                scope.picOthers.indexPic = response.data;
                                scope.showOldPic1 = true;
                                scope.picOthers.homepagePicNum = 1;
                                scope.homepagePicResult = true;
                                if(scope.uploader2.queue == null || scope.uploader2.queue.length == 0){
                                    //更新详情图片数量
                                    scope.picOthers.detailPicNum = scope.detailPics.length;
                                    scope.holdDoubleClick = false;
                                    scope.loadingModel();
                                    alertOrConfirm.successAlert("修改成功");
                                    $rootScope.modal.close();
                                }
                            } else {
                                alertOrConfirm.failAlert("上传首页图片失败！");
                                fileItem.isPro = '上传失败';
                                scope.homepagePicResult = false;
                            }
                        }
                        if (type == 2) {
                            if (response.status == 200) {
                                fileItem.isPro = '上传成功';
                                response.data.path = response.data.linkedPath;
                                scope.detailPics.push(response.data);
                                scope.detailPicSuccess.push(scope.detailCount);
                                scope.detailCount++;
                                if(scope.uploader2.queue.length == scope.detailCount){
                                    scope.loadingModel();
                                    //更新详情图片数量
                                    scope.picOthers.detailPicNum = scope.detailPics.length;
                                    if (scope.homepagePicResult && (scope.detailCount == scope.detailPicSuccess.length)) {
                                        scope.holdDoubleClick = false;
                                        alertOrConfirm.successAlert("修改成功");
                                        $rootScope.modal.close();
                                    } else {
                                        for(var j = scope.detailPicSuccess.length - 1; j >=0 ; j--) {
                                            scope.uploader2.queue.splice(scope.detailPicSuccess[j], 1);
                                        }
                                    }
                                }
                            } else {
                                scope.detailCount++;
                                fileItem.isPro = '上传失败';
                            }
                        }
                    };
                    uploader.onErrorItem = function (fileItem, response, status, headers) {
                        if (type == 2) {
                            scope.detailCount++;
                        }
                        fileItem.isPro = '上传失败';
                    };
                    uploader.onCancelItem = function (fileItem, response, status, headers) {
                    };
                    uploader.onCompleteItem = function (fileItem, response, status, headers) {
                    };
                };

                //获取商户列表、图片数量和路径、产品描述
                var getProviderListAndPic = function(scope) {
                    var deferred = $q.defer();
                    $http({
                        method: 'GET',
                        url: config.urlBase + '/user/productTravel/getServiceAndPic/' + $location.search().id
                    }).success(function(result){
                        scope.picInfo = result;
                        scope.picOthers.homepagePicNum = result.pictureInfos.homepageNum;
                        scope.picOthers.detailPicNum = result.pictureInfos.detailNum;
                        scope.picOthers.indexPic = result.pictureInfos.homepagePath;
                        //商户信息
                        scope.services = result.services;
                        //产品描述
                        scope.product.proServiceDesc = result.proServiceDesc;
                        scope.product.proFlow = result.proFlow;
                        scope.product.proNotice = result.proNotice;
                        scope.productDescId = result.proServiceDescId;
                        scope.productFlowId = result.proFlowId;
                        scope.productNoticeId = result.proNoticeId;
                        //产品基本信息
                        $scope.product = {
                            id: result.productTravel.id,
                            name: result.productTravel.name,
                            timeIntervalStart: result.productTravel.timeIntervalStart,
                            timeIntervalEnd: result.productTravel.timeIntervalEnd,
                            cityId: result.productTravel.cityId,
                            theme: result.productTravel.theme,
                            proServiceDesc: result.proServiceDesc,
                            proFlow: result.proFlow,
                            proNotice: result.proNotice,
                            isBack: result.productTravel.isBack + ''
                        };
                        deferred.resolve(result);
                    });
                    return deferred.promise;
                };
                var unique = function(array){
                    var res = [array[0]];
                    for(var i = 0; i<array.length; i++) {
                        var repeat = false;
                        for(var j = 0; j < res.length; j++){
                            console.log(initTimeService.dateToString(array[i].startDate) , initTimeService.dateToString(res[j].startDate));
                            if(initTimeService.dateToString(array[i].startDate) == initTimeService.dateToString(res[j].startDate) && i != 0){
                                alertOrConfirm.failAlert("开始日期不能有重复！");
                                return false;
                            }
                            if(initTimeService.dateToString(array[i].startDate) == initTimeService.dateToString(res[j].startDate)){
                                repeat = true;
                                break;
                            }
                        }
                        if(!repeat){
                            res.push(array[i]);
                        }
                    }
                    return true;
                };
                //保存时间
                var saveTimeFun = function(scope,timeInfo,type,index){
                    if(type == 2){
                        scope.allTime = angular.copy(scope.timeList) || [];
                        scope.allTime.push(timeInfo);
                        if(!unique(scope.allTime)){
                            return false
                        }
                    }else{
                        if(!unique(scope.timeList)){
                            return false
                        }
                    }

                    scope.uploadTime = angular.copy(timeInfo);
                    scope.uploadTime.price = typeConversion.doubleToLong(timeInfo.price);
                    scope.uploadTime.lastDealDate = initTimeService.stringToDate(timeInfo.lastDealDate);
                    if(initTimeService.query(timeInfo.startDate) > initTimeService.query(timeInfo.endDate)){
                        alertOrConfirm.failAlert("开始时间不能大于结束时间")
                    }else if( initTimeService.query(timeInfo.startDate) < initTimeService.query(timeInfo.lastDealDate) ){
                        alertOrConfirm.failAlert("最晚成团时间应在开始时间之前")
                    }else if (initTimeService.query(timeInfo.startDate) < initTimeService.query(scope.product.timeIntervalStart)) {
                        alertOrConfirm.failAlert("开始时间不能在有效期之前")
                    }else if (initTimeService.query(timeInfo.endDate) > initTimeService.query(scope.product.timeIntervalEnd)){
                        alertOrConfirm.failAlert("结束时间不能在有效期之后")
                    } else{
                        scope.holdDoubleClick = true;
                        $http({
                            method: 'POST',
                            url: config.urlBase + '/user/productDateTravel/save',
                            data: scope.uploadTime
                        }).then(function(result){
                            console.log(result);
                            if (result.data.status == 200) {
                                scope.time.id = result.data.data;
                                alertOrConfirm.successAlert("保存成功");
                                scope.modal.close();
                                $timeout(function(){
                                    location.reload();
                                },1000)
                            } else if (result.data.status == 1000){
                                alertOrConfirm.failAlert("数据格式输入错误");
                            } else {
                                alertOrConfirm.failAlert("保存失败");
                            }
                            scope.holdDoubleClick = false;
                        }, function(){
                            alertOrConfirm.failAlert("保存失败");
                            scope.holdDoubleClick = false;
                        });
                    }
                };
                //初始化时间列表
                var initTimeList = function(scope){
                    scope.timeList.forEach(function (r){
                        r.modify = function (index,timeList,time,product) {
                            $rootScope.modal = $modal.open({
                                templateUrl: "app/views/productTravel/productTravel.time.card.html",
                                backdrop: "static",
                                keyboard: false,
                                controller: function($scope) {
                                    $scope.product = product;
                                    $scope.time = time;
                                    $scope.timeList = timeList;
                                    $scope.closeModal = function(){
                                        $scope.modal.close();
                                    };
                                    $scope.saveTime = function() {
                                        saveTimeFun($scope,$scope.time,1);
                                    };
                                }
                            })
                        };
                        r.delete = function (index) {
                            var deleteFun = function(){
                                $http({
                                    method: 'GET',
                                    url: config.urlBase + '/user/productDateTravel/delete/' + r.id
                                }).then(function(result){
                                    if (result.data.status == 200) {
                                        scope.timeList.splice(index,1);
                                        alertOrConfirm.successAlert("删除成功");
                                    } else {
                                        alertOrConfirm.failAlert("删除失败");
                                    }
                                }, function() {
                                    alertOrConfirm.failAlert("删除失败")
                                });
                            };
                            alertOrConfirm.deleteConfirm(deleteFun);
                        };
                    });
                };


                //初始化商户服务列表
                var initService = function(scope) {
                    scope.services.forEach(function(r){
                        r.modify = function(index , services){
                            $rootScope.modal = $modal.open({
                                templateUrl: "app/views/productTravel/productTravel.service.card.html",
                                backdrop: "static",
                                keyboard: false,
                                controller: function($scope) {
                                    //初始化服务类
                                    $scope.service = r;
                                    $scope.services = services || [];
                                    //初始化名称
                                    $timeout(function(){
                                        initSearch($scope);
                                    });
                                    $scope.closeModal = function(){
                                        $scope.modal.close();
                                    };

                                    $scope.saveService = function(){
                                        saveServiceFun($scope,0,index);
                                    }
                                }
                            })
                        };
                        r.delete = function(index){
                            var deleteFun = function () {
                                $http({
                                    method: 'GET',
                                    url: config.urlBase + '/user/serviceTravel/delete/' + r.id
                                }).then(function(result){
                                    if (result.data.status == 200) {
                                        $scope.services.splice(index,1);
                                        alertOrConfirm.successAlert("删除成功");
                                    } else {
                                        alertOrConfirm.failAlert("删除失败");
                                    }
                                }, function(){
                                    alertOrConfirm.failAlert("删除失败");
                                })
                            };
                            alertOrConfirm.deleteTextConfirm('是否删除此条数据？',deleteFun);
                        };
                    });
                };
                //保存商户服务
                var saveServiceFun = function(scope,type,index) {
                    scope.holdDoubleClick = true;
                    scope.serviceBackup = angular.copy(scope.service);
                    scope.serviceBackup.price = typeConversion.doubleToLong(scope.service.price);
                    $http({
                        method: 'POST',
                        url: config.urlBase + '/user/serviceTravel/save',
                        data: scope.serviceBackup
                    }).then(function(result){
                        if (result.data.status == 200) {
                            if(type == 1){
                                scope.services.push(scope.service);
                            }
                            if(type == 0){
                                scope.services.splice(index,1,scope.service);
                            }
                            //初始化商户服务列表
                            initService(scope);
                            scope.modal.close();
                            $timeout(function(){
                                alertOrConfirm.successAlert("保存成功");
                            },200);
                        } else if (result.data.status == 1000) {
                            alertOrConfirm.failAlert("数据传输格式错误！");
                        } else {
                            alertOrConfirm.failAlert("失败");
                        }
                        scope.holdDoubleClick = false;
                    }, function () {
                        scope.holdDoubleClick = false;
                        alertOrConfirm.failAlert("失败");
                    })
                };
                //新增、修改产品基本信息
                var saveProductInfo = function(scope) {
                    scope.productInfo = {
                        id: scope.product.id,
                        name: scope.product.name,
                        timeIntervalStart: scope.product.timeIntervalStart,
                        timeIntervalEnd: scope.product.timeIntervalEnd,
                        releaseStatus: scope.product.releaseStatus,
                        cityId: scope.product.cityId,
                        theme: scope.product.theme,
                        proServiceDesc: scope.product.proServiceDesc,
                        proServiceDescId: scope.productDescId,
                        proFlow: scope.product.proFlow,
                        proFlowId: scope.productFlowId,
                        proNotice: scope.product.proNotice,
                        proNoticeId: scope.productNoticeId,
                        productTravel: scope.product,
                        isBack: scope.product.isBack
                    };

                    var div = document.createElement('div');
                    div.innerHTML = scope.product.proServiceDesc;
                    if (div.innerText.length > 550){
                        alertOrConfirm.failAlert("产品详情不能超过500字!");
                        return false;
                    }
                    div.innerHTML = scope.product.proFlow;
                    if (div.innerText.length > 550){
                        alertOrConfirm.failAlert("行程安排不能超过500字!");
                        return false;
                    }
                    div.innerHTML = scope.product.proNotice;
                    if (div.innerText.length > 550){
                        alertOrConfirm.failAlert("产品注意事项不能超过500字!");
                        return false;
                    }
                    if(scope.sellerProductForm.$invalid){
                        alertOrConfirm.failAlert("请将信息填写完全!");
                    } else {
                        if(initTimeService.query(scope.product.timeIntervalStart) > initTimeService.query(scope.product.timeIntervalEnd)){
                            alertOrConfirm.failAlert("开始时间不能大于结束时间")
                        }else{
                            scope.holdDoubleClick = true;
                            scope.loadingModel = waiting.loading("正在上传，请等待。。。");
                            $http({
                                method: 'POST',
                                url: config.urlBase + '/user/productTravel/save',
                                data: scope.productInfo
                            }).then(function(result){
                                scope.loadingModel();
                                if (result.status == 200) {
                                    alertOrConfirm.successAlert("保存成功");
                                    $location.search('id',result.data.data.id);
                                    scope.product.id = result.data.data.id;
                                    scope.infoPage.ableSaveSuccess = true;
                                    getProviderListAndPic(scope);
                                    //getTimeList(scope,scope.product.id);
                                } else if (result.data.status == 1000) {
                                    alertOrConfirm.failAlert("保存信息数据格式不正确");
                                } else {
                                    alertOrConfirm.failAlert("保存失败");
                                }
                                scope.holdDoubleClick = false;
                            }, function(){
                                scope.loadingModel();
                                alertOrConfirm.failAlert("保存失败");
                                scope.holdDoubleClick = false;
                            })
                        }
                    }
                };
                $scope.saveInfo = function() {
                    saveProductInfo($scope);
                };
                //展示详情页or修改页
                if($rootScope.sellerProductButton || $location.search().id) {
                    //$scope.product = $rootScope.sellerProductInfo;
                    //$scope.product.id = $location.search().id;

                    //获取商户列表,图片数量和路径
                    getProviderListAndPic($scope).then(function(result){
                        $scope.services = result.services;
                        //初始化商户服务列表
                        initService($scope);
                    });
                    //获取time列表
                    $http({
                        method: 'GET',
                        url: config.urlBase + '/user/productDateTravel/list/' + $location.search().id
                    }).success(function (result) {
                        $scope.timeList = result;
                        //初始化time编辑
                        initTimeList($scope);
                    });


                    //保存是否成功(酒店信息)
                    $scope.infoPage.ableSaveSuccess = true;
                    if($rootScope.sellerProductButton == "MD_detail") {
                        //显示不能点击的按钮
                        $scope.detailButtonShow = true;
                        //不允许编辑内容
                        $scope.infoPage.ableEdit = false;
                        //禁止保存酒店按钮
                        $scope.infoPage.ableSaveMessage = true;
                        //图片按钮显示字
                        $scope.infoPage.wordInfoPage = "查看";
                        //禁止编辑富文本
                        $scope.config = {
                            readonly: true
                        };
                    } else if ($rootScope.sellerProductButton == "MD_modify"){
                        //隐藏不能点击的按钮
                        $scope.detailButtonShow = false;
                        $scope.config = {
                            readonly: false
                        };
                        //图片按钮显示字
                        $scope.infoPage.wordInfoPage = "修改";
                    }
                } else {
                    $scope.product= [];
                }
                //图片模态框
                $scope.addPic = function (infoPage, picOthers, product){
                    $rootScope.modal = $modal.open({
                        templateUrl: "app/views/productTravel/productTravel.pic.card.html",
                        backdrop: "static",
                        keyboard: false,
                        controller: function($scope) {
                            //初始化产品类
                            $scope.product = product;
                            //其他信息,计数,图片,权重计数
                            $scope.picOthers = picOthers;

                            //初始化优先级
                            $scope.index = 1;
                            //初始化改变的优先级
                            $scope.changedPriority = [];

                            //显示旧的首页图片
                            $scope.showOldPic1 = true;
                            uploaderFun($scope, 1);
                            uploaderFun($scope, 2);

                            $scope.indexPic = infoPage.pictureInfos.homepagePath;
                            $scope.detailPics = infoPage.pictureInfos.details;
                            $scope.picOthers.detailPicNum = $scope.detailPics.length;

                            //关闭模态框
                            $scope.closeModal = function(){
                                $scope.picOthers.detailPicNum = $scope.detailPics.length;
                                $scope.modal.close();
                            };

                            //删除图片
                            $scope.delete = function(index, picInfo) {
                                var deleteImageFun = function(){
                                    var picId = getPicId(picInfo.path);
                                    $http({
                                        method: "GET",
                                        url: config.urlBase + '/user/pictureManage/deletePicture/' + picId
                                    }).then(function(result){
                                        if (result.data.status == 200) {
                                            $scope.detailPics.splice(index, 1);
                                            $scope.picOthers.detailPicNum = $scope.detailPics.length;
                                            alertOrConfirm.successAlert("删除成功")
                                        } else {
                                            alertOrConfirm.successAlert("删除失败")
                                        }
                                    }, function () {
                                        alertOrConfirm.successAlert("删除失败")
                                    });
                                };
                                alertOrConfirm.deleteTextConfirm('是否删除此张图片？',deleteImageFun);

                            };

                            //储存改变的优先级
                            $scope.changePriority = function(picInfo) {
                                $scope.changedPriority.push(picInfo);
                                for(var i = 0; i<$scope.changedPriority.length;i++) {
                                    var newId = getPicId($scope.changedPriority[$scope.changedPriority.length-1].path);
                                    var nowId = getPicId($scope.changedPriority[i].path);
                                    if(newId == nowId && i != 0 && i != $scope.changedPriority.length-1){
                                        $scope.changedPriority.splice(i,1);
                                    }
                                }
                            };

                            //保存
                            $scope.picSave = function () {
                                //检查优先级是否有重复，检查优先级是否具有1
                                if(!checkPriority($scope,$scope.uploader2.queue,$scope.detailPics)){
                                    return false;
                                } else {
                                    if($scope.uploader2.queue.length > 0 || $scope.uploader1.queue[0] != null){
                                        $scope.loadingModel = waiting.loading("正在上传图片，请等待。。。");
                                    }
                                    //修改权重
                                    changePriFun($scope).then(function(){
                                        $scope.holdDoubleClick = true;
                                        if($scope.uploader2.queue.length > 0 || $scope.uploader1.queue[0] != null){
                                            $scope.detailPicSuccess = [];
                                            $scope.detailCount = 0;
                                            $scope.homepagePicResult = true;
                                            //上传首页图片
                                            if($scope.uploader1.queue[0] != null){
                                                $scope.homepagePicResult = false;
                                                $scope.uploader1.queue[0].upload();
                                            }
                                            if($scope.uploader1.queue[0] != null && $scope.uploader2.queue.length <= 0){
                                                alertOrConfirm.successAlert("已上传首页图片");
                                            }
                                            //上传详情图片
                                            if ($scope.uploader2.queue != null && $scope.uploader2.queue.length > 0) {
                                                for(var i = 0; i< $scope.uploader2.queue.length; i++){
                                                    $scope.uploader2.queue[i].upload();
                                                }
                                            }
                                        } else {
                                            $scope.holdDoubleClick = false;
                                            alertOrConfirm.successAlert("保存成功");
                                            $rootScope.modal.close();
                                        }
                                    }, function () {
                                        $scope.holdDoubleClick = false;
                                        alertOrConfirm.failAlert("修改权限失败");
                                        $rootScope.modal.close();
                                    });

                                }

                            };
                            if($rootScope.sellerProductButton == "MD_detail")
                                $scope.multipleDetailShow = true;
                            else
                                $scope.multipleDetailShow = false;
                        }
                    })
                };

                //商户服务态框
                $scope.addService = function (productId,services){
                    $rootScope.modal = $modal.open({
                        templateUrl: "app/views/productTravel/productTravel.service.card.html",
                        backdrop: "static",
                        keyboard: false,
                        controller: function($scope) {
                            //初始化服务类
                            $scope.service = {
                                id: null,
                                productId: productId,
                                providerId: null,
                                service: null,
                                price: null,
                                providerName: null
                            };
                            $scope.services = services || [];
                            //初始化名称
                            $timeout(function(){
                                initSearch($scope);
                            });
                            $scope.closeModal = function(){
                                $scope.modal.close();
                            };

                            $scope.saveService = function(){
                                saveServiceFun($scope,1);
                            }

                        }
                    })
                };

                //添加时间模态框
                $scope.addTime = function (productId,timeList,product){
                    $rootScope.modal = $modal.open({
                        templateUrl: "app/views/productTravel/productTravel.time.card.html",
                        backdrop: "static",
                        keyboard: false,
                        controller: function($scope) {
                            $scope.product = product;
                            //初始化时间类
                            $scope.time = {
                                id: null,
                                productId: productId,
                                startDate: null,
                                endDate: null,
                                price: null,
                                proTotal: null,
                                lastDealDate: null
                            };
                            $scope.timeList = timeList;

                            $scope.closeModal = function(){
                                $scope.modal.close();
                            };
                            $scope.saveTime = function () {
                                saveTimeFun($scope,$scope.time,2);
                            };
                        }
                    })
                }
            },
            link: function () {
            },
            templateUrl : 'app/views/productTravel/productTravel.info.html',
            controllerAs : 'ctrl',
            bindToController : true
        };
    });
})();