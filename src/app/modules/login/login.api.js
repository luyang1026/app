'use strict';
(function(){
	angular.module('ly.login')
		.factory('loginApi',function($http,config){
			return{
				register:function(param,callback){
					$http.post(config.backendUrl+'/register',{
							name:param.name,
							password:param.password	
					}).success(function(data){
						callback(data);
					})
				}
			}
		})
})();