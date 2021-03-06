(function (OC, window, $, undefined) {
  "use strict";

  OC.rds = OC.rds || {};


  OC.rds.AbstractTemplate = function (divName, view) {
    this._divName = divName;
    this._view = view;

    if (this.constructor === OC.rds.AbstractTemplate) {
      throw new Error("Cannot instanciate abstract class");
    }
  };

  OC.rds.AbstractTemplate.prototype = {
    // this methods needs to be implemented in your inherited classes
    // returns a dict
    _getParams: function () {
      throw new Error("You have to implement the method _getParams!");
    },
    // returns a jquery Differed object
    _saveFn: function () {
      throw new Error("You have to implement the method _saveFn!");
    },
    // returns nothing
    _beforeTemplateRenders: function () {
      throw new Error(
        "You have to implement the method _beforeTemplateRenders!"
      );
    },
    // returns nothing
    _afterTemplateRenders: function () {
      throw new Error(
        "You have to implement the method _afterTemplateRenders!"
      );
    },

    _loadTemplate: function () {
      var source = $(this._divName).html();
      var template = Handlebars.compile(source);
      var html = template(this._getParams());

      $("#app-content-wrapper").html(html);
    },

    render: function () {
      this._beforeTemplateRenders();
      this._loadTemplate();
      this._afterTemplateRenders();
    },

    save: function () {
      return this._saveFn()
        .fail(function () {
          OC.dialogs.alert(
            t("rds", "Your entries could not be saved."),
            t("rds", "RDS Update project")
          );
        });
    },

    save_next: function () {
      var self = this;

      return this.save().done(function () {
        self._view.render();
      });
    },
  };

  OC.rds.OverviewTemplate = function (divName, view, services, studies) {
    OC.rds.AbstractTemplate.call(this, divName, view);

    this._services = services;
    this._studies = studies;
  };

  OC.rds.OverviewTemplate.prototype = Object.create(
    OC.rds.AbstractTemplate.prototype,
    {
      constructor: OC.rds.OverviewTemplate,
    }
  );

  OC.rds.OverviewTemplate.prototype._getParams = function () {
    return {
      studies: this._studies.getAll(),
      services: this._services.getAll(),
    };
  };
  OC.rds.OverviewTemplate.prototype._beforeTemplateRenders = function () { };
  OC.rds.OverviewTemplate.prototype._afterTemplateRenders = function () { };
  OC.rds.OverviewTemplate.prototype._saveFn = function () {
    $.when();
  };

  OC.rds.WorkflowTemplate = function (divName, view, services, studies) {
    OC.rds.AbstractTemplate.call(this, divName, view);

    this._services = services;
    this._studies = studies;
  };

  OC.rds.WorkflowTemplate.prototype = Object.create(
    OC.rds.AbstractTemplate.prototype,
    {
      constructor: OC.rds.WorkflowTemplate,
    }
  );
  OC.rds.WorkflowTemplate.prototype._getParams = function () {
    var self = this;

    var patchServices = function (services, research) {
      var newServices = JSON.parse(JSON.stringify(services));

      function findPort(portName, portList) {
        var searchName = portName;

        if (!searchName.startsWith("port-")) {
          searchName = "port-" + searchName.toLowerCase();
        }

        var port = {};
        portList.forEach(function (elem) {
          if (elem.port === searchName) {
            this.port = elem;
          }
        }, port);
        return port.port;
      }

      newServices.forEach(function (service, indexSvc) {
        function patchProperty(prop) {
          if (prop.portType === "metadata" && prop.value === true) {
            this[indexSvc].metadataChecked = "checked";
          }
          if (prop.portType === "fileStorage" && prop.value === true) {
            this[indexSvc].fileStorageChecked = "checked";
          }

          if (prop.portType === "customProperties") {
            prop.value.forEach(function (val) {
              if (val.key === "projectId") {
                this[indexSvc].projectId = val.value.toString();
              }
              if (val.key === "filepath") {
                this[indexSvc].filepath = val.value;
              }
            }, this);
          }
        }

        var port = findPort(service.servicename, research.portIn);
        if (port !== undefined) {
          port.properties.forEach(patchProperty, this);
        }
        port = findPort(service.servicename, research.portOut);
        if (port !== undefined) {
          port.properties.forEach(patchProperty, this);
        }
      }, newServices);

      return newServices;
    };

    var studies = this._studies.getActive();
    var services;

    if (studies === undefined) {
      services = [];
    } else {
      services = patchServices(this._services.getAll(), studies);

      var newServicesList = [];
      var filepath = undefined;
      for (let index = 0; index < services.length; index++) {
        const element = services[index];
        if (element.servicename !== "Owncloud") {
          newServicesList.push(element)
        } else {
          if (element.filepath !== undefined) {
            filepath = element.filepath
          }
        }
      }
    }

    return {
      research: studies,
      services: newServicesList,
      filepath: filepath
    };
  };
  OC.rds.WorkflowTemplate.prototype._beforeTemplateRenders = function () { };
  OC.rds.WorkflowTemplate.prototype._afterTemplateRenders = function () {
    var self = this;

    var btn = $("#btn-open-folderpicker");
    var servicename = btn.data("service");

    //$("[class=service-configuration]").hide();
    //$("#btn-save-research-and-continue").hide();
    //$("#btn-sync-files-in-research").hide();

    btn.click(function () {
      OC.dialogs.filepicker(
        t("files", "Choose source folder"),
        function (targetPath, type) {
          self._services.getAll().forEach(function (element, index) {
            if (element.servicename === servicename) {
              this[index].filepath = targetPath.trim();
            }
          }, self._services.getAll());
          $("#filepath").html(t("rds", "Current path:") + ' ' + '<span id="fileStorage-path-Owncloud">' + targetPath.trim() + '</span>')
        },
        false,
        "httpd/unix-directory",
        true
      );
    });

    $("#app-content-wrapper #btn-edit-metadata").click(function () {

      if (!$('#rds_dialog').length) {
        $('body').append('<div id="rds_dialog" title="Reseach data services"></div>');
      }

      $('#rds_dialog').attr('title', t("rds", "RDS Metadata"));
      $('#rds_dialog').dialog();
      $('#rds_dialog').css('width', '800px').css('height', '600px');
      $('#rds_dialog').parent().css('width', '800px').css('height', '600px').css('top',
        '100px').css('z-index', '9999');

      $('#rds_dialog').parent().css('box-shadow', '0px 0px 0px #5151514D');
      $('#rds_dialog').parent().css('moz-box-shadow', '0px 0px 0px #5151514D');
      $('#rds_dialog').parent().css('-webkit-box-shadow', '0px 0px 0px #5151514D');

      $('#rds_dialog').html(
        t("rds", "This application is currently under heavy development.") + "<br /><br />" +
        t("rds", "Please use <a href=\"https://uts-eresearch.github.io/describo/\" target=\"_blank\">Describo</a> to describe your metadata on your local ownCloud-synchronized folder. ") + "<br />" +
        t("rds", "Use the following <a href=\"https://www.research-data-services.org/metadata/sciebords-profile.json\" target=\"_blank\">schema file</a> as your profile schema.")
      );

      $('#rds_dialog a').css('text-decoration', 'underline');
    })



    $("#app-content-wrapper #btn-save-research").click(function () {
      self.save().done(function () {
        OC.dialogs.alert(
          t("rds", "Successfully saved your changes."),
          t("rds", "RDS Update project")
        );
        self._view.render();
      })
    });

    $("#app-content-wrapper #btn-save-research-and-continue").click(function () {
      OC.dialogs.confirm(
        t("rds", "Are you sure, that you want to synchronize and publish this research to services?"),
        t("rds", "RDS Update project"),
        function (confirmation) {
          {
            if (confirmation == false) {
              return;
            }

            self.save().done(function () {
              self._view.render();
              self._view._files.load(self._studies.getActive().researchIndex).done(function () {
                OC.dialogs.alert(
                  t("rds", "Your files and metadata will be synchronized and published within the next few minutes."),
                  t("rds", "RDS Update project")
                );
                self._studies.triggerSync().done(function () {
                  OC.dialogs.alert(
                    t("rds", "Your files and metadata were synchronized and published."),
                    t("rds", "RDS Update project")
                  );
                })
              });
            })
          }
        }
      );
    });
  };

  OC.rds.WorkflowTemplate.prototype._saveFn = function () {
    var self = this;
    var portIn = [];
    var portOut = [];

    var owncloudPort = {
      port: "port-" + "Owncloud".toLowerCase(),
      properties: [
        {
          portType: "fileStorage",
          value: true
        },
        {
          portType: "customProperties",
          value: [{
            key: "filepath",
            value: $("#fileStorage-path-Owncloud").html().trim(),
          }],
        }
      ]
    };

    portIn.push(owncloudPort);

    var deferreds = []
    var results = []

    $(".metadata-service input").each(function (index, obj) {
      var $this = $(obj)
      var servicename = $this.data("service")
      var prechecked = $this.data("projectid")

      if ($this.is(":checked")) {
        if (prechecked === undefined) {
          var def = self._services.createProject(servicename)
          def.done(function (res) {
            results.push(res)
          })
          deferreds.push(def)
        } else {
          var servicePort = {
            port: "port-" + servicename.toLowerCase(),
            properties: [
              {
                portType: "metadata",
                value: true
              },
              {
                portType: "customProperties",
                value: [{
                  key: "projectId",
                  value: prechecked.toString()
                }],
              }
            ]
          };
          portOut.push(servicePort);
        }
      }
    })

    return $.when.apply($, deferreds).done(function () {
      results.forEach(function (project) {
        var servicePort = {
          port: project.portName,
          properties: [
            {
              portType: "metadata",
              value: true
            },
            {
              portType: "customProperties",
              value: [{
                key: "projectId",
                value: project.projectId.toString()
              }],
            }
          ]
        };
        portOut.push(servicePort);
      })
    }).done(function () {
      return self._studies.updateActive(portIn, portOut)
    })
  };

  OC.rds.View = function (studies, services, files) {
    this._studies = studies;
    this._services = services;
    this._files = files;
    this._stateView = 0;

    this._templates = [
      new OC.rds.OverviewTemplate(
        "#research-overview-tpl",
        this,
        this._services,
        this._studies
      ),
      new OC.rds.WorkflowTemplate(
        "#research-workflow-tpl",
        this,
        this._services,
        this._studies
      ),
    ];
  };

  OC.rds.View.prototype = {
    renderContent: function () {
      var self = this;
      if (self._studies.getActive() === undefined) {
        self._stateView = 0;
      }
      this._templates[self._stateView].render();
    },
    renderNavigation: function () {
      var self = this;
      var source = $("#navigation-tpl").html();
      var template = Handlebars.compile(source);
      function patch(studies) {
        studies.forEach(function (research, index) {
          if (research.status === 2) {
            this[index].showSync = true;
          }
        }, studies);

        return studies;
      }
      var html = template({ studies: patch(this._studies.getAll()) });

      $("#app-navigation ul").html(html);

      // create new research
      var self = this;
      $("#new-research").click(function () {
        var conn = {};

        self._studies
          .create()
          .done(function () {
            self._stateView = 1;
            self.render();
          })
          .fail(function () {
            OC.dialogs.alert(
              t("rds", "Could not create research"),
              t("rds", "RDS Update project")
            );
          });
      });

      // show app menu
      $("#app-navigation .app-navigation-entry-utils-menu-button").click(
        function () {
          var entry = $(this).closest(".research");
          entry.find(".app-navigation-entry-menu").toggleClass("open");
        }
      );

      $("#app-navigation .research .upload").click(function () {
        self._files
          .triggerSync()
          .done(function () {
            self.render();
          })
          .fail(function () {
            OC.dialogs.alert(
              t("Could not sync research, not found"),
              t("rds", "RDS Update project")
            );
          });
      });

      // delete a research
      $("#app-navigation .research .delete").click(function () {
        var entry = $(this).closest(".research");
        entry.find(".app-navigation-entry-menu").removeClass("open");

        self._studies
          .removeActive()
          .done(function () {
            self.render();
          })
          .fail(function () {
            OC.dialogs.alert(
              t("Could not delete research, not found"),
              t("rds", "RDS Update project")
            );
          });
      });

      // load a research
      $("#app-navigation .research > a").click(function () {
        var id = parseInt($(this).parent().data("id"), 10);
        self._studies.load(id);

        if (self._studies.getActive().status > 1) {
          self._files.load(self._studies.getActive().researchIndex);
        }

        self._stateView = 1;
        self.render();
      });
    },
    render: function () {
      this.renderNavigation();
      this.renderContent();
      $(".icon-info").tipsy({ gravity: "w" });
    },
    loadAll: function () {
      var self = this;

      return $.when(
        self._studies.loadAll(),
        self._services.loadAll(),
      ).done(function () {
        var params = new window.URLSearchParams(window.location.search);
        var index = params.get("researchIndex")
        if (index !== undefined) {
          self._studies.load(index)
          self._stateView = 1;
        }
      });
    },
  };
})(OC, window, jQuery);
