(function () {
  'use strict';

  var module = angular.module('sticky', []);

  // Directive: sticky
  //
  module.directive('sticky', ['$window', function ($window) {
      return {
        restrict: 'A', // this directive can only be used as an attribute.
        scope: {
          disabled: '=disabledSticky'
        },
        link: function linkFn($scope, $elem, $attrs) {
          // Setting scope
          var stickyLine;
          var stickyBottomLine;
          var placeholder;
          var isSticking = false;
          var originalOffset;

          // Optional Classes
          var stickyClass = $attrs.stickyClass || '';
          var unstickyClass = $attrs.unstickyClass || '';
          var bodyClass = $attrs.bodyClass || '';

          // Find scrollbar
          var scrollbar = document.getElementsByTagName('sticky-scroll')[0] || $window;

          // Define elements
          var windowElement = angular.element($window);
          var scrollbarElement = angular.element(scrollbar);
          var $body = angular.element(document.body);

          // Define options 
          var usePlaceholder = ($attrs.usePlaceholder !== 'false');
          var anchor = $attrs.anchor === 'bottom' ? 'bottom' : 'top';
          var confine = ($attrs.confine === 'true');
          var offset = $attrs.offset ? parseInt($attrs.offset.replace(/px;?/, '')) : 0;

          // initial style
          var initialStyle = $elem.attr('style') || '';
          var initialCSS = {
            zIndex: $elem.css('z-index'),
            top: $elem.css('top'),
            position: $elem.css('position'),
            marginTop: $elem.css('margin-top'),
            marginBottom: $elem.css('margin-bottom'),
            cssLeft: $elem.css('left'),
            height: $elem.css('height')
          };

          /**
           * Initialize Sticky
           */
          var initSticky = function () {
            // Listeners
            scrollbarElement.on('scroll', checkIfShouldStick);
            windowElement.on('resize', $scope.$apply.bind($scope, onResize));

            // Clean up
            $scope.$on('$destroy', onDestroy);
          };

          /**
           * Determine if the element should be sticking or not.
           */
          var checkIfShouldStick = function () {

            // Check media query and disabled attribute
            if (($scope.disabled === true || mediaQueryMatches()) && isSticking) {
              return unStickElement();
            }

            // What's the document client top for?
            var scrollbarPosition = scrollbarYPos() - (document.documentElement.clientTop || 0);
            var shouldStick;

            if (anchor === 'top') {
              if (confine === true) {
                shouldStick = scrollbarPosition > stickyLine && scrollbarPosition <= stickyBottomLine;
              } else {
                shouldStick = scrollbarPosition > stickyLine;
              }
            } else {
              shouldStick = scrollbarPosition <= stickyLine;
            }

            // Switch the sticky mode if the element crosses the sticky line
            // $attrs.stickLimit - when it's equal to true it enables the user
            // to turn off the sticky function when the elem height is
            // bigger then the viewport
            var closestLine = getClosest(scrollbarPosition, stickyLine, stickyBottomLine);
            if (shouldStick && !shouldStickWithLimit($attrs.stickLimit) && !isSticking) {
              stickElement(closestLine);
            } else if (!shouldStick && isSticking) {
              unStickElement(closestLine, scrollbarPosition);
            } else if (confine && !shouldStick && closestLine === 'bottom' && $elem.css('position') !== 'absolute') {
              // If we are confined to the parent, refresh, and past the stickyBottomLine
              // We should "remember" the original offset and unstick the element which places it at the stickyBottomLine
              originalOffset = elementsOffsetFromTop($elem[0]);

              unStickElement(closestLine, scrollbarPosition);
            }
          };

          /**
           * Seems to be undocumented functionality
           */
          function shouldStickWithLimit(shouldApplyWithLimit) {
            if (shouldApplyWithLimit === 'true') {
              return ($window.innerHeight - ($elem[0].offsetHeight + parseInt(offset)) < 0);
            } else {
              return false;
            }
          }

          /**
           * Finds the closest value from a set of numbers in an array.
           */
          function getClosest(scrollTop, stickyLine, stickyBottomLine) {
            var closest = 'top';
            var topDistance = Math.abs(scrollTop - stickyLine);
            var bottomDistance = Math.abs(scrollTop - stickyBottomLine);

            if (topDistance > bottomDistance) {
              closest = 'bottom';
            }

            return closest;
          }

          /**
           * Unsticks the element
           */
          function unStickElement(fromDirection) {
            $elem.attr('style', initialStyle);
            isSticking = false;

            $body.removeClass(bodyClass);
            $elem.removeClass(stickyClass);
            $elem.removeClass(stickyClass);
            $elem.addClass(unstickyClass);

            if (fromDirection === 'top') {
              $elem
                .css('z-index', 10)
                .css('width', $elem[0].offsetWidth)
                .css('top', initialCSS.top)
                .css('position', initialCSS.position)
                .css('left', initialCSS.cssLeft)
                .css('margin-top', initialCSS.marginTop)
                .css('height', initialCSS.height);
            } else if (fromDirection === 'bottom' && confine === true) {
              $elem
                .css('z-index', 10)
                .css('width', $elem[0].offsetWidth)
                .css('top', '')
                .css('bottom', 0)
                .css('position', 'absolute')
                .css('left', initialCSS.cssLeft)
                .css('margin-top', initialCSS.marginTop)
                .css('margin-bottom', initialCSS.marginBottom)
                .css('height', initialCSS.height);
            }

            if (placeholder && fromDirection === anchor) {
              placeholder.remove();
            }
          }

          /**
           * Sticks the element
           */
          function stickElement(closestLine) {
            // Set sticky state
            isSticking = true;

            initialCSS.offsetWidth = $elem[0].offsetWidth;

            $body.addClass(bodyClass);
            $elem.removeClass(unstickyClass);
            $elem.addClass(stickyClass);

            if (usePlaceholder && closestLine === anchor) {
              placeholder = angular.element('<div>');
              placeholder.css('height', $elem[0].offsetHeight + 'px');
              $elem.after(placeholder);
            }

            $elem
              .css('z-index', '10')
              .css('width', $elem[0].offsetWidth + 'px')
              .css('position', 'fixed')
              .css('left', $elem.css('left').replace('px', '') + 'px')
              .css(anchor, (offset + elementsOffsetFromTop(scrollbar)) + 'px')
              .css('margin-top', 0);

            if (anchor === 'bottom') {
              $elem.css('margin-bottom', 0);
            }
          }

          /**
           * Clean up directive
           */
          var onDestroy = function () {
            scrollbarElement.off('scroll', checkIfShouldStick);
            windowElement.off('resize', onResize);

            $body.removeClass(bodyClass);

            if (placeholder) {
              placeholder.remove();
            }
          };

          /**
           * Updates on resize.
           */
          var onResize = function () {
            unStickElement(anchor);
            checkIfShouldStick();
          };

          /**
           * Triggered on load / digest cycle
           */
          var onDigest = function () {
            if ($scope.disabled === true){
              return unStickElement();
            }

            if (anchor === 'top') {
              return (originalOffset || elementsOffsetFromTop($elem[0])) - elementsOffsetFromTop(scrollbar) + scrollbarYPos();
            } else {
              return elementsOffsetFromTop($elem[0]) - scrollbarHeight() + $elem[0].offsetHeight + scrollbarYPos();
            }
          };

          /**
           * Triggered on change
           */
          var onChange = function (newVal, oldVal) {
            if (( newVal !== oldVal || typeof stickyLine === 'undefined' ) && !isSticking) {
              stickyLine = newVal - offset;

              // IF the sticky is confined, we want to make sure the parent is relatively positioned,
              // otherwise it won't bottom out properly

              if (confine) {
                $elem.parent().css({
                  'position': 'relative'
                });
              }

              // Get Parent height, so we know when to bottom out for confined stickies
              var parent = $elem.parent()[0];
              // Offset parent height by the elements height, if we're not using a placeholder
              var parentHeight = parseInt(parent.offsetHeight) - (usePlaceholder ? 0 : $elem[0].offsetHeight);

              // and now lets ensure we adhere to the bottom margins
              // TODO: make this an attribute? Maybe like ignore-margin?
              var marginBottom = parseInt($elem.css('margin-bottom').replace(/px;?/, '')) || 0;

              // specify the bottom out line for the sticky to unstick
              var elementsDistanceFromTop = elementsOffsetFromTop($elem[0]);
              var parentsDistanceFromTop = elementsOffsetFromTop(parent)
              var scrollbarDistanceFromTop = elementsOffsetFromTop(scrollbar);

              var elementsDistanceFromScrollbarStart = elementsDistanceFromTop - scrollbarDistanceFromTop;
              var elementsDistanceFromBottom = parentsDistanceFromTop + parentHeight - elementsDistanceFromTop;

              stickyBottomLine = elementsDistanceFromScrollbarStart + elementsDistanceFromBottom - $elem[0].offsetHeight - marginBottom - offset +  + scrollbarYPos();

              checkIfShouldStick();
            }
          };

          /**
           * Helper Functions
           */
          
          /**
           * Fetch top offset of element
           */
          function elementsOffsetFromTop(element) {
            var offset = 0;

            if (element.getBoundingClientRect) {
              offset = element.getBoundingClientRect().top;
            }

            return offset;
          }

          /**
           * Retrieves top scroll distance
           */
          function scrollbarYPos() {
            var position;

            if (typeof scrollbar.scrollTop !== 'undefined') {
              position = scrollbar.scrollTop;
            } else if (typeof scrollbar.pageYOffset !== 'undefined') {
              position = scrollbar.pageYOffset;
            } else {
              position = document.documentElement.scrollTop;
            }

            return position;
          }

          /**
           * Determine scrollbar's height
           */
          function scrollbarHeight() {
            var height;

            if (scrollbarElement[0] instanceof HTMLElement) {
              height = $window.getComputedStyle(scrollbarElement[0], null)
                          .getPropertyValue('height')
                          .replace(/px;?/, '');
            } else {
              height = $window.innerHeight;
            }

            return parseInt(height) || 0;
          }

          /**
           * Checks if the media matches
           */
          function mediaQueryMatches() {
            var mediaQuery = $attrs.mediaQuery || false;
            var matchMedia = $window.matchMedia;

            return mediaQuery && !(matchMedia('(' + mediaQuery + ')').matches || matchMedia(mediaQuery).matches);
          }

          // Setup watcher on digest and change
          $scope.$watch(onDigest, onChange);

          // Init the directive
          initSticky();
        }
      };
    }]
  );

  // Shiv: matchMedia
  //
  window.matchMedia = window.matchMedia || (function () {
      var warning = 'angular-sticky: This browser does not support ' +
        'matchMedia, therefore the minWidth option will not work on ' +
        'this browser. Polyfill matchMedia to fix this issue.';

      if (window.console && console.warn) {
        console.warn(warning);
      }

      return function () {
        return {
          matches: true
        };
      };
    }());
}());