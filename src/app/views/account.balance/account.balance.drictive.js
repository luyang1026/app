'use strict';
(function () {

 	angular.module('ly.account.balance')
 		.directive('myDatePicker', function () {
	        return {
	            restrict: 'A',
	            // require: 'ngModel',
	            link: function (scope, element, attrs, ngModelCtrl) {
	                var minView = element.data("minview");
	                element.datetimepicker({
	                    autoclose: true,
	                    minView: minView == 0 ? minView : 2,
	                    format: minView == 0 ? 'yyyy-mm-dd hh:ii:ss' : 'yyyy-mm-dd',
	                    language: 'zh-CN',
	                    startDate: '2013-01-01',      // set a minimum date
	                    endDate: '2099-10-10'          // set a maximum date
	                }).on('changeDate', function (e) {
	                    if(e.date != null){
	                        ngModelCtrl.$setViewValue(e.date);
	                        scope.$apply();
	                    }
	                });
	            }
	        };
    	})
})();

