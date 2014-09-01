angular.module('sticky', [])

.directive('sticky', ['$timeout',
	function($timeout) {
		return {
			restrict: 'A',
			scope: {
				offset: '@',
			},
			link: function($scope, $elem, $attrs) {
				$timeout(function() {
					var offsetTop = $scope.offset || 0,
						$window = angular.element(window),
						doc = document.documentElement,
						initialPositionStyle = $elem.css('position'),
						initialLeft = $elem.css('left'),
						stickyLine,
						scrollTop,
						left;


					// Set the top offset
					//
					$elem.css('top', offsetTop + 'px');


					// Get the sticky line
					//
					function setInitial() {
						stickyLine = $elem[0].offsetTop - offsetTop;
						checkSticky();
						left = $elem[0].offsetLeft + $elem[0].clientWidth;
					}

					// Check if the window has passed the sticky line
					//
					function checkSticky() {
						scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

						if (scrollTop >= stickyLine) {
							$elem.css('position', 'fixed');
							$elem.css('left', left + 'px');
						} else {
							$elem.css('position', initialPositionStyle);
							$elem.css('left', initialLeft);
						}
					}


					// Handle the resize event
					//
					function resize() {
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
	}
]);