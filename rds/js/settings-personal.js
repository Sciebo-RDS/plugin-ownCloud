(function (OC, window, $, undefined) {
  "use strict";
  $(document).ready(function () {
    const parseJwt = (token) => {
      try {
        return JSON.parse(atob(token.split(".")[1]));
      } catch (e) {
        return null;
      }
    };

    // holds all services
    var Services = function (baseUrl) {
      this._baseUrl = baseUrl;
      this._services = []; // holds object with servicename, authorizeUrl, state, date
      this._user_services = []; // holds strings

      var self = this;
      this._services_without_user = function () {
        var list = [];

        self._services.forEach(function (service, index) {
          var found = false;
          self._user_services.forEach(function (user_service, index) {
            if (service["servicename"] === user_service["servicename"]) {
              found = true;
            }
          });

          if (!found) {
            list.push(service);
          }
        });
        return list;
      };
    };

    Services.prototype = {
      loadAll: function () {
        var deferred = $.Deferred();
        var counter = 2;

        var self = this;

        this.loadServices()
          .done(function () {
            counter -= 1;
            if (counter == 0) {
              deferred.resolve();
            }
          })
          .fail(function () {
            deferred.reject();
          });

        this.loadUserservices()
          .done(function () {
            counter -= 1;
            if (counter == 0) {
              deferred.resolve();
            }
          })
          .fail(function () {
            deferred.reject();
          });
        return deferred.promise();
      },

      loadServices: function () {
        var deferred = $.Deferred();
        var self = this;

        $.get(this._baseUrl + "/service", "json")
          .done(function (services) {
            self._services = services;
            deferred.resolve();
          })
          .fail(function () {
            deferred.reject();
          });
        return deferred.promise();
      },

      loadUserservices: function () {
        var deferred = $.Deferred();
        var self = this;

        $.get(this._baseUrl + "/userservice", "json")
          .done(function (services) {
            self._user_services = services;
            deferred.resolve();
          })
          .fail(function () {
            deferred.reject();
          });
        return deferred.promise();
      },

      removeServiceFromUser: function (servicename) {
        var deferred = $.Deferred();
        var self = this;

        $.ajax({
          type: "DELETE",
          url: this._baseUrl + "/userservice/" + servicename,
          success: function (result) {
            self
              .loadAll()
              .done(function () {
                deferred.resolve();
              })
              .fail(function () {
                deferred.reject();
              });
          },
          error: function (result) {
            deferred.reject();
          },
        });

        return deferred.promise();
      },
    };

    // used to update the html
    var View = function (services) {
      this._services = services;
      this._authorizeUrl = {};
      this._informations = {};
      this._btn = document.getElementById("svc-button");
      this._btn.disabled = true;
      this._select = document.getElementById("svc-selector");
    };

    View.prototype = {
      removeServiceFromUser: function (servicename) {
        var self = this;

        OC.dialogs.confirm(
          t("rds", "Are you sure, that you want to delete {servicename}?", {
            servicename: servicename,
          }),
          t("rds", "RDS Settings services"),
          function (confirmation) {
            {
              if (confirmation == false) {
                return;
              }

              self._services
                .removeServiceFromUser(servicename)
                .done(function () {
                  self.render();
                })
                .fail(function () {
                  OC.dialogs.alert(
                    t("rds", "Could not remove the service {servicename}", {
                      servicename: servicename,
                    }),
                    t("rds", "RDS Settings services")
                  );
                })
                .always(function () {
                  if (servicename === "Owncloud") {
                    $.ajax({
                      type: "DELETE",
                      url: self._services._baseUrl + "/research",
                    }).always(function (result) {
                      location.reload();
                    });
                  }
                });
            }
          }
        );
      },
      renderContent: function () {
        var self = this;
        $("#serviceStable > tbody").html("");
        var source = $("#serviceStable > tbody:last-child");

        this._services._user_services.forEach(function (item, index) {
          if (item["servicename"] !== "Owncloud") {
            source.append(
              "<tr><td>" +
              item["servicename"] +
              "</td><td>" +
              '<button data-servicename="' +
              item["servicename"] +
              '" class="button icon-delete"></button>' +
              "</td></tr>"
            );
          }
        }, this);

        var btns = $("#serviceStable :button");
        btns.click(function () {
          var $this = $(this);
          var servicename = $this.data("servicename");

          self.removeServiceFromUser(servicename);
        });

        if (this._services._user_services.length > 0) {
          var serviceDiv = document.getElementById("services");
          if (serviceDiv) {
            serviceDiv.style.display = "block";
          }
        }

        $("#owncloud-button-removal").click(function () {
          self.removeServiceFromUser("Owncloud");
          return false;
        });
      },
      renderSelect: function () {
        var self = this;
        var setSelectBtn = function () {
          self._btn.textContent = t("rds", "Authorize {servicename} now", {
            servicename: self._select.options[self._select.selectedIndex].text,
          });
          self._btn.value = self._select.options[self._select.selectedIndex].value;
          self._btn.disabled = false;
        }

        var notUsedServices = self._services._services_without_user();
        var selected = false;

        self._select.addEventListener("change", function () {
          setSelectBtn();
        });

        notUsedServices.forEach(function (item, index) {
          if (item.informations == undefined) {
            self._informations[item.servicename] = {};
          } else {
            self._informations[item.servicename] = item.informations;
          }
          self._informations[item.servicename] = item.informations;
          self._authorizeUrl[item.servicename] = item.authorizeUrl + "&state=" + item.state + "FROMSETTINGS";
          var option = document.createElement("option");
          option.text = option.value = item.servicename;

          self._select.add(option, 0);

          if (!selected) {
            selected = true;
            $(option).attr('selected', 'selected');

            setSelectBtn();
            self._select.selectedIndex = 0;
          }

        });
      },
      renderButton: function () {
        var self = this;

        self._btn.onclick = function () {
          var select = self._select;
          var authUrl = self._authorizeUrl[select.options[select.selectedIndex].text]
          var informations = self._informations[select.options[select.selectedIndex].text]

          if (informations.loginMode == 0) {
            var input = "";
            var cred = informations.credentials;
            if (cred != undefined) {
              if (cred.userId != undefined && cred.userId) {
                input += "<label for=\"cred_username\">" + t("rds", "Username") + ": <input type=\"text\" id=\"cred_username\"" + "</label><br />";
              }
              if (cred.password != undefined && cred.password) {
                input += "<label for=\"cred_password\">" + t("rds", "Password") + ": <input type=\"text\" id=\"cred_password\"" + "</label><br />"
              }
            }

            // Add here the informations related username / password popup
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
              t("rds", "Enter your credentials here:") + "<br /><br />" +
              input +
              "<button type=\"button\" id=\"cred_submit\">" + t("rds", "Submit credentials") + "</button>"
            );

            $('#rds_dialog a').css('text-decoration', 'underline');

            var saveCredentials = function (service, user, password) {
              $.ajax({
                url: OC.generateUrl("apps/rds") + "/credentials",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                  servicename: service,
                  username: user,
                  password: password
                }),
              })
              $('#rds_dialog').parent().hide();
            }

            var service = select.options[select.selectedIndex].text
            if (input != "") {
              $("#cred_submit").addEventListener("click", function () {
                saveCredentials(service, $("#cred_username").text(), $("#cred_password").text())
              })
            } else {
              saveCredentials(service, "", "")
            }
          } else {
            var win = window.open(
              authUrl,
              "_self",
              "width=100%,height=100%,scrollbars=yes"
            );

            var timer = setInterval(function () {
              if (win.closed) {
                clearInterval(timer);
                location.reload();
              }
            }, 300);
          }
        };
      },

      render: function () {
        this.renderSelect();
        this.renderButton();
        this.renderContent();
      },
    };

    var services = new Services(OC.generateUrl("apps/rds"));
    var view = new View(services);
    services.loadAll().done(function () {
      view.render();
    });
  });
})(OC, window, jQuery);
