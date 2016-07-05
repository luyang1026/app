'use strict';
(function () {
	angular.module('ly.subscriber.info')
		.factory('subscriber_info_api',function(config,$http){
			return {
				//无条件查询商户列表
				merchList:function(param,callback){
					var url = '/merch/list';
					$http.post(config.backendUrl+url,param).then(function(res){
						if(res.status === 200){
							callback(res.data);
						}
					});
				},
				//有条件查询商户列表
				merchListByCriterias:function(param,callback){
					var url = '/merch/listByCriteria';
					$http.post(config.backendUrl+url,param).then(function(res){
						if(res.status === 200){
							callback(res.data);
						}
					});
				},
				//删除商户
				delMerchByIds:function(param,callback){
					var url = '/merch/delMerchByIds';
					$http.post(config.backendUrl+url,param).then(function(res){
						if(res.status === 200){
							callback(res.data);
						}
					});
				},
				//商户详情
				findMerchById:function(param,callback){
					var url = '/merch/findMerchById';
					$http.post(config.backendUrl+url,param).then(function(res){
						if(res.status === 200){
							callback(res.data);
						}
					});
				},
				//保存商户基本信息
				addStMerch:function(param,callback){
					var url = '/merch/addStMerch';
					$http.post(config.backendUrl+url,param).then(function(res){
						if(res.status === 200){
							callback(res.data);
						}
					});
				},
			}
		})



		.filter('channel',function(){
			return function(raw){
				switch(raw){
					case '1001':
						return '盛行天下';
					case '1002':
						return '米饭公社';
					default:
						return null;
				}
			}
		})
})();
