/* 
  author: anonyges@gmail.com
  modified: 250102 
*/
'use strict';

(function () {
    angular
        .module('cybersponse')
        .factory('anonygesJSUtil_v1', anonygesJSUtil_v1);

    anonygesJSUtil_v1.$inject = ['$http', '$resource', 'API'];

    function anonygesJSUtil_v1($http, $resource, API) {

        const service = {
            jinja: jinja,
            getMonacoEditorSettings: getMonacoEditorSettings,
            is_uuid4: is_uuid4,
            is_json_string: is_json_string,
            default_value_if_undefined: default_value_if_undefined,
            default_value_as_object: default_value_as_object,
            waitForElementAndExecuteFunction: waitForElementAndExecuteFunction
        };


        function jinja(template, value) {
            // template: string = "{{vars.input}}"
            // value: object = obj

            if (typeof (template) == "object")
                template = JSON.stringify(template)
            // typecast template to string if received as object

            if (typeof (value) == "string")
                value = JSON.parse(value);
            // typecast value to object if received as string

            return $resource(API.WORKFLOW + "api/jinja-editor/?format=json")
                .save({ "template": template, "values": value })
                .$promise
        }


        function getMonacoEditorSettings() {
            // output from /app/components/codeEditor/monacoEditorSettings.json
            return {
                "editorTheme": {
                    "dark": "vs-dark",
                    "steel": "vs-dark",
                    "light": "vs"
                },
                "editorMode": {
                    "js": {
                        "language": "javascript"
                    },
                    "html": {
                        "language": "html"
                    },
                    "json": {
                        "language": "json"
                    },
                    "css": {
                        "language": "css"
                    },
                    "python": {
                        "language": "python"
                    },
                    "py": {
                        "language": "python"
                    },
                    "text": {
                        "language": "plaintext"
                    },
                    "image": {
                        "language": "html"
                    },
                    "markdown": {
                        "language": "plaintext"
                    }
                },
                "editorSettings": {
                    "automaticLayout": true,
                    "lineNumbers": "on",
                    "roundedSelection": false,
                    "scrollBeyondLastLine": false,
                    "readOnly": false
                },
                "menuImages": {
                    "folder": "fa fa-folder",
                    "html": "fa fa-html5",
                    "js": "fa fa-code",
                    "json": "icon icon-json-file",
                    "image": "fa fa-picture-o",
                    "css": "icon icon-css",
                    "python": "icon icon-python",
                    "text": "icon icon-txt"
                }
            }
        }


        function is_uuid4(check_string) {
            return check_string.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        }


        function is_json_string(check_string) {
            try {
                if (typeof (check_string) == "string" && check_string != "") {
                    const _ = JSON.parse(check_string);
                    return true;
                }
                    
            } catch (_error) {
                console.error(_error);
            }
            return false;
        }

        function default_value_if_undefined(value, default_value) {
            if (value === undefined)
                return default_value;
            return value;
        }


        function default_value_as_object(value) {
            if (!value)
                return Object();
            if (Array.isArray(value))
                return Object();
            return value;
        }


        function waitForElementAndExecuteFunction(elementId, callback, ...params) {
            const element = document.getElementById(elementId);

            if (element) {
                callback(...params);
            } else {
                setTimeout(() => {
                    waitForElementAndExecuteFunction(elementId, callback);
                }, 500);
            }
        }


        return service;
    }
})();
