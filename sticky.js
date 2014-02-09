angular.module('doSticky', [])

.directive('sticky', function(){
	return {
		restrict: 'A',
		scope: {
			offsetTop: '@',
		},
		link: function($scope, $elem, $attrs){
			var offsetTop = $scope.offsetTop || 20,
				$window = angular.element(window),
				doc = document.documentElement,
				stickyLine,
				scrollTop;

			// Set the top offset
			//
			$elem.css('top', offsetTop+'px');


			// Get the sticky line
			//
			function setInitial(){
				$elem.removeClass('sticky');
				stickyLine = $elem[0].offsetTop - offsetTop;
				checkSticky();
			}

			// Check if the window has passed the sticky line
			//
			function checkSticky(){
				scrollTop = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);

				if ( scrollTop >= stickyLine ){
					$elem.addClass('sticky');
				} else {
					$elem.removeClass('sticky');
				}
			}

			// Attach our listeners
			//
			$window.on('scroll', checkSticky);
			$window.on('resize', setInitial);
			

			setInitial();
		},
	};
})