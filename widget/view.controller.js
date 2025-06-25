/* 
  author: anonyges@gmail.com
  modified: 250625 
*/
"use strict";
(function () {
  angular
    .module("cybersponse")
    .controller("communityAnonygesWidgetUtilities100Ctrl", communityAnonygesWidgetUtilities100Ctrl);

  communityAnonygesWidgetUtilities100Ctrl.$inject = ["$scope", "config"];

  function communityAnonygesWidgetUtilities100Ctrl($scope, config) {
    $scope.config = config;
    console.debug("loaded community_anonyges_widget_utilities version 1.0.0", $scope);
  }
})();
