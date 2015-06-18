(function () {
  'use strict';

  var module = angular.module('sticky', []);

  // Directive: sticky
  //
  module.directive('sticky', function() {
    return {
      restrict: 'A', // this directive can only be used as an attribute.
      link: linkFn
    };

    function linkFn($scope, $elem, $attrs) {
      var mediaQuery, stickyClass, bodyClass, elem, $window, $body,
        doc, initialCSS, initialStyle, isPositionFixed, isSticking,
        stickyLine, stickyBottomLine, offset, anchor, confine, prevOffset, matchMedia, usePlaceholder, placeholder;

      isPositionFixed = false;
      isSticking      = false;

      matchMedia      = window.matchMedia;

      // elements
      $window = angular.element(window);
      $body   = angular.element(document.body);
      elem    = $elem[0];
      doc     = document.documentElement;

      // attributes
      mediaQuery  = $attrs.mediaQuery  || false;
      stickyClass = $attrs.stickyClass || '';
      bodyClass   = $attrs.bodyClass   || '';

      usePlaceholder = $attrs.useplaceholder == undefined ? false : true;

      initialStyle = $elem.attr('style');

      offset = typeof $attrs.offset === 'string' ?
        parseInt($attrs.offset.replace(/px;?/, '')) :
        0;

      anchor = typeof $attrs.anchor === 'string' ?
        $attrs.anchor.toLowerCase().trim()
        : 'top';
            // Define the confine attribute - will confine sticky to it's parent
            confine = typeof $attrs.confine === 'string' ?
                $attrs.confine.toLowerCase().trim() : 'false';

            confine = (confine === 'true');

      // initial style
      initialCSS = {
        top:       $elem.css('top'),
        width:     $elem.css('width'),
        position:  $elem.css('position'),
        marginTop: $elem.css('margin-top'),
        cssLeft:   $elem.css('left')
      };

      switch (anchor) {
        case 'top':
        case 'bottom':
          break;
        default:
          console.log('Unknown anchor '+anchor+', defaulting to top');
          anchor = 'top';
          break;
      }


      // Listeners
      //
      $window.on('scroll',  checkIfShouldStick);
      $window.on('resize',  $scope.$apply.bind($scope, onResize));
      $scope.$on('$destroy', onDestroy);

      function onResize() {
        initialCSS.offsetWidth = elem.offsetWidth;
        unstickElement();
        checkIfShouldStick();

        if(isSticking){
          var parent = window.getComputedStyle(elem.parentElement, null),
            initialOffsetWidth = elem.parentElement.offsetWidth -
              parent.getPropertyValue('padding-right').replace('px', '') -
              parent.getPropertyValue('padding-left').replace('px', '');

          $elem.css('width', initialOffsetWidth+'px');
        }
      }

      function onDestroy() {
        $window.off('scroll', checkIfShouldStick);
        $window.off('resize', onResize);

        if ( bodyClass ) {
          $body.removeClass(bodyClass);
        }

        if ( placeholder ) {
          placeholder.remove();
        }
      }


      // Watcher
      //
      prevOffset = _getTopOffset(elem);

      $scope.$watch( function() { // triggered on load and on digest cycle
        if ( isSticking ) return prevOffset;

        prevOffset =
          (anchor === 'top') ?
            _getTopOffset(elem) :
            _getBottomOffset(elem);

        return prevOffset;

      }, function(newVal, oldVal) {
        if ( newVal !== oldVal || typeof stickyLine === 'undefined' ) {
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
          console.log(parent.offsetHeight);
          var parentHeight = parseInt(parent.offsetHeight);

          // and now lets ensure we adhere to the bottom margins
          // TODO: make this an attribute? Maybe like ignore-margin?
          var marginBottom = parseInt($elem.css('margin-bottom').replace(/px;?/, '')) || 0;

          // specify the bottom out line for the sticky to unstick
          stickyBottomLine = parentHeight - (elem.offsetTop + elem.offsetHeight) + offset + marginBottom;

          checkIfShouldStick();
        }
      });


      // Methods
      //
      function checkIfShouldStick() {
        var scrollTop, shouldStick, scrollBottom, scrolledDistance;

        if ( mediaQuery && !(matchMedia('('+mediaQuery+')').matches || matchMedia(mediaQuery).matches) ){
            return;
        }

        if ( anchor === 'top' ) {
          scrolledDistance = window.pageYOffset || doc.scrollTop;
          scrollTop        = scrolledDistance  - (doc.clientTop || 0);
          if(confine === true){
            shouldStick    = scrollTop >= stickyLine && scrollTop <= stickyBottomLine;
          } else {
            shouldStick    = scrollTop >=  stickyLine;
          }

        } else {
          scrollBottom     = window.pageYOffset + window.innerHeight;
          shouldStick      = scrollBottom <= stickyLine;
        }

        // Switch the sticky mode if the element crosses the sticky line
        // $attrs.stickLimit - when it's equal to true it enables the user
        // to turn off the sticky function when the elem height is
        // bigger then the viewport
        if ( shouldStick && !_shouldStickWithLimit($attrs.stickLimit) && !isSticking) {
          stickElement();
        } else if ( !shouldStick && isSticking ) {
            // could probably do this better
            var from, compare, closest;
            compare = [stickyLine, stickyBottomLine];
            closest = getClosest(compare,scrollTop);
            // Check to see if we are closer to the top or bottom confines
            // and set from to let the unstick element know the origin
            if(closest == stickyLine){
                from = 'top';
            } else if(closest == stickyBottomLine){
                from = 'bottom';
            }

          unstickElement(from, scrollTop);
        }
      }
            // Simple helper function to find closest value
            // from a set of numbers in an array
            function getClosest(array, num) {
                var i = 0;
                var minDiff = 1000;
                var ans;
                for(i in array){
                    var m = Math.abs(num - array[i]);
                    if(m < minDiff){
                        minDiff = m;
                        ans = array[i];
                    }
                }
                return ans;
            }

      function stickElement() {
        var rect, absoluteLeft;

        rect = $elem[0].getBoundingClientRect();
        absoluteLeft = rect.left;

        initialCSS.offsetWidth = elem.offsetWidth;

        isSticking = true;

        if ( bodyClass ) {
          $body.addClass(bodyClass);
        }

        if ( stickyClass ) {
          $elem.addClass(stickyClass);
        }

        $elem
          .css('width',      elem.offsetWidth+'px')
          .css('position',   'fixed')
          .css(anchor,       offset+'px')
          // This was actually causing a 'jump to the left'
                    // when using 'left' as absoluteLeft + 'px',
                    // allowing left to be automatic fixed the issue.
                    .css('left',       absoluteLeft)
          .css('margin-top', 0);

        if ( anchor === 'bottom' ) {
          $elem.css('margin-bottom', 0);
        }

        //create placeholder to avoid jump
        if( usePlaceholder ) {
                    console.log('use placeholder!');
          placeholder = angular.element("<div>");
          var elementsHeight = $elem[0].offsetHeight;
          placeholder.css("height", elementsHeight + "px");
          $elem.after(placeholder);
        }
      }
      // Passing in scrolltop and directional origin to help
      // with some math later
      function unstickElement(fromDirection, scrollTop) {
        $elem.attr('style', $elem.initialStyle);
        isSticking = false;

        if ( bodyClass ) {
          $body.removeClass(bodyClass);
        }

        if ( stickyClass ) {
          $elem.removeClass(stickyClass);
        }

        if (fromDirection == 'top') {
                    $elem
                        .css('width', '')
                        .css('top', initialCSS.top)
                        .css('position', initialCSS.position)
                        .css('left', initialCSS.cssLeft)
                        .css('margin-top', initialCSS.marginTop);

                } else if (fromDirection == 'bottom' && confine === true) {
                    // make sure we are checking to see if the element is confined to the parent
                    $elem
                        .css('width', '')
                        .css('top', '')
                        .css('bottom', 0)
                        .css('position', 'absolute')
                        .css('left', initialCSS.cssLeft)
                        .css('margin-top', initialCSS.marginTop)
                        .css('margin-bottom', initialCSS.marginBottom);
                }

        if ( placeholder ) {
          placeholder.remove();
        }
      }

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

      function _getBottomOffset (element) {
        return element.offsetTop + element.clientHeight;
      }

      function _shouldStickWithLimit (shouldApplyWithLimit) {
        console.log((shouldApplyWithLimit === 'true'));
        if (shouldApplyWithLimit === 'true') {
          var elementHeight = elem.offsetHeight;
          var windowHeight = window.innerHeight;
          return (windowHeight - (elementHeight + parseInt(offset)) < 0);
        } else {
          return false;
        }
      }
    }

  });

  // Shiv: matchMedia
  //
  window.matchMedia = window.matchMedia || (function() {
    var warning = 'angular-sticky: This browser does not support '+
      'matchMedia, therefore the minWidth option will not work on '+
      'this browser. Polyfill matchMedia to fix this issue.';

    if ( window.console && console.warn ) {
      console.warn(warning);
    }

    return function() {
      return {
        matches: true
      };
    };
  }());

}());
