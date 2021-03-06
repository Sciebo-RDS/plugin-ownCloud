// inspired by https://github.com/PaulLereverend/NextcloudExtract/blob/master/js/extraction.js
(function (OC, window, $, undefined) {
  "use strict";

  OC.rds = OC.rds || {};

  var folderDict = {};

  OC.rds.FilePlugin = {

    /**
     * @param fileList
     */
    attach: function (fileList) {
      // add file actions in here using
      var mimes = ["httpd/unix-directory"];
      mimes.forEach((item) => {
        addFolderToResearch.init(item, fileList.fileActions);
      });
      pushFileToResearch.init("all", fileList.fileActions);

      var directories = new OC.rds.ResearchDirectories();
      var activate = true;
      directories
        .load()
        .fail(function () {
          console.log(
            "cannot find directories. Could be possible, that rds is not activated?"
          );
          activate = false;
        })
        .always(function () {
          if (activate) {
          }
        });

      // setup advanced filter
      fileList.fileActions.addAdvancedFilter(function (actions, context) {
        var fileName = context.$file.data("file");
        var mimetype = context.$file.data("mime");
        var dir = context.fileList.getCurrentDirectory();

        var found = false;
        var researchIndex = undefined;
        for (var key in directories.getFolders()) {
          var item = directories.getFolders()[key];

          // check if following is in folders:
          // - current directory (because then the files can be pushed separately)
          // - one of the files (can be pushed manually)
          // - edge case: filenames in root dir
          if (item === dir + "/" || item === dir + "/" + fileName + "/" || dir === "/" && item == "/" + fileName + "/") {
            found = true;
            researchIndex = key;
            folderDict[item] = researchIndex
          }
        };

        if (found) {
          if (mimetype === "httpd/unix-directory") {
            delete actions.addFolderToResearch;
          }
        } else {
          delete actions.pushFileToResearch;
        }

        return actions;
      });

    }
  };


  var addFolderToResearch = {
    init: function (mimetype, fileActions) {
      var self = this;
      fileActions.registerAction({
        name: "addFolderToResearch",
        displayName: t("upload_zenodo", "Add folder to RDS"),
        mime: mimetype,
        permissions: OC.PERMISSION_UPDATE,
        type: OCA.Files.FileActions.TYPE_DROPDOWN,
        iconClass: "icon-rds-research-small",
        actionHandler: function (filename, context) {
          var fileName = "";
          var mimetype = context.$file.data("mime");
          var dir = context.fileList.getCurrentDirectory();

          if (!dir.endsWith("/")) {
            dir += "/";
          }

          fileName = dir + filename;
          if (mimetype === "httpd/unix-directory") {
            fileName += "/"
          }

          window.location = OC.generateUrl("apps/rds/?createResearch&folder=" + fileName)
        },
      });
    },
  };

  var pushFileToResearch = {
    init: function (mimetype, fileActions) {
      var self = this;
      fileActions.registerAction({
        name: "pushFileToResearch",
        displayName: t("upload_zenodo", "Update RDS file"),
        mime: mimetype,
        permissions: OC.PERMISSION_UPDATE,
        type: OCA.Files.FileActions.TYPE_DROPDOWN,
        iconClass: "icon-rds-research-small",
        actionHandler: function (filename, context) {
          var fileName = "";
          var mimetype = context.$file.data("mime");
          var dir = context.fileList.getCurrentDirectory();

          if (!dir.endsWith("/")) {
            dir += "/";
          }

          fileName = dir + filename;
          if (mimetype === "httpd/unix-directory") {
            fileName += "/"
          }

          var data = {
            filename: fileName,
          };

          console.log(fileName, folderDict, folderDict[fileName])

          window.location = OC.generateUrl("apps/rds/?researchIndex=" + folderDict[fileName])

        },
      });
    },
  };

  var createRdsResearch = {
    attach: function (menu) {
      menu.addMenuEntry({
        id: "createRdsResearch",
        displayName: "RDS research project",
        templateName: "templateName.ext",
        iconClass: "icon-rds-research-small",
        fileType: "file",
        actionHandler: function () {
          console.log("go to rds and create a research project");
        },
      });
    },
  };

  OC.rds.ResearchDirectories = function () {
    this._folders = [];
  };

  OC.rds.ResearchDirectories.prototype = {
    getFolders: function () {
      return this._folders;
    },
    load: function () {
      var self = this;
      var deferred = $.Deferred();
      $.get(OC.generateUrl("/apps/rds/research/files"))
        .done(function (directories) {
          self._folders = directories;
          deferred.resolve();
        })
        .fail(function () {
          deferred.reject();
        });
      return deferred.promise();
    },
  };

  // plugins need to be registered right away
  OC.Plugins.register("OCA.Files.NewFileMenu", createRdsResearch);
  OC.Plugins.register('OCA.Files.FileList', OC.rds.FilePlugin);

})(OC, window, jQuery);
