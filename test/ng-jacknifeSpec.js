'use strict';
describe('sample button directive', function() {
  var $compile, $rootScope;
  beforeEach(module('ng-jacknife'));
  beforeEach(inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));
  it('adds a "btn" class to the button element', function() {
    var element = $compile('<button></button>')($rootScope);
    expect(element.hasClass('btn')).toBe(true);
  });
  it('adds size classes correctly', function() {
    var element = $compile('<button size="large"></button>')($rootScope);
    expect(element.hasClass('btn-large')).toBe(true);
  });
  it('adds primary class to submit buttons', function() {
    var element = $compile('<button type="submit"></button>')($rootScope);
    expect(element.hasClass('btn-primary')).toBe(true);
  });
});

describe(
    'sample pagination directive',
    function() {
      var $scope, element, lis;

      beforeEach(module('ng-jacknife'));
      beforeEach(inject(function($compile, $rootScope, $httpBackend) {
        $scope = $rootScope.$new();
        // $httpBackend.expectGET('i18n/en.json').respond(200, '');
        // $httpBackend.expectGET('/views/templates.html').respond(200, '');
        // $httpBackend.expectGET('/src/pagination.html').respond(200, '');

        $scope.numPages = 5;
        $scope.currentPage = 3;
        element = $compile(
            '<pagination '
                + ' num-pages="numPages" current-page="currentPage" '
                + ' on-select-page="selectPageHandler(page) '
                + '"></pagination>')($scope);

        $scope.$digest();
        // console.log(element);
        lis = function() {
          return element.find('li');
        };

      }));
      it('has the number of the page as text in each page item', function() {
        for (var i = 1; i <= $scope.numPages; i++) {
          expect(lis().eq(i).text().trim()).toEqual('' + i);
        }
      });
      it('sets the current-page to be active', function() {

        var currentPageItem = lis().eq($scope.currentPage);
        expect(currentPageItem.hasClass('active')).toBe(true);
      });

      it('disables "next" if current-page is num-pages', function() {

        $scope.currentPage = 5;
        $scope.$digest();
        // console.log(element);
        var nextPageItem = lis().eq(-1);
        // console.log(nextPageItem);
        expect(nextPageItem.hasClass('disabled')).toBe(true);
      });

      it('changes currentPage if a page link is clicked', function() {
        var page2 = lis().eq(2).find('a').eq(0);
        // using $() as PhantomJS has issue with click()
        $(page2).click();
        $scope.$digest();

        expect($scope.currentPage).toBe(2);
      });

      it(
          'does not change the current page on "next" click if already at last page',
          function() {
            var next = lis().eq(-1).find('a');
            $scope.currentPage = 5;
            $scope.$digest();
            $(next).click();
            $scope.$digest();
            expect($scope.currentPage).toBe(5);
          });

      it('changes the number of items when numPages changes', function() {
        $scope.numPages = 8;
        $scope.$digest();
        expect(lis().length).toBe(10);
        expect(lis().eq(0).text().trim()).toBe('Previous');
        expect(lis().eq(-1).text().trim()).toBe('Next');
      });

      it('executes the onSelectPage expression when the current page changes',
          function() {
            $scope.selectPageHandler = jasmine.createSpy('selectPageHandler');
            var page2 = element.find('li').eq(2).find('a').eq(0);
            $(page2).click();
            $scope.$digest();
            expect($scope.selectPageHandler).toHaveBeenCalledWith(2);
          });
    });

describe(
    'validateEquals directive',
    function() {
      // var $scope, modelCtrl, modelValue;
      var $scope, element;
      beforeEach(module('ng-jacknife'));
      beforeEach(inject(function($compile, $rootScope) {
        $scope = $rootScope.$new();
        $scope.test1 = 'true';
        var html = '<form name="testForm">' + '<input name="testInput"'
            + 'ng-model="model.value"' + 'validate-equals="model.testValue">'
            + '</form>';
        element = $compile(html)($scope);
        $scope.model = {};
        $scope.test2 = 'true';
        // $scope.model = {};
        // modelValue = $scope.model = {};
        // modelCtrl = $scope.testForm.testInput;
        $scope.$digest();
        $scope.test3 = 'true';
        // ...
      }));
      // ...
      describe(
          'model value changes',
          function() {
            it('should be invalid if the model changes', function() {
              $scope.model.testValue = 'different';
              $scope.$digest();
              expect($scope.testForm.testInput.$viewValue).toBe(undefined);
              expect($scope.testForm.testInput.$valid).toBeFalsy();
            });
            it('should be invalid if the reference model changes', function() {
              $scope.model.value = 'different';
              $scope.$digest();
              expect($scope.testForm.testInput.$valid).toBeFalsy();
              expect($scope.testForm.testInput.$viewValue).toBe(undefined);
            });
            it(
                'should be valid if the modelValue changes to be the same as the reference',
                function() {
                  $scope.model.value = 'different';
                  $scope.$digest();
                  expect($scope.testForm.testInput.$valid).toBeFalsy();
                  $scope.model.testValue = 'different';
                  $scope.$digest();
                  expect($scope.testForm.testInput.$valid).toBeTruthy();
                  expect($scope.testForm.testInput.$viewValue)
                      .toBe('different');
                });
          });

      // If you change $viewValue, $parsers will translate it back to
      // $modelValue.
      // If you change $modelValue, $formatters will convert it to $viewValue.
      describe(
          'input value changes',
          function() {
            it('should be invalid if the input value changes', function() {
              $scope.testForm.testInput.$setViewValue('different');
              expect($scope.testForm.testInput.$valid).toBeFalsy();
              expect($scope.model.testValue).toBe(undefined);
            });
            it(
                'should be valid if the input value changes to be the same as the reference',
                function() {
                  $scope.model.testValue = 'different';
                  $scope.$digest();
                  expect($scope.testForm.testInput.$valid).toBeFalsy();
                  $scope.testForm.testInput.$setViewValue('different');
                  expect($scope.testForm.testInput.$viewValue)
                      .toBe('different');
                  expect($scope.testForm.testInput.$valid).toBeTruthy();
                });
          });
    });

angular.module('mock.users', []).factory('Users', function() {
  var Users = {};
  Users.query = function(query, response) {
    Users.respondWith = function(emails) {
      response(emails);
      Users.respondWith = undefined;
    };
  };
  return Users;
});

describe(
    'uniqueEmail directive',
    function() {
      var Users, element, $scope;
      beforeEach(module('mock.users'));
      beforeEach(module('ng-jacknife'));
      beforeEach(inject(function($compile, $rootScope, _Users_) {
        Users = _Users_;
        spyOn(Users, 'query').and.callThrough();
        $scope = $rootScope.$new();
        element = $compile(
            '<form name="testForm"><input name="testInput" ng-model="user.email" unique-email></form>')
            ($scope);
        $scope.$digest();
      }));
      it('should call Users.query when the view changes', function() {
        $scope.testForm.testInput.$setViewValue('different');
        $scope.$digest();
        expect(Users.query).toHaveBeenCalled();
      });
      it(
          'should set model to invalid if the Users.query response contains users',
          function() {
            $scope.testForm.testInput.$setViewValue('different');
            Users.respondWith([ 'someUser' ]);
            expect($scope.testForm.testInput.$valid).toBe(false);
          });
      it(
          'should set model to valid if the Users.query response contains no users',
          function() {
            $scope.testForm.testInput.$setViewValue('different');
            Users.respondWith([]);
            expect($scope.testForm.testInput.$valid).toBe(true);
          });
    });

describe('simple use on input element', function() {
  var aDate, element, $scope;
  beforeEach(module('ng-jacknife'));
  beforeEach(inject(function($compile, $rootScope) {
    $scope = $rootScope.$new();
    aDate = new Date(11, 11, 11);
    element = $compile("<input date-picker ng-model='x'/>")($scope);
    $scope.$digest();
  }));

  var selectDate = function(element, date) {
    element.datepicker('setDate', date);
    $.datepicker._selectDate(element);
  };

  // Notice that we do not call $digest() after
  // selectDate(), since it is the directive's job to ensure that the digest
  // occurs after a
  // user interaction
  it('should get the date from the model', function() {
    $scope.x = aDate;
    $scope.$digest();
    // expect(element.datepicker('getDate')).toEqual(aDate);
  });
});
// it('should put the date in the model', function() {
// $scope.$digest();
// selectDate(element, aDate);
// expect($scope.x).toEqual(aDate);
// });

describe('testing misc', function() {
  var element, scope;
  beforeEach(module('ng-jacknife'));
  beforeEach(inject(function($compile, $rootScope) {
    scope = $rootScope.$new();
    element = $compile('<div><div if="someVar"></div></div>')(scope);
  }));

  it('creates or removes the element as the if condition changes', function() {
    scope.$apply('someVar = true');
    expect(element.children().length).toBe(1);
    scope.$apply('someVar = false');
    expect(element.children().length).toBe(0);
    scope.$apply('someVar = true');
    expect(element.children().length).toBe(1);
  });
});

// describe('closeOthers', function() {
// var group1, group2, group3;
// beforeEach(function() {
// ctrl.addGroup(group1 = $scope.$new());
// ctrl.addGroup(group2 = $scope.$new());
// ctrl.addGroup(group3 = $scope.$new());
// group1.isOpen = group2.isOpen = group3.isOpen = true;
// });
// it('closes all groups other than the one passed', function() {
// ctrl.closeOthers(group2);
// expect(group1.isOpen).toBe(false);
// expect(group2.isOpen).toBe(true);
// expect(group3.isOpen).toBe(false);
// });
// });

describe('accordion-group test', function() {
  var scope, element, groups;
  beforeEach(module('ng-jacknife'));
  beforeEach(inject(function($rootScope, $compile) {
    
    //scope = $rootScope;
    scope = $rootScope.$new();
    var tpl = "<accordion>"
        + "<accordion-group heading='title 1'>Content 1</accordion-group>"
        + "<accordion-group heading='title 2'>Content 2</accordion-group>"
        + "</accordion>";
    element = $compile(tpl)(scope);
    scope.$digest();
    groups = element.find('.accordion-group');
  }));
  it('should change selected element on click', function() {
    groups.eq(0).find('a').click();
    scope.$apply();
    expect(groups.eq(0).isolateScope().isOpen).toBe(true);
    groups.eq(1).find('a').click();
    expect(groups.eq(0).isolateScope().isOpen).toBe(false);
    expect(groups.eq(1).isolateScope().isOpen).toBe(true);
  });
});

describe('field test', function() {
  var scope, element;
  beforeEach(module('ng-jacknife'));
  beforeEach(inject(function($rootScope, $compile,$httpBackend) {
    
  var template = 
  '<div class="control-group"'+ 
  ' ng-class="{'+
    '\'error\': form.{{$fieldId}}.$invalid && form.{{$fieldId}}.$dirty,'+
    '\'success\': form.{{$fieldId}}.$valid && form.{{$fieldId}}.$dirty}">' +
    '<label for="{{$fieldId}}">{{$fieldLabel}}</label>' +
    '<div class="controls">' +
    //'  <input type="email" id="email" name="email" ng-model="user.email" required>' +
    '<input>' +
    //'  <span ng-show="form.email.$error[\'required\'] && form.email.dirty" class="help-inline">Email is required</span>' +
    //'  <span ng-show="form.email.$error[\'email\'] && form.email.dirty" class="help-inline">Please enter a valid email</span>'
    '<span class="help-inline" ng-repeat="error in $fieldErrors">' +
    ' {{$validationMessages[error](this)}}' +
    '</span>' +
    '</div>' +
  '</div>';    

    $httpBackend.expectGET('input.html').respond(200, template);

    scope = $rootScope.$new();
    var tpl = 
    '<field type="email" ng-model="user.email" required>'+
      '<label>Email</label>'+
      '<validator key="required">{{$fieldLabel}} is required</validator>'+
      '<validator key="email">Please enter a valid email</validator>'+
    '</field>';
    element = $compile(tpl)(scope);
    $httpBackend.flush();

    scope.$digest();
    
  }));
  it('correct format', function() {
    var controls = element.find('.controls');
    console.log(element);
   });
});




