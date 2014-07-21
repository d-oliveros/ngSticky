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
					initialWitdhStyle = $elem[0].offsetWidth,
					stickyLine,
					scrollTop;


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

					if ( scrollTop >= stickyLine ){
						$elem.css('position', 'fixed');
						$elem.css('width', initialWitdhStyle);
					} else {
						$elem.css('position', initialPositionStyle);
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


				// Attach our listeners
				//
				$window.on('scroll', checkSticky);
				$window.on('resize', resize);
				
				setInitial();
			});
		},
	};
}]);
