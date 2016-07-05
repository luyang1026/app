'use strict';
(function(){
	angular.module('swalk.confirm')
		.factory('myModal',function($uibModal){
			var modalInstance;
			var type;
			var builder = {
				open:function(config){
					var templateUrl = config.templateUrl||'app/modules/confirm/myConfirm.html';
					var controller = config.controller||controllerFn;
					modalInstance = $uibModal.open({
						templateUrl:templateUrl,
						controller:controller,
						backdrop:config.backdrop||false,
						size:config.size||'',
						resolve:{
							config:config
						}
					});
					return modalInstance.result;
				},
				close:function(){
					modalInstance.dismiss();
				},
				show:function(config){
					type = 'show';
					this.open(config);//{size:提示框大小,title:标题,text:内容}
					if(!config.retain){
						setTimeout(builder.close,1000);
					}
				},
				confirm:function(config){
					type = 'confirm';
					return this.open(config);
				}
			}
			return builder;

			function controllerFn($scope,$uibModalInstance,config){
					$scope.title = config.title||'';
					$scope.text = config.text||'';
					switch(type){
						case 'show':
							$scope.footer = false;
							break;
						case 'confirm':
							$scope.footer = true;
							break;
					}
			}
		})
})();
	