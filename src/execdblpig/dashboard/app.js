var shell = shell || {};
shell.app = shell.app || {};
shell.app.execdblp = shell.app.execdblp || {};
shell.app.execdblp.dashboard = ( function (my) {


  my.updatePeriod = function(appConfig, appData) {
    var $body = $("body");

    // check the prerequisites
    if (!_checkPrerequisites() || !_checkValidConfiguration(appConfig)) {
      return;
    }

    // store the configuration in the body
    $body.data("customConfig", appConfig);
    $body.data("customDataApp", appData);

    // build the summary and trend
    my._applyStyles();
    my._buildReports();
    my._buildTrend();
    my._buildSummary();
  };


  my.buildSkeleton = function (elementId, periods, selectedPeriod) {
    var $body = $("body");

    // if no appConfig is specified, show the file selector
    // if there is not configuration provided, display the file upload screen
    if (!periods || !periods.length) {
      return;
    }

    // store the target
    $body.data("customTargetElement", elementId);
    $body.data("customPeriods", periods);


    my._addUtilities();
    my._buildSkeleton(elementId);
    my._buildHeader();


    // acknowledge that the skeleton build is done
    var period = selectedPeriod || periods[0].id;
    var version;
    if (!selectedPeriod && periods[0].version) {
      version = periods[0].version;
    }

    // check if there is a specific version required
    if (version) {
      $("#jbi_header_period [data-filterkey='" + period + "'][data-version='" + version + "']").trigger(my.eventTrigger);
    } else {
      $("#jbi_header_period [data-filterkey='" + period + "']").trigger(my.eventTrigger);
    }

    // hide the period filter dropdown
    $('#jbi_header_period_filter_items').hide();


    // tooltip handler
    if (my.isMobile) {
      var timeout;
      $(document).unbind('touchend');
      $(document).on('touchend', function () {
        clearTimeout(timeout);
        var chartContainers = $(".highcharts-container");
        timeout = setTimeout(function () {
          for (var i = 0; i < chartContainers.length; i++) {
            var chart = $(chartContainers[i]).parent().highcharts();
            chart.tooltip.hide(0);
            chart.pointer.reset();
            if (chart.hoverSeries) {
              chart.hoverSeries.setState();
            }
          }
        }.bind(this), 2000);
      });
    }

    Highcharts.setOptions({
      lang: {
        numericSymbols: null, //[' k', ' M', ' Bn', ' T', ' P', ' E']
        thousandsSep: ','
      },
      chart: {
        style: {
          fontFamily: 'Verdana'
        }
      }
    });
  };



  /**
   * Check if the prerequisites van de applications are met. If not, an alert will be displayed.
   * @returns {boolean} False in case the the prerequisites are not met.
   * @private
   */
  function _checkPrerequisites() {

    // jquery
    if (!$) {
      alert("No version of jQuery found. JQuery is a prerequisite of this application.");
      return false;
    }

    // highcharts
    if (!$().highcharts) {
      alert("No version of highcharts found. Highcharts is a prerequisite of this application.");
      return false;
    }

    return true;
  }


  /**
   * Check if the configuration object is valid
   *
   * @param appConfig Object holding the configuration of the application
   * @returns {boolean} False in case the configuration is invalid
   * @private
   */
  function _checkValidConfiguration(appConfig) {
    return !(!appConfig || !appConfig.CONFIG || !appConfig.CONFIG.dashboard);
  }


  return my;
}(shell.app.execdblp.dashboard || {}));
