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
			mediaQuery: '@',
			bodyClass: '@'
		},
		link: function($scope, $elem, $attrs){
			$timeout(function(){
				var offsetTop = $scope.offset || 0,
					stickyClass = $scope.stickyClass || '',
					mediaQuery = $scope.mediaQuery || 'min-width: 0',
					bodyClass = $scope.bodyClass || '',
					$window = angular.element(window),
					doc = document.documentElement,
					body = angular.element(document.body),
					initialPositionStyle = $elem.css('position'),
					initialWidthStyle = $elem[0].offsetWidth,
					stickyLine,
					scrollTop,
					isSticky,
					isPositionFixed;


				// Set the top offset
				//
				$elem.css('top', offsetTop+'px');

				// Just for identify if the sticky element has a fixed width defined
				//
				var noWidth = true;
				if ($elem[0].attributes.style.value.indexOf('width') == 0) {
					noWidth = false;
				}

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
					isSticky = scrollTop >= stickyLine && matchMedia('('+ mediaQuery +')').matches;
					isPositionFixed = $elem.css('position') == 'fixed';

					if (isSticky && !isPositionFixed){
						$elem.addClass(stickyClass);
						$elem.css('position', 'fixed');
						body.addClass(bodyClass);
						$elem.css('width', initialWidthStyle);
					} else if (!isSticky && isPositionFixed) {
						$elem.removeClass(stickyClass);
						$elem.css('position', initialPositionStyle);
						body.removeClass(bodyClass);
					}
				}


				// Handle the resize event
				//
				function resize(){
					if (noWidth) {
						var parent = window.getComputedStyle($elem[0].parentElement, null);
						initialWidthStyle = $elem[0].parentElement.offsetWidth
							- parent.getPropertyValue('padding-right').replace("px", "")
							- parent.getPropertyValue('padding-left').replace("px", "");
						$elem.css("width", initialWidthStyle);
					}
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
