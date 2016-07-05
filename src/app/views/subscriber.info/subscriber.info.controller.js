'use strict';
(function () {
	angular.module('ly.subscriber.info')
		.controller('ly.subscriber.info.controller',function($scope,subscriber_info_api,myModal,$state){
		   var onCondition = false;
		   var form = $scope.subscriber_info_form;  
		   $scope.action = {
			   //点击删除按钮
			   deleteItem:function(){
			   		var deletedItems = [];
			   		for (var i = 0; i < $scope.merchList.length; i++) {
			   			if($scope.merchList[i].toBeDeleted){
			   				deletedItems.push($scope.merchList[i].merchId);
			   			}
			   		}
			   		if(deletedItems.length === 0)return;
			   		myModal.confirm({
			   			title:'商户删除',
			   			text:'您确认要删除当前商户，已选中：'+ deletedItems.length +'个。',
			   		}).then(function(){
				   		if(deletedItems.length){
					   		subscriber_info_api.delMerchByIds({merchIds:deletedItems.join()},function(res){
					   			if(res.code == 0){
					   				myModal.show({
					   					text:'删除成功',
					   					size:'sm'
					   				})
					   				$scope.action.reset();
					   			}
					   		})
				   		}
			   		})
			   },
			   //点击重置按钮
			   reset:function(){ 
			   		$scope.merchId = '';
			   		$scope.merchName = '';
			   		$scope.linkTel = '';
			   		$scope.bankId = '';
			   		if($scope.currentPage!=0||onCondition==true){
				   		$scope.currentPage = 0;
				   		this.queryNoCondition();
			   		}
			    },
			    //改变页码
			   pageRefresh:function(page){ 
			   	   if(onCondition){
			   	   	   this.queryOnCondition(page);
			   	   }else{
					   this.queryNoCondition(page);
			   	   }
			   },
			   queryNoCondition:function(page){
			   	    var page = page||0;
			   	    onCondition = false;
			   		subscriber_info_api.merchList({page:page,pageSize:10},function(res){
		   				if(res.code == 0){
		   					$scope.merchList = res.merchList;
		   					$scope.totalItems = res.amount;
		   				}
			   		})
			   },
			   //点击查询按钮
			   queryOnCondition:function(page){
			   		if(typeof page === 'undefined'){
			   			$scope.currentPage = 0;
			   			page = 0;
			   		}
			   	    onCondition = true;
			   		subscriber_info_api.merchListByCriterias(
				   		{
			   				criterias:{
						   		merchId:$scope.merchId,
						   		merchName:$scope.merchName,
						   		linkTel:$scope.linkTel,
						   		bankId:$scope.bankId
						    },
			   				pagingInfo:{
			   					page:page,
			   					pageSize:10
			   				}
				   		},function(res){
			   				if(res.code == 0){
			   					$scope.merchList = res.merchList;
			   					$scope.totalItems = res.amount;
			   				}
				   	});
			   },
		   }
		   //无条件初始化
		   $scope.action.queryNoCondition(); 
		})

})();

;(function(){
	angular.module('ly.subscriber.info')
		.controller('ly.subscriber.info.action.controller',function($scope,$state,$stateParams,subscriber_info_api,myModal){
			var id = $scope.id = $stateParams.id;
			var action = $scope.paramAction = $stateParams.action;
			var form = $scope.formModel = {};
			$scope.action = {
				getMerchInfo:function(merchId){
					
				},
				onSave:function(formArea){
					switch(action){
						case 'edit':
							
							break;
						case 'add':
							var formData;
							switch(formArea){
								case 'baseInfo':
								if($scope.newMerch.baseInfo.$invalid){
									$scope.oncheck = true;
								}else
								{
									formData = this.getFormData().merch;
									subscriber_info_api.addStMerch(formData,function(res){
										if(res.code == 0){
											$scope.oncheck = false;
											myModal.show({
												title:'基本信息',
												text:'保存成功'
											})
										}
									})
								}
								break;
								
							}

							break;
					}	
				},
				viewInit:function(id){
					if(action == 'edit' || action == 'detail'){
						
					}
				},
				getFormData:function(){
					var formData = {
						merch:{
							merchName : form.merchName,
							merchShort : form.merchShort,
							merchIntro : form.merchIntro,
							merchType : form.merchType,
							linkMan : form.linkMan,
							linkTel : form.linkTel,
							channelId : form.channelId,
							address : form.address,
							email : form.email,
							level : form.level,
						},
						settleInfo:{
							accountName : form.accountName,
							bankName : form.bankName,
							province : form.province,
							city : form.city,
							branchName : form.branchName,
							bankFirm : form.bankFirm,
							bankAccount : form.bankAccount,
							invoiceRate : form.invoiceRate,
							chargeType : form.chargeType,
							chargeMethod : form.chargeMethod,
							fixedAmount : form.fixedAmount,
							chargeRate : form.chargeRate,
							settleSpeed : form.settleSpeed,
							needStatement : form.needStatement
						}
					}
					return formData;
				}
			}
		})
})();