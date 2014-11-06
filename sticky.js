(function () {

	var module = angular.module('sticky', []);

	// Shiv: matchMedia
	//
	window.matchMedia || (window.matchMedia = function() {
		window.console && console.warn && console.warn('angular-sticky: This browser does not support matchMedia, '+
			'therefore the minWidth option will not work on this browser. '+
			'Polyfill matchMedia to fix this issue.');
		return function() {
			return {
				matches: true
			};
		};
	}());

	// Directive: sticky
	//
	module.directive('sticky', function() {

		var linkFn = function(scope , elem, attrs) {
			var mediaQuery  = scope.mediaQuery  || null,
				stickyClass = scope.stickyClass || '',
				bodyClass   = scope.bodyClass   || '',

				$elem   = elem, elem = $elem[0],
				$window = angular.element(window),
				$body   = angular.element(document.body),
				doc     = document.documentElement,

				initial = {
					offsetWidth: elem.offsetWidth,
					top: $elem.css('top'),
					width: $elem.css('width'),
					position: $elem.css('position'),
					marginTop: $elem.css('margin-top'),
				},

				isPositionFixed = false,
				isSticking = false,
				stickyLine;

			var offset = typeof scope.offset === 'string'
				? parseInt( scope.offset.replace(/px;?/, '') )
				: 0;

			// Watchers
			//
			var prevOffset = _getTopOffset(elem);

			scope.$watch( function() {
				if ( isSticking ) return prevOffset;

				prevOffset = _getTopOffset(elem);
				return prevOffset;

			}, function(newVal, oldVal) {
				if ( newVal !== oldVal || typeof stickyLine === 'undefined' ) {
					stickyLine = newVal - offset;
					checkIfShouldStick();
				}
			});

			// checks if the window has passed the sticky line
			function checkIfShouldStick() {
				if ( mediaQuery && !matchMedia('('+mediaQuery+')').matches) return;

				var scrollTop = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
				var shouldStick = scrollTop >=  stickyLine;

				// Switch the sticky modes if the element has crossed the sticky line
				if ( shouldStick && !isSticking )
					stickElement();
						
				else if ( !shouldStick && isSticking )
					unstickElement();
			}

			function stickElement() {
				isSticking = true;
				bodyClass   && $body.addClass(bodyClass);
				stickyClass && $elem.addClass(stickyClass);

				$elem
					.css('position', 'fixed')
					.css('top',      offset+'px')
					.css('width',    initial.offsetWidth)
					.css('margin-top',   0);

			};

			function unstickElement() {
				isSticking = false;
				bodyClass   && $body.removeClass(bodyClass);
				stickyClass && $elem.removeClass(stickyClass);

				$elem
					.css('top',      initial.top)
					.css('position', initial.position)
					.css('margin-top',   initial.marginTop);
			};

			function _getTopOffset (element) {
				var pixels = 0;

				if (element.offsetParent) {
					do {
						pixels += element.offsetTop;
						element = element.offsetParent;
					} while (element);
				}

				return pixels;
			}


			// Listeners
			//
			$window.on('scroll',  checkIfShouldStick);
			$window.on('resize',  scope.$apply.bind(scope, onResize));
			scope.$on('$destroy', onDestroy);

			function onResize() {
				if ( !initial.width ) {

					var parent = window.getComputedStyle(elem.parentElement, null);
					var initialOffsetWidth = elem.parentElement.offsetWidth
						- parent.getPropertyValue('padding-right').replace("px", "")
						- parent.getPropertyValue('padding-left').replace("px", "");
					$elem.css("width", initialOffsetWidth);

				}
			};

			function onDestroy() {
				$window.off('scroll', checkIfShouldStick);
				$window.off('resize', onResize);
			};
		};


		// Directive definition
		//
		return {
			scope: {
				offset: '@',      // top offset
				mediaQuery: '@',  // minimum width required for sticky to come in
				stickyClass: '@', // class to be applied to the element on sticky
				bodyClass: '@'    // class to be applied to the body on sticky
			},
			restrict: 'A',        // sticky can only be used as an ('A') attribute.
			link: linkFn
		};
	});
}());
