'use strict';

(function() {

	var app = angular.module('swalk.menu');

	app.directive('swalkMenu', function() {
		return {
			restrict : 'E',
			scope : {},
			replace : true,
			controller : function controller($stateParams,$scope) {
				this.menu = $stateParams.menu;
				this.submenu = $stateParams.submenu;
				$scope.merchId = window.localStorage.merchId;
			},
			templateUrl : 'app/modules/menu/menu.tpl.html',
			controllerAs : 'ctrl',
			bindToController : true
		};
	});
})();
