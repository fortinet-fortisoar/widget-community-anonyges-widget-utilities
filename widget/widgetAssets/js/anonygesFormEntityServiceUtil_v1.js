/* 
  author: anonyges@gmail.com
  modified: 250102 
*/
'use strict';

(function () {
  angular
    .module('cybersponse')
    .factory('anonygesFormEntityServiceUtil_v1', anonygesFormEntityServiceUtil_v1);

  anonygesFormEntityServiceUtil_v1.$inject = ['$resource', 'websocketService', 'Field', 'FormEntityService', 'Entity', '$http', 'anonygesJSUtil_v1'];

  function anonygesFormEntityServiceUtil_v1($resource, websocketService, Field, FormEntityService, Entity, $http, anonygesJSUtil_v1) {

    function init(_parent_scope, _config, _form, _field_check_interval_milisec) {
      // -------------------------------------------------------- initial factory start --------------------------------------------------------
      const scope = _parent_scope.$new(true);
      scope.config = anonygesJSUtil_v1.default_value_as_object(_config);
      const form_name = _form;

      const form_entity = FormEntityService.get();
      const field_check_interval_milisec = anonygesJSUtil_v1.default_value_if_undefined(_field_check_interval_milisec, 2000);


      scope.manual_field_override = {};
      scope.data_cs_conditional_module_field = anonygesJSUtil_v1.default_value_as_object(scope.data_cs_conditional_module_field);
      scope.option_module_field_names = anonygesJSUtil_v1.default_value_if_undefined(scope.option_module_field_names, []);

      scope.config.data_cs_conditional_module_field = anonygesJSUtil_v1.default_value_as_object(scope.config.data_cs_conditional_module_field);
      scope.config.selected_module_field_names = anonygesJSUtil_v1.default_value_if_undefined(scope.config.selected_module_field_names, []);


      scope.$on("a_field_override_value", function (event, data) {
        console.debug(`d_field_override_value called from ${scope.$id}`, scope.config.selected_module_field_names, data);

        scope.manual_field_override[data.field_name] = anonygesJSUtil_v1.default_value_as_object(scope.manual_field_override[data.field_name]);
        scope.manual_field_override[data.field_name] = Object.assign({}, scope.manual_field_override[data.field_name], data.records);

        if (scope.config.selected_module_field_names.includes(data.field_name)) {
          scope.$emit("a_field_updated", { "field_name": data.field_name });
        }
      });


      scope.$on("field:updated", function (event, field_names) {
        console.debug(`field:updated called from ${scope.$id}`, scope.config.selected_module_field_names, field_names);

        for (const _field_name of field_names) {
          if (scope.config.selected_module_field_names.includes(_field_name)) {
            scope.$emit("a_field_updated", { "field_name": _field_name });
          }
        }
      });


      scope.$on("websocket:reconnect", function () {
        console.debug(`websocket:reconnect called from ${scope.$id}`);
        field_update_websocket_resubscribe();
      });


      scope.$on("$destroy", function () {
        console.debug(`\$destroy called from ${scope.$id}`);
        field_update_websocket_unsubscribe();
      });
      // -------------------------------------------------------- initial factory end --------------------------------------------------------



      // -------------------------------------------------------- tracking changed fields start  --------------------------------------------------------
      let field_update_websocket_subscriptions = [];
      let field_names_to_refresh = [];


      function fields_refresh_request_to_server(field_name) {
        if (
          scope.config.selected_module_field_names.includes(field_name) &&
          ["manyToMany", "oneToMany", "manyToOne", "lookup"].includes(form_entity.fields[field_name].type) &&
          Object.keys(scope.data_cs_conditional_module_field).includes(field_name) &&
          Object.keys(scope.data_cs_conditional_module_field[field_name]).length !== 0
        ) {
          if (!field_names_to_refresh.includes(field_name)) {
            field_names_to_refresh.push(field_name);
            _fields_refresh_request_to_server();
          }
          else {
            // already calling the field_names_to_refresh
          }
        }
      }


      function _fields_refresh_request_to_server() {
        if (form_entity !== undefined) {
          for (const _field_name of field_names_to_refresh) {
            if (
              Object.keys(scope.data_cs_conditional_module_field).includes(_field_name) &&
              Object.keys(scope.data_cs_conditional_module_field[_field_name]).length !== 0
            ) {
              let search_filter = {};
              delete scope.data_cs_conditional_module_field[_field_name].model.sort;
              delete scope.data_cs_conditional_module_field[_field_name].model.limit;

              if (scope.data_cs_conditional_module_field[_field_name].get_only_linked) {
                search_filter = {
                  "logic": "AND",
                  "filters": [
                    {
                      "field": `${form_entity.module}.uuid`,
                      "operator": "eq",
                      "value": form_entity.id
                    },
                    scope.data_cs_conditional_module_field[_field_name].model
                  ]
                };
              }
              else {
                search_filter = scope.data_cs_conditional_module_field[_field_name].model;
              }

              if (scope.data_cs_conditional_module_field[_field_name].selectFields.length > 0) {
                search_filter["__selectFields"] = scope.data_cs_conditional_module_field[_field_name].selectFields.map(obj => obj["name"]);
              }
              if (scope.data_cs_conditional_module_field[_field_name].sort.length > 0) {
                search_filter["sort"] = scope.data_cs_conditional_module_field[_field_name].sort;
              }

              $resource("/api/query/" + _field_name)
                .save(search_filter)
                .$promise
                .then(function (_response) {
                  scope.$emit(
                    "a_field_override_value",
                    {
                      field_name: _field_name,
                      records: _response["hydra:member"]
                    }
                  );
                })
                .catch(function (_error) {
                  console.error(_error);
                });
            }
            else {
              console.error(`not in value: ${_field_name}`, scope.data_cs_conditional_module_field);
            }
          }
          field_names_to_refresh = [];
        }
      }


      // getting the updated fields by websocket
      function field_update_websocket_unsubscribe() {
        for (const _idx in field_update_websocket_subscriptions) {
          field_update_websocket_subscriptions[_idx].unsubscribe();
        }
        field_update_websocket_subscriptions = [];
      }


      function field_update_websocket_resubscribe() {
        field_update_websocket_unsubscribe();

        if (form_entity !== undefined) {
          websocketService.subscribe(form_entity.module + "/" + form_entity.id, function (data) {
            console.debug("module websocket: ", data);
            if (data.changeData && data.entityUuid.includes(form_entity.originalData["@id"])) { // or change this to form_entity.id
              for (const _field_name of data.changeData) {
                fields_refresh_request_to_server(_field_name);
              }
            }
          }).then(function (data) {
            field_update_websocket_subscriptions.push(data);
          });

          for (const _field_name of scope.config.selected_module_field_names) {
            if (["manyToMany", "oneToMany", "manyToOne", "lookup"].includes(form_entity.fields[_field_name].type)) {
              websocketService.subscribe(form_entity.module + "/" + form_entity.id + "/" + _field_name, function (data) {
                console.debug("relation websocket: ", data);
                if (data.changeData && data.entityUuid.includes(form_entity.originalData["@id"])) { // or change this to form_entity.id
                  for (const _field_name of data.changeData) {
                    fields_refresh_request_to_server(_field_name);
                  }
                }
              }).then(function (data) {
                field_update_websocket_subscriptions.push(data);
              });
            }
          }
        }
      }
      // -------------------------------------------------------- tracking changed values end --------------------------------------------------------



      // -------------------------------------------------------- UI start  --------------------------------------------------------
      function refresh_module_fields() {
        if (form_entity !== undefined) {
          const entity = new Entity(form_entity.module);

          entity.loadFields().then(function () {
            for (const _field_name in entity.fields) {
              const module_field = entity.fields[_field_name];
              if (!scope.config.selected_module_field_names.includes(module_field.name)) {
                scope.option_module_field_names.push(module_field.name);
              }
            }
          });
        }
        else {
          // DEBUG START
          scope.debug_entity = new Entity("alerts");
          scope.debug_entity.loadFields().then(function () {
            for (const _field_name in scope.debug_entity.fields) {
              const module_field = scope.debug_entity.fields[_field_name];
              if (!scope.config.selected_module_field_names.includes(module_field.name)) {
                scope.option_module_field_names.push(module_field.name);
              }
            }
          });
          // DEBUG END
        }
      }


      function check_module_field_to_watch(_field_name) {
        if (form_entity !== undefined) {
          if (["manyToMany", "oneToMany", "manyToOne", "lookup"].includes(form_entity.fields[_field_name].type))
            return true;
          return false;
        }
        else {
          // DEBUG START
          if (["manyToMany", "oneToMany", "manyToOne", "lookup"].includes(scope.debug_entity.fields[_field_name].type))
            return true;
          return false;
          // DEBUG END
        }
      }


      function bt_add_module_field_to_watch(_field_name) {
        scope.config.selected_module_field_names.push(_field_name);
        scope.option_module_field_names.splice(scope.option_module_field_names.indexOf(_field_name), 1);
        scope.$emit("a_add_module_field_to_watch", { "field_name": _field_name });
      }


      function bt_remove_module_field_to_watch(_field_name) {
        if (scope.edit_module_field_to_watch_ng_show && _field_name === scope.data_cs_conditional_selected_module_field_name) {
          scope.edit_module_field_to_watch_ng_show = false;
        }
        scope.option_module_field_names.push(_field_name);
        scope.config.selected_module_field_names.splice(scope.config.selected_module_field_names.indexOf(_field_name), 1);
        scope.$emit("a_remove_module_field_to_watch", { "field_name": _field_name });
      }


      function bt_edit_module_field_to_watch(_field_name) {
        const entity = new Entity(_field_name);
        entity.loadFields().then(function () {
          scope.data_cs_conditional_selected_module_field_name = _field_name;
          scope.data_cs_conditional_selected_module_field = {};
          scope.config.data_cs_conditional_module_field[_field_name] = anonygesJSUtil_v1.default_value_as_object(scope.config.data_cs_conditional_module_field[_field_name]);

          scope.data_cs_conditional_selected_module_field.model = anonygesJSUtil_v1.default_value_as_object(scope.config.data_cs_conditional_module_field[_field_name].model);
          scope.data_cs_field_selected_module_get_only_linked_model = anonygesJSUtil_v1.default_value_if_undefined(scope.config.data_cs_conditional_module_field[_field_name].get_only_linked, true);
          scope.data_cs_field_selected_module_limit_model = anonygesJSUtil_v1.default_value_if_undefined(scope.config.data_cs_conditional_module_field[_field_name].limit, 30);
          scope.data_cs_field_selected_module_selectFields_model = anonygesJSUtil_v1.default_value_if_undefined(scope.config.data_cs_conditional_module_field[_field_name].selectFields, []);
          scope.data_cs_field_selected_module_selectFields_show = scope.data_cs_field_selected_module_selectFields_model.length > 0 ? true : false;
          scope.data_cs_field_selected_module_sort_model = anonygesJSUtil_v1.default_value_as_object(scope.config.data_cs_conditional_module_field[_field_name].sort);

          scope.data_cs_conditional_selected_module_field.fields = entity.getFormFields();
          scope.data_cs_conditional_selected_module_field.fieldsArray = entity.getFormFieldsArray();
          scope.data_cs_conditional_selected_module_field.fieldsArray_limitOutput = scope.data_cs_conditional_selected_module_field.fieldsArray.map(obj => {
            const newObj = {};
            ["name", "title"].forEach(key => {
              if (obj.hasOwnProperty(key)) {
                newObj[key] = obj[key];
              }
            });
            return newObj;
          });
          scope.data_cs_conditional_selected_module_field.reset_field = entity.getFormFields();
          scope.edit_module_field_to_watch_ng_show = true;
        });
      }


      scope.data_cs_field_selected_module_get_only_linked = new Field({
        "formType": "checkbox",
        "writeable": true,
        "validation": {
          "required": false
        }
      });


      scope.data_cs_field_selected_module_limit = new Field({
        "formType": "integer",
        "writeable": true,
        "validation": {
          "required": false
        }
      });


      scope.data_cs_field_selected_module_selectFields = new Field({
        "formType": "tags",
        "writeable": true,
        "validation": {
          "required": false
        }
      });


      function auto_complete_data_cs_field_selected_module_selectFields(query) {
        const key = "title";
        return scope.data_cs_conditional_selected_module_field.fieldsArray_limitOutput.filter(obj => obj[key].toLowerCase().includes(query.toLowerCase()));
      }


      function update_data_cs_field_selected_module_selectFields_model() {
        const key = "title";
        return scope.data_cs_field_selected_module_selectFields_model.sort((a, b) => {
          if (a[key] < b[key]) {
            return -1;
          }
          if (a[key] > b[key]) {
            return 1;
          }
          return 0;
        });
      }


      function data_cs_conditional_selected_module_field_model_save() {
        if (_parent_scope[form_name].$invalid) {
          _parent_scope[form_name].$setTouched();
          _parent_scope[form_name].$focusOnFirstError();
          return;
        }

        scope.config.data_cs_conditional_module_field[scope.data_cs_conditional_selected_module_field_name].get_only_linked = scope.data_cs_field_selected_module_get_only_linked_model
        scope.config.data_cs_conditional_module_field[scope.data_cs_conditional_selected_module_field_name].limit = scope.data_cs_field_selected_module_limit_model
        scope.config.data_cs_conditional_module_field[scope.data_cs_conditional_selected_module_field_name].selectFields = scope.data_cs_field_selected_module_selectFields_model
        scope.config.data_cs_conditional_module_field[scope.data_cs_conditional_selected_module_field_name].model = scope.data_cs_conditional_selected_module_field.model;
        scope.config.data_cs_conditional_module_field[scope.data_cs_conditional_selected_module_field_name].sort = scope.data_cs_field_selected_module_sort_model;

        scope.edit_module_field_to_watch_ng_show = false;
        scope.edit_module_field_to_watch_ng_show_error = false;
      }


      function data_cs_conditional_selected_module_field_model_discard() {
        scope.edit_module_field_to_watch_ng_show = false;
        scope.edit_module_field_to_watch_ng_show_error = false;
      }
      // -------------------------------------------------------- UI end  --------------------------------------------------------



      // -------------------------------------------------------- other useful function start  --------------------------------------------------------
      function get_field(field_name) {
        if (scope.config.selected_module_field_names.includes(field_name)) {
          if (scope.manual_field_override.hasOwnProperty(field_name)) {
            return scope.manual_field_override[data.field_name]
          }
          return form_entity["fields"][field_name];
        }
        return null;
      }


      function update_field(field_name, field_data) {
        const payload = {};
        payload[field_name] = field_data;
        $http.put(form_entity["originalData"]["@id"], payload)
          .then(function (_response) {
            form_entity["fields"][field_name]["value"] = field_data;
          })
          .catch(function (_error) {
            console.error(_error);
          });
      }
      // -------------------------------------------------------- other useful function end  --------------------------------------------------------



      // -------------------------------------------------------- connection update start  --------------------------------------------------------
      field_update_websocket_resubscribe();
      refresh_module_fields();
      // -------------------------------------------------------- connection update end  --------------------------------------------------------



      const service = {
        scope: scope,
        form_entity: form_entity,

        fields_refresh_request_to_server: fields_refresh_request_to_server,
        field_update_websocket_unsubscribe: field_update_websocket_unsubscribe,
        field_update_websocket_resubscribe: field_update_websocket_resubscribe,

        refresh_module_fields: refresh_module_fields,
        check_module_field_to_watch: check_module_field_to_watch,
        bt_add_module_field_to_watch: bt_add_module_field_to_watch,
        bt_remove_module_field_to_watch: bt_remove_module_field_to_watch,
        bt_edit_module_field_to_watch: bt_edit_module_field_to_watch,

        auto_complete_data_cs_field_selected_module_selectFields: auto_complete_data_cs_field_selected_module_selectFields,
        update_data_cs_field_selected_module_selectFields_model: update_data_cs_field_selected_module_selectFields_model,
        data_cs_conditional_selected_module_field_model_save: data_cs_conditional_selected_module_field_model_save,
        data_cs_conditional_selected_module_field_model_discard: data_cs_conditional_selected_module_field_model_discard,

        get_field: get_field,
        update_field: update_field
      };

      return service;
    }

    return {
      init: function (_parent_scope, _config, _form_name, _field_check_interval_milisec) {
        return new init(_parent_scope, _config, _form_name, _field_check_interval_milisec);
      }
    }
  }
})();
