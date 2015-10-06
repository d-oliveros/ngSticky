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
          var stickyLine;
          var stickyBottomLine;
          var placeholder;

          var isSticking = false;
          
          var $body = angular.element(document.body);
          var stickyClass = $attrs.stickyClass || '';
          var unstickyClass = $attrs.unstickyClass || '';
          var bodyClass = $attrs.bodyClass || '';

          var usePlaceholder = $attrs.useplaceholder !== undefined;
          var initialStyle = $elem.attr('style') || '';

          var offset = typeof $attrs.offset === 'string' ? parseInt($attrs.offset.replace(/px;?/, '')) : 0;
          var confine = ($attrs.confine === 'true');

          var scrollbar = document.getElementsByTagName("sticky-scroll")[0] || $window;
          var scrollbarElement = angular.element(scrollbar);

          var prevOffset = elementsOffsetFromTop($elem[0]);

          // Define the anchor attribute 
          switch ($attrs.anchor) {
            case 'top':
            case 'bottom':
              var anchor = $attrs.anchor;
              break;
            default:
              var anchor = 'top';
          }

          // initial style
          var initialCSS = {
            zIndex: $elem.css('z-index'),
            top: $elem.css('top'),
            position: $elem.css('position'),
            marginTop: $elem.css('margin-top'),
            marginBottom: $elem.css('margin-bottom'),
            cssLeft: $elem.css('left')
          };

          /**
           * Initialize Sticky
           */
          var initSticky = function () {
            // Listeners
            scrollbarElement.on('scroll', checkIfShouldStick);
            scrollbarElement.on('resize', $scope.$apply.bind($scope, onResize));

            // Clean up
            $scope.$on('$destroy', onDestroy);
          };

          /**
           * Determine if the element should be sticking or not.
           */
          var checkIfShouldStick = function () {
            var scrollTop;
            var shouldStick;
            var scrollBottom;

            // Check media query and disabled attribute
            if (($scope.disabled === true || mediaQueryMatches()) && isSticking) {
              unStickElement();
            }

            if (anchor === 'top') {
              // What's the document client top for?
              scrollTop = scrollbarYPos() - (document.documentElement.clientTop || 0);
              if (confine === true) {
                shouldStick = scrollTop >= stickyLine && scrollTop <= stickyBottomLine;
              } else {
                shouldStick = scrollTop >= stickyLine;
              }
            } else {
              scrollBottom = scrollbarYPos() + scrollbarHeight();
              shouldStick = scrollBottom <= stickyLine;
            }

            // Switch the sticky mode if the element crosses the sticky line
            // $attrs.stickLimit - when it's equal to true it enables the user
            // to turn off the sticky function when the elem height is
            // bigger then the viewport
            if (shouldStick && !shouldStickWithLimit($attrs.stickLimit) && !isSticking) {
              stickElement();
            } else if (!shouldStick && isSticking) {
              unStickElement(getClosest(scrollTop, stickyLine, stickyBottomLine), scrollTop);
            }
          }

          /**
           * Checks if the media matches
           */
          function mediaQueryMatches() {
            var mediaQuery = $attrs.mediaQuery || false;
            var matchMedia = $window.matchMedia;

            return mediaQuery && !(matchMedia('(' + mediaQuery + ')').matches || matchMedia(mediaQuery).matches);
          }

          /**
           * Depricated?
           */
          function shouldStickWithLimit(shouldApplyWithLimit) {
            if (shouldApplyWithLimit === 'true') {
              var elementHeight = $elem[0].offsetHeight;
              var windowHeight = $window.innerHeight;
              return (windowHeight - (elementHeight + parseInt(offset)) < 0);
            } else {
              return false;
            }
          };

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
          };

          /**
           * Unsticks the element
           */
          function unStickElement(fromDirection) {
            $elem.attr('style', initialStyle);
            isSticking = false;

            if (bodyClass) {
              $body.removeClass(bodyClass);
            }

            if (stickyClass) {
              $elem.removeClass(stickyClass);
            }

            if (unstickyClass) {
              $elem.addClass(unstickyClass);
            }

            if (fromDirection === 'top') {
              unStickTop();
            } else if (fromDirection === 'bottom' && confine === true) {
              unStickBottom();
            }

            if (placeholder) {
              placeholder.remove();
            }
          };

          /**
           * Removes the element from top "stickyness"
           */
          function unStickTop() {
            $elem
              .css('z-index', initialCSS.zIndex)
              .css('width', '')
              .css('top', initialCSS.top)
              .css('position', initialCSS.position)
              .css('left', initialCSS.cssLeft)
              .css('margin-top', initialCSS.marginTop);
          }

          /**
           * Removes the element from bottom "stickyness"
           */
          function unStickBottom() {
            $elem
              .css('z-index', initialCSS.zIndex)
              .css('width', '')
              .css('top', '')
              .css('bottom', 0)
              .css('position', 'absolute')
              .css('left', initialCSS.cssLeft)
              .css('margin-top', initialCSS.marginTop)
              .css('margin-bottom', initialCSS.marginBottom);
          };

          /**
           * Sticks the element
           */
          function stickElement() {
            // Set sticky state
            isSticking = true;

            initialCSS.offsetWidth = $elem[0].offsetWidth;

            if (bodyClass) {
              $body.addClass(bodyClass);
            }

            if (unstickyClass && $elem.hasClass(unstickyClass)) {
              $elem.removeClass(unstickyClass);
            }

            if (stickyClass) {
              $elem.addClass(stickyClass);
            }

            createPlaceholder();

            $elem
              .css('z-index', '10')
              .css('width', $elem[0].offsetWidth + 'px')
              .css('position', 'fixed')
              .css(anchor, offset + elementsOffsetFromTop(scrollbar) + 'px')
              .css('left', $elem.css('left').replace('px', '') + 'px')
              .css('margin-top', 0);

            if (anchor === 'bottom') {
              $elem.css('margin-bottom', 0);
            }
          };

          /**
           * Creates a placeholder to avoid jump
           */
          function createPlaceholder() {
            if (usePlaceholder) {
              var elementHeight = $elem[0].offsetHeight;

              placeholder = angular.element('<div>');
              placeholder.css('height', elementsHeight + 'px');
              $elem.after(placeholder);
            }
          }

          /**
           * Clean up directive
           */
          var onDestroy = function () {
            scrollbarElement.off('scroll', checkIfShouldStick);
            scrollbarElement.off('resize', onResize);

            if (bodyClass) {
              $body.removeClass(bodyClass);
            }

            if (placeholder) {
              placeholder.remove();
            }
          }

          /**
           * Resize handler
           */
          var onResize = function () {
            initialCSS.offsetWidth = $elem[0].offsetWidth;

            unStickElement();

            checkIfShouldStick();

            if (isSticking) {
              var parent = $window.getComputedStyle($elem[0].parentElement, null),
                initialOffsetWidth = $elem[0].parentElement.offsetWidth -
                  parent.getPropertyValue('padding-right').replace('px', '') -
                  parent.getPropertyValue('padding-left').replace('px', '');

              $elem.css('width', initialOffsetWidth + 'px');
            }
          };

          var onDigest = function () {
            // triggered on load and on digest cycle
            if ($scope.disabled === true){
              return unStickElement();
            }

            if (isSticking) {
              return prevOffset + scrollbarYPos();
            }

            prevOffset =
              (anchor === 'top') ?
                elementsOffsetFromTop($elem[0]) :
                elementsOffsetFromBottom($elem[0]);

            return prevOffset + scrollbarYPos() - elementsOffsetFromTop(scrollbar);

          };

          var onChange = function (newVal, oldVal) {
            if (( newVal !== oldVal || typeof stickyLine === 'undefined' ) && newVal !== 0 && !isSticking) {
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
              var parentHeight = parseInt(parent.offsetHeight);

              // and now lets ensure we adhere to the bottom margins
              // TODO: make this an attribute? Maybe like ignore-margin?
              var marginBottom = parseInt($elem.css('margin-bottom').replace(/px;?/, '')) || 0;

              // specify the bottom out line for the sticky to unstick
              // TODO: Clean up?
              stickyBottomLine = parent.offsetTop - elementsOffsetFromTop(scrollbar) + parentHeight - ($elem[0].offsetTop + $elem[0].offsetHeight) + offset + marginBottom;

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
          };

          /**
           * Retrieves the bottom offset
           */
          function elementsOffsetFromBottom(element) {
            return element.offsetTop + element.clientHeight;
          };

          /**
           * Retrieves top scroll distance
           */
          function scrollbarYPos() {
            var scrollbarYPos;

            if (typeof scrollbar.scrollTop !== 'undefined') {
              scrollbarYPos = scrollbar.scrollTop;
            } else if (typeof scrollbar.pageYOffset !== 'undefined') {
              scrollbarYPos = scrollbar.pageYOffset;
            } else {
              document.documentElement.scrollTop;
            }

            return scrollbarYPos;
          };

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