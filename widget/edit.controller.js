/* 
  author: anonyges@gmail.com
  modified: 250625 
*/
"use strict";
(function () {
  angular
    .module("cybersponse")
    .controller("editCommunityAnonygesWidgetUtilities100Ctrl", editCommunityAnonygesWidgetUtilities100Ctrl);

  editCommunityAnonygesWidgetUtilities100Ctrl.$inject = ["$scope", "$uibModalInstance", "config", "Field", "anonygesJSUtil_v1", "anonygesPlaybookUtil_v1", "anonygesFormEntityServiceUtil_v1", "anonygesAuditlogUtil_v1"];

  function editCommunityAnonygesWidgetUtilities100Ctrl($scope, $uibModalInstance, config, Field, anonygesJSUtil_v1, anonygesPlaybookUtil_v1, anonygesFormEntityServiceUtil_v1, anonygesAuditlogUtil_v1) {
    $scope.config = config;
    $scope.container_uid = "ap-" + crypto.randomUUID();



    // -------------------------------------------------------- Title Start  --------------------------------------------------------
    $scope.config.title = anonygesJSUtil_v1.default_value_if_undefined($scope.config.title, "");
    $scope.data_cs_title = new Field({
      "name": "data_cs_title",
      "formType": "text",
      "title": "Title",
      "writeable": true,
      "validation": {
        "required": false
      }
    });
    $scope.config.title_show = anonygesJSUtil_v1.default_value_if_undefined($scope.config.title_show, false);
    // -------------------------------------------------------- Title End  --------------------------------------------------------



    // -------------------------------------------------------- Playbook Util Start  --------------------------------------------------------
    $scope.config.dp_playbook_1 = anonygesJSUtil_v1.default_value_as_object($scope.config.dp_playbook_1);
    $scope.dp_playbook_1 = anonygesPlaybookUtil_v1.init($scope, $scope.config.dp_playbook_1);


    $scope.$watch("dp_playbook_1.scope.config.data_cs_selected_playbook", function (newValue, oldValue) {
      if (newValue !== undefined && newValue !== null) {
        $scope.$broadcast("a_playbook_status", { "status": "active", "workflow_id": true })
        $scope.dp_playbook_1.execute_playbook(newValue);
      }
    });


    $scope.dp_playbook_1.scope.$on("a_playbook_status", function (event, json_data) {
      console.debug("a_playbook_status", json_data);

      const playbook_status = json_data.status;
      const response = json_data.response;

      if (playbook_status === "finished" && response["@type"] === "Workflow") {
        $scope.dp_playbook_1.scope.data_cs_playbook_result_model = response;
      }
      else {
        $scope.dp_playbook_1.scope.data_cs_playbook_result_model = { "status": playbook_status };
      }

      delete $scope.dp_playbook_1.scope.data_cs_playbook_result;
      $scope.dp_playbook_1.scope.data_cs_playbook_result = new Field({
        "formType": "json",
        "writeable": false,
        "validation": {
          "required": true
        }
      });
    });
    // -------------------------------------------------------- Playbook Util End  --------------------------------------------------------



    // -------------------------------------------------------- FormEntityService Util start  --------------------------------------------------------
    $scope.config.dp_formentityservice_1 = anonygesJSUtil_v1.default_value_as_object($scope.config.dp_formentityservice_1);
    $scope.dp_formentityservice_1 = anonygesFormEntityServiceUtil_v1.init($scope, $scope.config.dp_formentityservice_1, "form_dp_formentityservice_1");


    // $scope.dp_formentityservice_1.scope.$on("d_field_updated", function (event, json_data) {
    //   console.debug("d_field_updated", json_data);
    // });
    // -------------------------------------------------------- FormEntityService Util end  --------------------------------------------------------



    // -------------------------------------------------------- Auditlog Util start  --------------------------------------------------------
    $scope.config.dp_auditlog_1 = anonygesJSUtil_v1.default_value_as_object($scope.config.dp_auditlog_1);
    $scope.dp_auditlog_1 = anonygesAuditlogUtil_v1.init($scope, $scope.config.dp_auditlog_1, "form_dp_auditlog_1");
    // -------------------------------------------------------- Auditlog Util end  --------------------------------------------------------



    // -------------------------------------------------------- Common start  --------------------------------------------------------
    $scope.$on("$destroy", function () {
      $scope.$broadcast("$destory");
    });
    // -------------------------------------------------------- Common end  --------------------------------------------------------



    // -------------------------------------------------------- UI start  --------------------------------------------------------
    $scope.bt_cancel = bt_cancel;
    $scope.bt_save = bt_save;


    function bt_cancel() {
      $uibModalInstance.dismiss("cancel");
    }


    function bt_save() {
      if ($scope.editWidgetForm.$invalid) {
        $scope.editWidgetForm.$setTouched();
        $scope.editWidgetForm.$focusOnFirstError();
        return;
      }
      $uibModalInstance.close($scope.config);
    }
    // -------------------------------------------------------- UI end  --------------------------------------------------------
  }
})();
