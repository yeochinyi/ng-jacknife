'use strict';

//E 8 and below do not have the Array.prototype.indexOf method
var indexOf = function(needle) {
    if(typeof Array.prototype.indexOf === 'function') {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function(needle) {
            var i = -1, index = -1;

            for(i = 0; i < this.length; i++) {
                if(this[i] === needle) {
                    index = i;
                    break;
                }
            }

            return index;
        };
    }

    return indexOf.call(this, needle);
};


angular
    .module('ngJacknife', [])
    .directive('button', function() {
      return {
        restrict : 'E',
        // use compile and not using scope.
        // if use link, ng-repeat will addClass for each loop
        compile : function(element, attributes) {
          element.addClass('btn');
          if (attributes.type === 'submit') {
            element.addClass('btn-primary');
          }
          if (attributes.size) {
            element.addClass('btn-' + attributes.size);
          }
        }
      };
    })
    .directive('pagination',
        function() {
          return {
            // templateUrl: 'src/pagination.html',
            template : '<div class="pagination">'
                + '<ul>'
                + '	<li ng-class="{disabled: noPrevious()}">'
                + '			<a ng-click="selectPrevious()">Previous</a>'
                + '	</li>'
                + '	<li ng-repeat="page in pages" ng-class="{active: isActive(page)}">'
                + '		<a ng-click="selectPage(page)">{{page}}</a>' + '	</li>'
                + '	<li ng-class="{disabled: noNext()}">'
                + '			<a ng-click="selectNext()">Next</a>' + '	</li>' + '</ul>'
                + '</div>',
            restrict : 'E',
            // isolated scope & data-bind
            scope : {
              numPages : '=',
              currentPage : '=',
              onSelectPage : '&'
            // selectingPage: '&onSelectPage'
            },
            replace : true,
            link : function(scope, element, attrs, controller) { // can use controller: ['$scope, '$element', '$attrs', function($scope, $element, $attrs) { as well
              scope.$watch('numPages', function(value) {
                scope.pages = [];
                for (var i = 1; i <= value; i++) {
                  scope.pages.push(i);
                }
                if (scope.currentPage > value) {
                  scope.selectPage(value);
                }
              });
              scope.isActive = function(page) {
                return scope.currentPage === page;
              };
              scope.selectPage = function(page) {
                if (!scope.isActive(page)) {
                  scope.currentPage = page;
                  scope.onSelectPage({
                    page : page
                  });
                  // scope.selectingPage({page:page});

                }
              };
              scope.selectNext = function() {
                if (!scope.noNext()) {
                  scope.selectPage(scope.currentPage + 1);
                }
              };
              scope.noNext = function() {
                return scope.currentPage === scope.numPages;
              };
            }
          }
        }).directive('validateEquals', function() {
      return {
        restrict : 'AEC',
        require : 'ngModel',
        scope : false,
        link : function(scope, elm, attrs, ngModelCtrl) {
          function validateEqual(myValue) {
            var valid = (myValue === scope.$eval(attrs.validateEquals));
            // $setValidity(validationErrorKey, isValid) called to set whether
            // the model is valid for a given kind of validation error
            ngModelCtrl.$setValidity('equal', valid);
            return valid ? myValue : undefined;
          }
          // A pipeline of functions that will be called
          // in turn when the value of the input element changes
          ngModelCtrl.$parsers.push(validateEqual);
          // A pipeline of functions that will be called in
          // turn when the value of the model changes.
          ngModelCtrl.$formatters.push(validateEqual);

          // artificially trigger the $parsers pipeline to run by calling
          // $setViewValue().
          scope.$watch(attrs.validateEquals, function() {
            // doesn't work now as it check if changed'
            // ngModelCtrl.$setViewValue(ngModelCtrl.$viewValue);
            var myValue = validateEqual(ngModelCtrl.$modelValue);
            // need to set $modelValue back to view
            ngModelCtrl.$setViewValue(myValue);
          });
        }
      };
    }).directive('uniqueEmail', [ "Users", function(Users) {
      return {
        restrict : 'AEC',
        scope : false,
        require : 'ngModel',
        link : function(scope, element, attrs, ngModelCtrl) {
          var original; //used to detect changes
          ngModelCtrl.$formatters.unshift(function(modelValue) {
            original = modelValue;
            return modelValue;
          });

          ngModelCtrl.$parsers.push(function(viewValue) {
            if (viewValue && viewValue !== original) {
              Users.query({
                email : viewValue
              }, function(users) {
                if (users.length === 0) {
                  ngModelCtrl.$setValidity('uniqueEmail', true);
                } else {
                  ngModelCtrl.$setValidity('uniqueEmail', false);
                }
              });
              return viewValue;
            }
          });
        }
      };
    } ]).directive(
        'datePicker',
        function() {
          return {
            // require ngModel and place functions on the $parsers and
            // $formatters pipeline to transform the values between the model
            // and the view
            require : 'ngModel',
            link : function(scope, element, attrs, ngModelCtrl) {
              ngModelCtrl.$formatters.push(function(date) {
                if (angular.isDefined(date) && date !== null
                    && !angular.isDate(date)) {
                  throw new Error('ng-Model value must be a Date object');
                }
                return date;
              });
              var updateModel = function() {
                scope.$apply(function() {
                  // To get the data out, we use the onSelect callback to call
                  // ngModel.$setViewValue(), which updates the view value and
                  // triggers the $parsers pipeline.
                  var date = element.datepicker("getDate");
                  element.datepicker("setDate", element.val());
                  ngModelCtrl.$setViewValue(date);
                });
              };
              var onSelectHandler = function(userHandler) {
                if (userHandler) {
                  return function(value, picker) {
                    updateModel();
                    return userHandler(value, picker);
                  };
                } else {
                  return updateModel;
                }
              };
              var setUpDatePicker = function() {
                // onselect callback
                // element.datepicker({onSelect: function(value, picker) { ...
                // });
                var options = scope.$eval(attrs.datePicker) || {};
                options.onSelect = onSelectHandler(options.onSelect);
                element.bind('change', updateModel);
                element.datepicker('destroy');
                element.datepicker(options);
                ngModelCtrl.$render();
              };
              // update the widget. This function is called after all the
              // $formatters have
              // been
              // executed successfully
              ngModelCtrl.$render = function() {
                element.datepicker("setDate", ngModelCtrl.$viewValue);
              };
              scope.$watch(attrs.datePicker, setUpDatePicker, true);
            }
          };
        }).directive(
        'alert',
        function() {
          return {
            restrict : 'AEC',
            replace : true, // or not will append
            transclude : true, // transclude only children or 'element' => all including element itself i.e. ng-repeat
            template : '<div class="alert-{{type}}">'
                + '<button type="button" class="close"'
                + 'ng-click="close()">&times;' + '</button>'
                + '<div ng-transclude></div>' + '</div>',
            scope : {
              type : '@',
              close : '&'
              
            }
          };
        })
   .directive('if', function() {
      return {
        transclude : 'element', //transclude attribute's directive with lower priority
        priority : 500, //'if' watches will refer to scope of ng-repeat (with 1000)
        compile : function(element, attr, transclude) { //compile give transclude give link
          return function postLink(scope, element, attr) {
            var childElement, childScope;
            scope.$watch(attr['if'], function(newValue) { //$watch for expr vs $observe for string (to be interpolate)
              if (childElement) {
                childElement.remove();
                childScope.$destroy();
                childElement = undefined;
                childScope = undefined;
              }
              if (newValue) {
                childScope = scope.$new();
                //scope can only be passed in transclude in postLink or can use controller: function(..,$transclude)
                childElement = transclude(childScope, function(clone) {
                  element.after(clone);
                });
              }
            });
          };
        }
      }
    })
    .controller('AccordionController', ['$scope', '$attrs',
      function ($scope, $attrs) {
        this.groups = [];
        this.closeOthers = function(openGroup) {
          angular.forEach(this.groups, function (group) {
            if ( group !== openGroup ) {
              group.isOpen = false;
            }
          });
        };
      
        this.addGroup = function(groupScope) {
          var that = this;
          this.groups.push(groupScope);
          groupScope.$on('$destroy', function (event) {
            that.removeGroup(groupScope);
          });
        };
        this.removeGroup = function(group) {
          var index = this.groups.indexOf(group);
          if ( index !== -1 ) {
              this.groups.splice(this.groups.indexOf(group), 1);
          }
        };
    }])
    .directive('accordion', function () {
      return {
        restrict:'E',
        //priority : 500,
        //directive controller init behaviour for dom rather than scope as in normal controllers
        //can be injected with $element, $attrs, $transclude i.e append($transclude())
        controller:'AccordionController', 
        link: function(scope, element, attrs) {
          element.addClass('accordion');
       }
    };
   })
   .directive('accordionGroup', function() {
    return {
      require:'^accordion',
      restrict:'E',
      transclude:true,
      replace: true,
      //templateUrl:'template/accordion/accordion-group.html',
      template: 
        '<div class="accordion-group">'+
          '<div class="accordion-heading">'+
            '<a class="accordion-toggle" ng-click="isOpen=!isOpen">{{heading}}</a>'+
          '</div>'+
          '<div class="accordion-body" ng-show="isOpen">'+
          '<div class="accordion-inner" ng-transclude></div>'+
          '</div>'+
        '</div>',      
      scope:{ 
        heading:'@' 
      },
      link: function(scope, element, attrs, accordionCtrl) {
        accordionCtrl.addGroup(scope);
        scope.isOpen = false;
        scope.$watch('isOpen', function(value) {
          if (value) {
            accordionCtrl.closeOthers(scope);
          }
        });
      }
    };
    })    

// Difficulties     
//1. insert a different template depending upon the type of field    
//2. generate and apply unique name and id attributes for the input and wire up the label elements for attribute, before the ng-model
//3. extract the validation messages for the field from the child validator elements
    
   .directive('field', function($interpolate,$http,$templateCache,$compile) {
    return {
      restrict:'E',
      priority: 100,
      replace: true,
      terminal: true, //to ensure that it runs before the ng-model directive i.e not process the child elements of this directive's element or any other directives on this directive's element that have a lower priority than this directive.
      compile: function(element, attrs) {
        
        function getLabelContent(element) {
          var label = element.find('label');
          return label[0] && label.html();
        }
        
        function getValidationMessageMap(element) {
          var messageFns = {};
          var validators = element.find('validator');
          angular.forEach(validators, function(validator) {
            validator = angular.element(validator);
            //how interpolate works...
            //var getFullName = $interpolate('{{first}}{{last}}');
            //var scope = { first:'Pete',last:'Bacon Darwin' };
            //var fullName = getFullName(scope);
            messageFns[validator.attr('key')] = $interpolate(validator.text());
          });
          return messageFns;
        }        
        
        
        function loadTemplate(template) {
          return $http.get(template, {cache:$templateCache}).then(function(response) {
            return angular.element(response.data);
          }, function(response) {
            throw new Error('Template not found: ' + template);
          });
        }        
        
        var validationMsgs = getValidationMessageMap(element);
        var labelContent = getLabelContent(element);
        element.html(''); //empty out the contents of the element so that we have a clean element in which to load the template
        return function postLink(scope, element, attrs) {
          var template = attrs.template || 'input.html';
          loadTemplate(template).then(function(templateElement) {   
            var childScope = scope.$new();
            //attach useful properties
            //childScope.$type = element.find('input').attr('type');
            childScope.$validationMessages = angular.copy(validationMsgs);
            childScope.$fieldId = attrs.ngModel.replace('.', '_').toLowerCase() + '_' + childScope.$id;
            childScope.$fieldLabel = labelContent;
            //childScope.$watch('$field.$dirty && $field.$error', function(errorList) {
            childScope.$watch('$field.$error', function(errorList) {
              childScope.$fieldErrors = [];
              angular.forEach(errorList, function(invalid, key) {
                if (invalid) {
                  childScope.$fieldErrors.push(key);
                }
              });
            }, true);  
            
            //var inputElement = findInputElement(templateElement);
            var inputElement = templateElement.find('input')
            //copy over all the attributes from the field directive's element to template's
            angular.forEach(attrs.$attr, function (original, normalized) {
              var value = element.attr(original);
              inputElement.attr(original, value);
            });
            //add on computed values for the name and id
            inputElement.attr('name', childScope.$fieldId);
            inputElement.attr('id', childScope.$fieldId); 
            //inputElement.attr('type', childScope.$type);
            
            //copy in the labelContent and apply the for attribute to the label
            var labelElement = templateElement.find('label');
            labelElement.attr('for', childScope.$fieldId);
            labelElement.html(labelContent);
            
            element.append(templateElement);
            $compile(templateElement)(childScope);
            childScope.$field = inputElement.controller('ngModel');
            
          });
        };
      }
    }
   })
   .directive('numShorthand', ['$log', function($log) {
     
     var bigNums = {B: 1.0e+9,
                    M: 1.0e+6,
                    K: 1.0e+3};
     
     
     var addCommasToInteger = function(value) {
       var val = "" + value;
       var commas, decimals, wholeNumbers;
       decimals = val.indexOf('.') == -1 ? '' : val.replace(/^-?\d+(?=\.)/, '');
       wholeNumbers = val.replace(/(\.\d+)$/, '');
       commas = wholeNumbers.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
       return "" + commas + decimals;
     };
     
      return {
        restrict : 'A',
        require : 'ngModel',
        scope : false,
        link : function(scope, elm, attrs, ngModelCtrl) {
          // Called in turn when the value of the input element changes
          ngModelCtrl.$parsers.push(function(val){
//            if(_.isNumber(+val)){
//              return +val;
//            }
            var value = "" + val;
            try{
              var index = value.length - 1;
              var last = value.charAt(index).toUpperCase();
              var num = bigNums[last];
              if(!num){
                $log.warn("Can't parse:" + value)
                //ngModelCtrl.$setViewValue(addCommasToInteger(value));
                return parseFloat(value);
              }
              var digits = parseFloat(value.substring(0,index));
              var ret = digits * num;
              ngModelCtrl.$setViewValue(addCommasToInteger(ret));
              return ret;
            }
            catch(e){
              $log.warn("Can't parse:" + value)
              //ngModelCtrl.$setViewValue(addCommasToInteger(value));
              return parseFloat(value);
            }
          });
          // Called in turn when the value of the model changes.
          ngModelCtrl.$formatters.push(addCommasToInteger);
        }
      };
    }])
        .directive('sort',['$compile',function($compile) {
        return {
            restrict: 'A',
            transclude: true,
            //scope: { by:'@'},
            scope : {
              sort : '@'
            },
            template: 
                '<span style="white-space: nowrap;" ng-click="sortFn(sort)"><span ng-transclude></span>&nbsp;' +
                    '<i class="fa" ng-class="{\'fa-sort-asc\': isSortUp(\'{{sort}}\'), \'fa-sort-desc\': isSortDown(\'{{sort}}\')}"></i></span>'
        };
    }])

   .filter('numberText',function(){
       return function(v, decimalPlaces){
           if(_.isUndefined(v)){
               return '';
           }
           var n = Number(v);
           var abs = Math.abs(n);
           var text = '';
           var bigNums = [
               {id:'B', num: 1.0e+9},
               {id:'M', num: 1.0e+6},
               {id:'K', num: 1.0e+3}
           ];

           for(var i = 0; i < bigNums.length;i++){
            if(abs >= bigNums[i].num){
                n /= bigNums[i].num;
                text = bigNums[i].id;
                break;
            }
           };
           if(decimalPlaces){
                n = n.toFixed(decimalPlaces);
           }
           return n + text;
       };
   })
   .filter('percent', ['$filter', function ($filter) {
        return function (input, decimals) {
            var v = $filter('number')(input * 100, decimals);
            if(v === "") return "";
            return  v + '%';
        };
    }])
;
