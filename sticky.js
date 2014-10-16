angular.module('sticky', [])

.directive('sticky', ['$timeout', function($timeout){
	return {
		restrict: 'A',
		scope: {
			offset: '@',
			stickyClass: '@'
		},
		link: function($scope, $elem, $attrs){
			$timeout(function(){
				var offsetTop = $scope.offset || 0,
					stickyClass = $scope.stickyClass || '',
					$window = angular.element(window),
					doc = document.documentElement,
					initialPositionStyle = $elem.css('position'),
					stickyLine,
					scrollTop;

				// Get the sticky line
				//
				function setInitial(){
					// Cannot use offsetTop, because this gets
					// the Y position relative to the nearest parent
					// which is positioned (position: absolute, relative).
					// Instead, use Element.getBoundingClientRect():
					// https://developer.mozilla.org/en-US/docs/Web/API/element.getBoundingClientRect
					stickyLine = $elem[0].getBoundingClientRect().top - offsetTop;
					checkSticky();
				}

				// Check if the window has passed the sticky line
				//
				function checkSticky(){
					scrollTop = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);

					if ( scrollTop >= stickyLine ){
						$elem.addClass(stickyClass);
						$elem.css('position', 'fixed');
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
		}
	};
}]);
