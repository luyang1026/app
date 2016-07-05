'use strict';
angular.module('appE2E',['app','ngMockE2E'])
	.run(function($httpBackend){
		$httpBackend.whenGET(/html/).passThrough();
		//登录
		$httpBackend.whenPOST('/register')
			.respond(function(method,url,data){
				var status;
				data = angular.fromJson(data);
				if(data.password === '111111'){
					status = 200;
				}
				return [200,{
					status:status
				}]
			});
	})