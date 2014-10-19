window.matchMedia || (window.matchMedia = function() {
	window.console && console.warn('angular-sticky: this browser does not support matchMedia, '+
				'therefore the minWidth option will not work on this browser. '+
				'Polyfill matchMedia to fix this issue.');
	return function() {
		return {
			matches: true
		};
	};
}());

angular.module('sticky', [])

.directive('sticky', ['$timeout', function($timeout){
	return {
		restrict: 'A',
		scope: {
			offset: '@',
			stickyClass: '@',
			mediaQuery: '@'
		},
		link: function($scope, $elem, $attrs){
			$timeout(function(){
				var offsetTop = $scope.offset || 0,
					stickyClass = $scope.stickyClass || '',
					mediaQuery = $scope.mediaQuery || 'min-width: 0',
					$window = angular.element(window),
					doc = document.documentElement,
					initialPositionStyle = $elem.css('position'),
					initialWidth = $elem.css('width'),
					stickyLine,
					scrollTop;


				// Set the top offset
				//
				$elem.css('top', offsetTop+'px');


				// Get the sticky line
				//
				function setInitial(){
					stickyLine = $elem[0].offsetTop - offsetTop;
					initialWidth = $elem.css('width');
					checkSticky();
				}

				// Check if the window has passed the sticky line
				//
				function checkSticky(){
					scrollTop = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);

					if ( scrollTop >= stickyLine && matchMedia('('+ mediaQuery +')').matches ){
						$elem.addClass(stickyClass);
						$elem.css('position', 'fixed');
						$elem.css('width', initialWidth);
					} else {
						$elem.removeClass(stickyClass);
						$elem.css('position', initialPositionStyle);
					}
				}


				// Handle the resize event
				//
				function resize(){
					$elem.css('position', initialPositionStyle);
					$timeout(setInitial);
				}

				// Remove the listeners when the scope is destroyed
				//
				function onDestroy(){
					$window.off('scroll', checkSticky);
					$window.off('resize', resize);
				}

				// Attach our listeners
				//
				$scope.$on('$destroy', onDestroy);
				$window.on('scroll', checkSticky);
				$window.on('resize', resize);

				setInitial();
			});
		},
	};
}]);
