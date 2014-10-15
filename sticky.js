angular.module('sticky', [])

.directive('sticky', ['$timeout', function($timeout){
	return {
		restrict: 'A',
		scope: {
			offset: '@',
			stickyClass: '@',
			bodyClass: '@'
		},
		link: function($scope, $elem, $attrs){
			$timeout(function(){
				var offsetTop = $scope.offset || 0,
					stickyClass = $scope.stickyClass || '',
					bodyClass = $scope.bodyClass || '',
					$window = angular.element(window),
					doc = document.documentElement,
					body = angular.element(document.body),
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
						$elem.addClass(stickyClass);
						$elem.css('position', 'fixed');
						body.addClass(bodyClass);
					} else {
						$elem.removeClass(stickyClass);
						$elem.css('position', initialPositionStyle);
						body.removeClass(bodyClass);
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
