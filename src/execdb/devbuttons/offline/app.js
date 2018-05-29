var shell = shell || {};
shell.app = shell.app || {};
shell.app.execdb = shell.app.execdb || {};
shell.app.execdb.developerbuttons_offline = (function (my) {

  my.buildDeveloperButtons = function () {

    addCSS();
    addHTML();
    addEventHandlers();

    function addCSS() {
      var s = "";
      s += "<style type='text/css' id='CSS_DEVELOPER' data-repstyle='execdb'>";
      s += "#devButtons {";
      s += " width: 200px;";
      s += " position: fixed;";
      s += " padding: 5px;";
      s += " bottom: 0;";
      s += " left: 0;";
      s += " z-index: 99999;";
      s += " background-color: white;";
      s += "}";
      s += ".devbutton{";
      s += "  width: 100%;";
      s += "  margin-top: 5px;";
      s += "  min-height: 40px;";
      s += "  text-align: center;";
      s += "  display: table;";
      s += "  background-color: #EEEEEE;";
      s += "  border: 1px solid #E0E0E0;";
      s += "  border-radius: 5px;";
      s += "  color: rgb(153, 153, 153);";
      s += "  cursor: pointer;";
      s += "  box-sizing:border-box;";
      s += "  position: relative;";
      s += "  line-height: 14px;";
      s += "}";
      s += ".devbutton span{";
      s += "  font-size: 12px;";
      s += "  font-family: Tahoma;";
      s += "  font-weight: bold;";
      s += "  display:table-cell;";
      s += "  vertical-align: middle;";
      s += "  pointer-events: none;";
      s += "}";
      if (!my.isMobile) {
        s += ".devbutton:hover{";
        s += "  background-color: #333;";
        s += "  color: #FFF !important;";
        s += "}";
      }
      s += ".devButtonGroup{";
      s += " margin-top: 20px;";
      s += "}";
      s += ".devButtonGroupTitle{";
      s += " font-size: 12px;";
      s += " font-family: Verdana;";
      s += " font-weight: bold;";
      s += " text-align: center;";
      s += "}";
      s += ".devButtonClosePane{";
      s += " bottom: 0;";
      s += " left: 0;";
      s += " position: fixed;";
      s += " width: 200px;";
      s += " padding: 5px;";
      s += "}";
      s += "</style>";
      $(s).appendTo("head");
    }


    function addHTML() {
      var $body = $("body"),
        cfg = $body.data("customConfig"),
        hasDashboard = (cfg && cfg["CONFIG"] && cfg["CONFIG"]["bw"] && cfg["CONFIG"]["bw"]["Dashboard"]),
        s = "";

      // check if dashboard options are available
      if (!hasDashboard) {
        alert("No development options available for this dashboard.");
      }


      // storing the configuration is only relevant in case the report is
      // opened from a configuration excel file
      //@formatter:off
      s += "<div id='devButtons'>";
        s += "<div class='devButtonClosePane'>";
          s += "<div class='devButtonGroup'>";
            s += "<div class='devButtonGroupButtons'>";
              s += addButton('backToLaunchPad', 'Back to LaunchPad');
            s += "</div>";
          s += "</div>";
        s += "</div>";
      s += "</div>";
      //@formatter:on
      $body.append(s);

      function addButton(handlerName, buttonText) {
        return "<div class='devbutton' data-buttonaction='" + handlerName + "'><span>" + buttonText + "</span></div>";
      }
    }


    /**
     * Add the event handlers for the developer buttons
     */
    function addEventHandlers() {
      var $body = $("body"),
        $support_export_close = $("#support_export_close"),
        $jbi_headerTitle = $('#jbi_headerTitle'),
        $devButton = $(".devbutton"),
        buttonHandlers = {
          backToLaunchPad: backToLaunchPad
        };


      // attach the button handlers
      $devButton.unbind(my.eventTrigger);
      $devButton.on(my.eventTrigger, function () {
        var buttonAction = $(this).data("buttonaction");

        if (buttonHandlers[buttonAction]) {
          buttonHandlers[buttonAction]();
        } else {
          alert("No handler for button found.");
        }
      });


      /**
       * Event Handler for closing the pane with developer buttons
       */
      function backToLaunchPad() {
        var $jbi_app_report = $("#jbi_app_report"),
          $body = $("body");

        $jbi_app_report.hide();
        $jbi_app_report.html("");
        $("#devButtons").remove();
        $("#zoomContainer").remove();

        // get the current period
        var currentPeriodObject = shell.app.execdb.dashboard.period_functions.getCurrentPeriod(),
          currentPeriod = currentPeriodObject.periodNumber + "." + currentPeriodObject.year;

        // remove the styles related to the current dashboard
        $("[data-repstyle='execdb']").remove();

        var businessId = $body.data('currentBusiness');

        var  offlineData = $body.data("offline_data").slice(0);

        // remove the data related to the current dashboard
        $body.removeData();

        //add the generic data
        $body.data("offline_data",offlineData);

        // rebuild the report
        $body.data('initialBusiness', businessId);
        shell.app.execdblp.offlinereader.build(currentPeriod, businessId);
        $("#jbi_app_lp").show();
      }


      /**
       * Wait for the 'title' button to be pressed before the showing
       * the developer buttons
       */
      var timeoutId = 0;
      $jbi_headerTitle.mousedown(function () {
        timeoutId = setTimeout(function () {
          $("#devButtons").show();
        }, 2000);
      }).bind('mouseup mouseleave', function () {
        clearTimeout(timeoutId);
      });
    }
  };


  return my;
}(shell.app.execdb.developerbuttons_offline || {}));
