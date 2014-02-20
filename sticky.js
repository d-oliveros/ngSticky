angular.module('sticky', [])

.directive('sticky', ['$timeout', function($timeout){
	return {
		restrict: 'A',
		scope: {
			offset: '@',
		},
		link: function($scope, $elem, $attrs){
			$timeout(function(){
				var offsetTop = $scope.offset || 0,
					$window = angular.element(window),
					doc = document.documentElement,
					initialPositionStyle = $elem.css('position'),
					stickyLine,
					scrollTop;


				// Set the top offset
				//
				$elem.css('top', offsetTop+'px');


				// Get the sticky line
				//
				function setInitial(){
					stickyLine = $elem[0].offsetTop - offsetTop;
					checkSticky();
				}

				// Check if the window has passed the sticky line
				//
				function checkSticky(){
					scrollTop = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);

					if ( scrollTop >= stickyLine ){
						$elem.css('position', 'fixed');
					} else {
						$elem.css('position', initialPositionStyle);
					}
				}


				// Handle the resize event
				//
				function resize(){
					$elem.css('position', initialPositionStyle);
					$timeout(setInitial);
				}


				// Attach our listeners
				//
				$window.on('scroll', checkSticky);
				$window.on('resize', resize);
				
				setInitial();
			});
		},
	};
}]);
