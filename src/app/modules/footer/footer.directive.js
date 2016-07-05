'use strict';

(function() {

	var app = angular.module('swalk.footer');

	app.directive('swalkFooter', function() {
		return {
			restrict : 'E',
			scope : {},
			replace : true,
			controller : function controller() {
			},
			templateUrl : 'app/modules/footer/footer.tpl.html',
			controllerAs : 'ctrl',
			bindToController : true,
		};
	});

})();
