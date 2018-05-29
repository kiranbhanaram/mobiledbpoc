var shell = shell || {};
shell.app = shell.app || {};
shell.app.execdb = shell.app.execdb || {};
shell.app.execdb.dashboard = ( function (my) {

  my.build = function (elementId, appConfig, appData) {

    var $body = $("body");

    // check the prerequisites
    if (!_checkPrerequisites()) {
      return;
    }

    // if no appConfig is specified, show the file selector
    // if there is not configuration provided, display the file upload screen
    if (!appConfig || !appConfig.CONFIG) {
      return;
    }

    if (!_checkValidConfiguration(appConfig)) {
      return;
    }

    // store the configuration in the body
    $body.data("customConfig", appConfig);
    $body.data("customDataApp", appData);
    $body.data("customTargetElement", elementId);

    // build the report
    my._buildSkeleton(elementId);
    my._buildBusinessFilter( );
    my._buildFilters();
    my._buildMenu();
    my._showPeriod();
    my._buildPDF();

    _setGenericTooltipHandler();
    _setGenericHighchartsOptions();
    _setHighchartsGarbageCollector();

    setTimeout(function() {
      my._navToInitialView();
    }, 200);

    // trigger an event to acknowledge that the dashboard is build
    $body.trigger("dashboardLoaded");
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


  function _setGenericTooltipHandler() {
    // tooltip handler
    if (my.isMobile) {
      var timeout;
      var $document = $(document);
      $document.unbind('touchend');
      $document.on('touchend', function () {
        clearTimeout(timeout);
        var $chartContainers = $(".highcharts-container");
        timeout = setTimeout(function () {
          for (var i = 0; i < $chartContainers.length; i++) {
            var chart = $($chartContainers[i]).parent().highcharts();
            chart.tooltip.hide(0);
            chart.pointer.reset();
            if (chart.hoverSeries) {
              chart.hoverSeries.setState();
            }
          }
        }.bind(this), 2000);
      });
    }
  }


  /**
   * Generic Highcharts Options
   *
   * This function sets some generic highcharts options which are taken over
   * in all highcarts created objects.
   */
  function _setGenericHighchartsOptions() {
    var $customConfig = $("body").data("customConfig");
    var fontFamily = ($customConfig && $customConfig["CONFIG"] && $customConfig["CONFIG"]["DASHBOARD"] && $customConfig["CONFIG"]["DASHBOARD"]["FontFamily"])
      ? $customConfig["CONFIG"]["DASHBOARD"]["FontFamily"]
      : "Verdana";


    Highcharts.setOptions({
      lang: {
        numericSymbols: null, //[' k', ' M', ' Bn', ' T', ' P', ' E']
        thousandsSep: ','
      },
      chart: {
        style: {
          fontFamily: fontFamily
        }
      }
    });
  }

  /**
   * Destroy and unreference all Highchart chart instances
   *
   * If not destroyed Highchart instances will live on for the entire
   * application lifecycle and slow down the application.
   */
  function _setHighchartsGarbageCollector() {
    var $body = $('body');
    $body.unbind('beforePageRender');
    $body.on('beforePageRender', function() {
      Highcharts.charts.forEach(function(chart) {
        if (chart && chart.destroy) {
          chart.destroy();
        }
      });
      Highcharts.charts.length = 0;
    });
  }

  return my;
}(shell.app.execdb.dashboard || {}));
