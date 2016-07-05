'use strict';

(function () {

    var app = angular.module('swalk.confirm');

    app.service('alertOrConfirm', ['$uibModal', function ($uibModal) {
        this.query = function (content, successFun, failFun) {
            var modalInstance = $uibModal.open({
                templateUrl: 'app/modules/confirm/confirm.html',
                controller: ["$scope", "$uibModalInstance", "$interval", function ($scope, $uibModalInstance, $interval) {
                    $scope.confirmContainer = {
                        "height": $(window).height() - 80 + 'px'
                    };
                    document.onkeydown = function(e){
                        if(e == 27){
                            $uibModalInstance.close(/*$scope.text*/);
                        }
                    };
                    //判断是confirm还是alert
                    $scope.isConfirm = content.isConfirm;
                    //页面显示的文字
                    $scope.text = content.text;
                    //confirm显示的btn按钮
                    $scope.btntext = content.btntext;
                    //alert的imgsrc
                    $scope.imgUrl = content.imgUrl;
                    //点击取消
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                    //点击确认
                    $scope.ok = function () {
                        $uibModalInstance.close(/*$scope.text*/);
                    };
                    //自动关闭alert
                    if($scope.isConfirm == false){
                        $scope.time = 3;
                        var timer = $interval(function(){
                            $scope.time--;
                        },1000,3);
                        timer.then(function(){
                            $uibModalInstance.dismiss('cancel');
                        })
                    }
                }],
                resolve: {
                    text: function () {
                        return content.text;
                    }
                }
            });
            modalInstance.result.then(function () {
                if (successFun) {
                    successFun();
                }
            }, function () {
                if (failFun) {
                    failFun();
                }
            });
        };
        this.deleteConfirm = function (successFun, failFun) {
            var confirmContent = {
                text: '您确定要删除此条数据？',
                btntext: '删 除',
                isConfirm: true
            };
            this.query(confirmContent, successFun, failFun);
        };
        this.deleteTextConfirm = function (text, successFun, failFun) {
            var confirmContent = {
                text: text,
                btntext: '删 除',
                isConfirm: true
            };
            this.query(confirmContent, successFun, failFun);
        };
        this.confirm = function (text, successFun, failFun) {
            var confirmContent = {
                text: text,
                btntext: '确 定',
                isConfirm: true
            };
            this.query(confirmContent, successFun, failFun);
        };

        this.successAlert = function(text) {
            var alertContent = {
                text: text,
                isConfirm: false,
                imgUrl: 'app/img/alert-success.png' //alert，操作成功时提示的图片
            };
            this.query(alertContent);
        };
        this.failAlert = function(text) {
            var alertContent = {
                text: text,
                isConfirm: false,
                imgUrl: 'app/img/alert-fail.png' //alert，操作成功时提示的图片
            };
            this.query(alertContent);
        };
    }]);

    app.factory('waiting',["$modal",function($modal){
        return {
            loading: function(text){
                var loadModal = $modal.open({
                    templateUrl: 'app/modules/confirm/confirm.html',
                    backdrop: true,
                    controller: ["$scope", function ($scope) {
                        $scope.confirmContainer = {
                            "height": $(window).height() - 80 + 'px'
                        };
                        //页面显示的文字
                        $scope.text = text;
                        $scope.isLoad = true;
                        //点击取消
                        $scope.cancel = function () {
                            loadModal.close();
                        };
                    }]

                });
                var closeLoadPup = function(){
                    loadModal.close();
                };
                return closeLoadPup;
            }
        }
    }])

})();
