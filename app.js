/// <reference path="typings/underscore/underscore.d.ts"/>
/// <reference path="typings/jquery/jquery.d.ts"/>
/* global chrome */
/// <reference path="typings/angularjs/angular.d.ts"/>

//(function(){

  var runApp = function(){
    
    angular
    .module('railTask', [], function($provide) {
        // Prevent Angular from sniffing for the history API
        // since it's not supported in packaged apps.
        $provide.decorator('$window', function($delegate) {
            $delegate.history = null;
            return $delegate;
        });
    })
    .directive('focusMe', function ($timeout) {
      return {
          restrict: 'A',
          link: {
              post: function postLink(scope, element, attrs) {
                  scope.$watch(attrs.focusMe, function (value) {

                      if (attrs.focusMe) {
                          if (scope.$eval(attrs.focusMe)) {
                              $timeout(function () {
                                  element[0].focus();
                              }, 100); //need some delay to work with ng-disabled
                          }
                      }
                  });
              }
          }
      };
    })
    .controller('MainCtrl', ['$scope',function($scope){
       
        $scope.projectList = [];
        $scope.appName = "hello";
        $scope.selectedProject = false;

        var resetForm = function(){
          $scope.newProjectName = "";
          $scope.showForm = false;
        };
        resetForm();

        $scope.addProject = function(){
          var proj = new Project();
          proj.name = $scope.newProjectName;
          var obj = {};
          obj[proj.guid] = proj;
          chrome.storage.sync.set(obj);
          $scope.projectList.push(proj);
        };
        $scope.checkkey = function(e){
          if(e.keyCode == 13){
            $scope.addProject();
            e.target.blur();
            resetForm();
          }
        };
        var setCounts = function(proj){
          proj.moneyCount = $scope.getMoneyCount(proj);
          proj.todayCount = $scope.getTodayCount(proj);
          proj.openCount = $scope.getOpenCount(proj);           
        }
        
        $scope.updateCounts = function(){
          if($scope.selectedProject){
            setCounts($scope.selectedProject);
          }
        };
        $scope.getOpenCount = function(proj){
          return myHelpers.array.filterByProps(proj.taskList,{
            done: false
          }).length;
        };
        $scope.getMoneyCount = function(proj){
          return myHelpers.array.filterByProps(proj.taskList,{
            money: true, done: false
          }).length;
        };
        $scope.getTodayCount = function(proj){
          return myHelpers.array.filterByProps(proj.taskList,{
            today: true, done: false
          }).length;
        }
        $scope.showProjectDetails = function(proj){
          $scope.selectedProject = proj;
        };
        $scope.$watch('showForm',function(){
          if(!$scope.showForm){
            resetForm();
          }
        });
        chrome.storage.sync.get(function(items){
          $.each(items,function(guid,item){
            setCounts(item);
            $scope.projectList.push(item); 
          });          
          if($scope.projectList.length){
            $scope.selectedProject = $scope.projectList[0]; 
            $scope.$apply(); 
          }
        });
    }])
    .controller('ProjectCtrl',['$scope',function($scope){      
      
      $scope.selectedTask = false;
      $scope.selectedTaskCached = false;
      $scope.doneClick = function(task){
        task.done = !task.done;
        $scope.updateCounts();
      }
      $scope.delete = function(e){
         if(!$scope.selectedTask) return;
         myHelpers.ui.confirm($(e.target),"delete?",function(){
             myHelpers.array.removeItemByGUID($scope.selectedProject.taskList,$scope.selectedTask.guid);         
             updateProject($scope.selectedProject, function(){
              $scope.selectedTaskCached = false;      
              $scope.selectedTask = false; $scope.$apply();          
            });  
         },function(){});         
      }
      $scope.save = function(){
        if(!$scope.selectedTask) return;
        var task = angular.copy($scope.selectedTask);
        var match = myHelpers.array.propMatch($scope.selectedProject.taskList,"guid",task.guid); 
        if(match){
          angular.extend(match,task);
          console.log(match);
        }else{
          $scope.selectedProject.taskList.push(task);
        }
        updateProject($scope.selectedProject, function(){
           if($scope.selectedTaskCached){
            angular.extend($scope.selectedTaskCached, task);  
          }    
          $scope.selectedTaskCached = false;      
          $scope.selectedTask = false; 
          $scope.updateCounts();
          $scope.$apply();          
        });
        
      };
      $scope.cancel = function(){
        $scope.selectedTask = false;
      }
      $scope.addTask = function(){
        $scope.selectedTask = new Task(); 
      }
      $scope.showTaskDetails = function(task){
        $scope.selectedTaskCached = task;
        $scope.selectedTask = angular.copy(task);
      };
      
      $scope.checkkey = function(e){
          if(e.keyCode == 13){
            
            e.target.blur();
            updateProject($scope.selectedProject, function(){
                    
            });
            $scope.titleEditing = false;
          }
      };
     
      $scope.$watch('selectedProject',function(){ 
        $scope.selectedTask = false;     
      });
      console.log($scope);
    }]);
    
  }

  Array.prototype.remove = function (item) {
      var index = this.indexOf(item);
      if (index >= 0) { this.splice(index, 1); return true; }
      return false;
  };
  var newGUID = function(){
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  };
  var myHelpers = {
    ui: {
      confirm: function(target,message, yes,no){
        
        var mb = $("#confirm").find(".message-box");
        var mbw = mb.outerWidth();
        var tp = target.position();
        var th = target.outerHeight();
        var tw = target.outerWidth();
        
        mb.css({ top: (tp.top + th + 15) + "px", left: ((tp.left + (tw/2)) - (41)) + "px" });
                
        $('#confirm').find(".text-holder").text(message);
        $('#confirm').find(".yes").unbind().bind('click',function(){
          $('#confirm').hide(); yes();
        });
        $('#confirm').find(".no").unbind().bind('click',function(){
          $('#confirm').hide(); no();
        });
        $('#confirm').show();
      }
    },
    array: {
      // return first object in array with matching key:val
      propMatch: function(array,keyName,valueMatch,getIndexInstead){
        var match = false;
        var idx;
        array.forEach(function(obj,index){
          if(obj[keyName] && obj[keyName] === valueMatch){
            match = obj; 
            idx = index;
            return;
          }
        });
        return (getIndexInstead)?idx:match;
      },
      // returns array of matches given in keyValueObj
      filterByProps: function(array,keyValueObj,matchAny){
        var matches = [];
        array.forEach(function(obj,index){
          var matchCount = 0;
          var keyCount = 0;
          $.each(keyValueObj, function(key,value){
            keyCount++;
            if(obj[key] === value){
              matchCount++;           
            }
          });
          if((matchAny && matchCount) || matchCount == keyCount){
            matches.push(obj);
          }        
        });
        return matches;
      },
      removeItemByGUID: function(array,guid){
        var index = myHelpers.array.propMatch(array,"guid",guid, true);
        if(index != undefined){
          array.splice(index, 1);
        }
      }
    }
  };
  
  var updateProject = function(scopedProject, callback){
    var projObj = {};
    projObj[scopedProject.guid] = angular.copy(scopedProject);
    chrome.storage.sync.set(projObj,callback);
  }
  
  var Project = function(){
    this.guid = newGUID();
    this.name = "";
    this.taskList = [];  
  };
  var Task = function(){
    this.guid = newGUID();
    this.name = "";
    this.description = "";  
    this.createdDate = (function(){
      var d = new Date();
      return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
    })();
    this.cancelled = false;
    this.done = false;
    this.today = false;
    this.money = false;
  };


  runApp();

//})();



  //console.log("app loaded");

  /*var output = document.getElementById('output');
  var input = document.getElementById('myValue');
  var form = document.querySelector('form');
  var logarea = document.querySelector('textarea');

  function log(str) {
    logarea.value=str+"\n"+logarea.value;
  }

  form.addEventListener('submit', function(ev) {
    var newValue=input.value;
    chrome.storage.sync.set({"myValue": newValue}, function() {
      log("setting myValue to "+newValue);
    });
    ev.preventDefault();
  });

  function valueChanged(newValue) {
    output.innerText = newValue;
    output.className="changed";
    window.setTimeout(function() {output.className="";}, 200);
    log("value myValue changed to "+newValue);
  }

  // For debugging purposes:
  function debugChanges(changes, namespace) {
    for (key in changes) {
      console.log('Storage change: key='+key+' value='+JSON.stringify(changes[key]));
    }
  }

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes["myValue"]) {
      valueChanged(changes["myValue"].newValue);
    }
    debugChanges(changes, namespace);
  });

  chrome.storage.sync.get("myValue", function(val) {valueChanged(val.myValue)});*/


