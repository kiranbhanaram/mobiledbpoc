//####src/execdblpig/dashboard/app.js
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

//####src/execdblpig/dashboard/mod_chart.js
shell.app.execdblp.dashboard = ( function (my) {

  /**
   * Generates chart
   *
   * This is a generic function that is used to generate the chart
   *
   * @param containerDiv   the ID of the HTML div element in which the object
   *                       needs to be rendered
   * @param config         the configuration settings for the bullet chart
   * @param dataId         the ID of the data for the object
   * @param businessData   the data for the selected business
   */

  my._createChart = function (containerDiv, config, dataId, businessData) {
    addHTML(containerDiv, config);
    buildChart(containerDiv, config, dataId, businessData);


    /**
     * Add HTML for chart object
     *
     * This function adds the HTML for the chart object inside the Content container.
     *
     * @param containerDiv   the ID of the HTML div element in which the object
     *                       needs to be rendered
     * @param config {object} configuration of the container
     */
    function addHTML(containerDiv, config) {
      var enableToggleSeriesButton = (!config || !config["DisableHideAll"] || config["DisableHideAll"].toUpperCase() !== "TRUE");

      var s = "";
      s += "<div id='" + containerDiv + "Chart' style='height:100%;'></div>";
      if (enableToggleSeriesButton) {
        s += "<div id=\"" + containerDiv + "ToggleSeriesButton\" class=\"ToggleSeriesButton\">Hide All</div>";
      }

      // Add the HTML to the container
      $("#" + containerDiv + "Content").html(s);

      // add an event listener for the toggle series button
      if (enableToggleSeriesButton) {
        var $toggleSeriesButton = $("#" + containerDiv + "ToggleSeriesButton");
        $toggleSeriesButton.unbind(my.eventTrigger);
        $toggleSeriesButton.on(my.eventTrigger, function () {
          var chart = $('#' + containerDiv + "Chart").highcharts();
          var series = chart.series[0];
          if (series.visible) {
            $(chart.series).each(function () {
              this.setVisible(false, false);
              $toggleSeriesButton.html("Show All");
            });
            chart.redraw();
          } else {
            $(chart.series).each(function () {
              this.setVisible(true, false);
              $toggleSeriesButton.html("Hide All");
            });
            chart.redraw();
          }
        });
      }
    }


    /**
     * Build Chart
     *
     * Build the chart in the container based on the provided configuration and the
     * data.
     *
     * @param containerDiv   the ID of the HTML div element in which the object
     *                       needs to be rendered
     * @param config         the configuration settings for the bullet chart
     * @param dataId         the ID of the data for the object
     * @param businessData   the data for the selected business
     */
    function buildChart(containerDiv, config, dataId, businessData) {

      // set the generic highcharts options
      setGenericHighchartsOptions();

      // build the chart when the div is rendered
      checkChartDivRendered(containerDiv, config, dataId, businessData, 0);

    }


    function checkChartDivRendered(containerDiv, config, dataId, businessData, time) {
      var $containerDiv = $('#' + containerDiv + "Chart");

      if ($containerDiv.outerWidth() === 0 && time < 100) {
        setTimeout(function () {
          checkChartDivRendered(containerDiv, config, dataId, businessData, ++time);
        }, 100);
        return;
      }

      // get the chart configuration
      var chartConfig = getChartConfiguration(
        config,
        dataId,
        businessData
      );

      // check if there is data to be displayed
      if (!chartConfig || !chartConfig.series || !chartConfig.series.length) {
        $("body").trigger("showContainerMessage", {
          container: containerDiv,
          message: "No data available.",
          type: "W"
        });
        return;
      }

      // build the chart if the DIV is available
      $containerDiv.highcharts(chartConfig);
    }


    /**
     * Get Chart Configuration Object
     *
     * Generate the chart configuration object that is required for the Highchats
     * library. The generation is done based on the provided configuration object
     * and the dataId.
     *
     * @param config         the configuration settings for the bullet chart
     * @param dataId         the ID of the data for the object
     * @return               an object holding chart configuration
     * @param businessData   the data for the selected business
     */
    function getChartConfiguration(config, dataId, businessData) {
      var chartConfig = null;

      // based on the chartType, get the correct configuration
      if (!config || !config.Type) {
        return chartConfig;
      }
      switch (config.Type.toUpperCase()) {
        case 'PERIODS':
          chartConfig = getConfigPeriodChart(config, dataId, businessData);
          break;

        case 'BUSINESS':
          chartConfig = getConfigBusinessChart(config, dataId, businessData);
          break;

        case 'KPIS':
          chartConfig = getConfigKpiChart(config, dataId, businessData);
          break;

        default:
          break;
      }


      if (chartConfig) {

        // change the 'undefined' in the chart data to null
        if (chartConfig.series && chartConfig.series.length) {
          for (var i = 0; i < chartConfig.series.length; i++) {
            if (chartConfig.series[i].data && chartConfig.series[i].data.length) {
              for (var y = 0; y < chartConfig.series[i].data.length; y++) {
                if (chartConfig.series[i].data[y] === undefined) {
                  chartConfig.series[i].data[y] = null;
                }
              }
            } else {
              chartConfig.series[i].data = [];
            }
          }
        }


        // change the thousand separators
        var yAxisDecimals = (chartConfig && chartConfig.yAxis && chartConfig.yAxis.decimals) ? chartConfig.yAxis.decimals : 0;

        chartConfig.yAxis = chartConfig.yAxis || [{}];
        if (Object.prototype.toString.call(chartConfig.yAxis) === '[object Array]') {

          var noOfAxis = chartConfig.yAxis.length || 0;
          for (var ax = 0; ax<noOfAxis; ax++) {
            yAxisDecimals = chartConfig.yAxis[ax].decimals || 0;
            chartConfig.yAxis[ax].labels = chartConfig.yAxis[0].labels || {};
            chartConfig.yAxis[ax].labels.formatter = function () {
              return Highcharts.numberFormat(this.value, yAxisDecimals, '.', ',');
            };
          }

        } else {
          chartConfig.yAxis.labels = chartConfig.yAxis.labels || {};
          chartConfig.yAxis.labels.formatter = function () {
            return Highcharts.numberFormat(this.value, yAxisDecimals, '.', ',');
          };
        }


        // Display 'Show all' or 'Hide all' when changing the legend items visibility
        chartConfig.plotOptions = chartConfig.plotOptions || {};
        chartConfig.plotOptions.series = chartConfig.plotOptions.series || {};
        chartConfig.plotOptions.series.events = chartConfig.plotOptions.series.events || {};
        chartConfig.plotOptions.series.events.legendItemClick = function (e) {
          var series = e.target.chart.series,
            noOfVisibleSeries = 0;

          // get the number of visible series
          for (var i = 0; i < series.length; i++) {
            if ((e.target.name === series[i].name && !series[i].visible)
              || (e.target.name !== series[i].name && series[i].visible)) {
              noOfVisibleSeries += 1;
            }
          }

          // only change the text in case either all items are selected or none
          if (noOfVisibleSeries === 0 || noOfVisibleSeries === series.length) {
            $("#" + containerDiv + "ToggleSeriesButton").html(( (noOfVisibleSeries === 0) ? "Show All" : "Hide All" ));
          }
        };


        // Special logic
        if (chartConfig
          && chartConfig.chart
          && chartConfig.chart.custom
          && chartConfig.chart.custom.config
          && my._specific.charts[chartConfig.chart.custom.config]) {
          chartConfig = my._specific.charts[chartConfig.chart.custom.config].apply(null, [chartConfig]);
        }
      }


      // return the chart configuration
      return chartConfig;
    }


    /**
     * Generic Highcharts Options
     *
     * This function sets some generic highcharts options which are taken over
     * in all highcarts created objects.
     */
    function setGenericHighchartsOptions() {
      Highcharts.setOptions({
        lang: {
          numericSymbols: null, //[' k', ' M', ' Bn', ' T', ' P', ' E']
          thousandsSep: ','
        }
      });
    }

    /**
     * Get the configuration for the period chart
     * @param config
     * @param dataId
     * @param businessData
     * @returns {*}
     */
    function getConfigPeriodChart(config, dataId, businessData) {

      // parse the configuration strings
      var chartConfig = parseConfigString(config, "Config"),
        seriesConfig = parseConfigString(config, "SeriesConfig"),
        periodsConfig = parseConfigString(config, "DataPoints");

      // the periods configuration is mandatory
      if (!periodsConfig || !periodsConfig.length) {
        return null;
      }

      // add the series and the categories
      if (businessData && dataId) {
        var chartData = filterDataByPeriod(periodsConfig, businessData, dataId, seriesConfig);
        if (chartData) {
          chartConfig.xAxis.categories = chartData.categories;
          chartConfig.series = chartData.series;
          chartConfig.custom = chartConfig.custom || {};
          chartConfig.custom.period = chartData.currentPeriod;
        }
      }

      // check for specific logic
      if (chartConfig.custom
        && chartConfig.custom.config
        && my._specific.charts[chartConfig.custom.config]) {

        chartConfig = my._specific.charts[chartConfig.custom.config].apply(this, [chartConfig])
      }
      return chartConfig;
    }


    /**
     * Parse the provided chart configuration JSON object
     * @param config {object} Configuration object holding the strings
     * @param configName {string} Name of the configuration string
     * @returns {object} The parsed object
     */
    function parseConfigString(config, configName) {
      var parsedConfig;
      if (!config || !config[configName])
        return null;
      try {
        parsedConfig = eval ("(" + config[configName] + ")" );
      } catch (error) {
        console.log(error);
      }
      return parsedConfig;
    }


    /**
     * Get the configuration for the business chart
     * @param config
     * @param dataId
     * @param businessData
     * @returns {*}
     */
    function getConfigBusinessChart(config, dataId, businessData) {

      // parse the configuration strings
      var chartConfig = parseConfigString(config, "Config"),
        seriesConfig = parseConfigString(config, "SeriesConfig"),
        periodsConfig = parseConfigString(config, "DataPoints");

      // the periods configuration is mandatory
      if (!periodsConfig || !periodsConfig.length) {
        return null;
      }

      // add the series and the categories
      if (businessData && dataId) {
        var kpis = dataId.split(";"),
          i, y,
          arrayOfBusinessData = [],
          currentPeriod,
          displayPeriod;

        // the business data can either be delivered as single item or as array
        if (Object.prototype.toString.call(businessData) === '[object Array]') {
          arrayOfBusinessData = businessData;
        } else {
          arrayOfBusinessData.push(businessData);
        }

        // determine the period that the chart need to display
        currentPeriod = my.period_functions.getCurrentPeriod();
        for (i = 0; i < periodsConfig.length; i++) {
          if (periodsConfig[i].months.indexOf(currentPeriod.periodShortName) > -1
            && periodsConfig[i].displayPeriods && periodsConfig[i].displayPeriods.length) {
            displayPeriod = periodsConfig[i].displayPeriods[0];
            break;
          }
        }
        if (!displayPeriod) {
          return null;
        }

        // get the text for the current period
        chartConfig.custom = chartConfig.custom || [];
        chartConfig.custom.periodText = currentPeriod.periodFullName + " " + currentPeriod.year;

        // add the categories
        chartConfig.xAxis = chartConfig.xAxis || {};
        chartConfig.xAxis.categories = [];
        for (i = 0; i < arrayOfBusinessData.length; i++) {
          if (arrayOfBusinessData[i]) {
            chartConfig.xAxis.categories.push(arrayOfBusinessData[i].text);
          }
        }

        // add the series
        chartConfig.series = [];
        for (i = 0; i < kpis.length; i++) {
          var kpiSeriesConfig = {};
          if (seriesConfig && seriesConfig["kpiSpecificConfig"] && seriesConfig["kpiSpecificConfig"][kpis[i]]) {
            kpiSeriesConfig = seriesConfig["kpiSpecificConfig"][kpis[i]];
          }

          kpiSeriesConfig.id = kpiSeriesConfig.name;
          kpiSeriesConfig.data = [];
          for (y = 0; y < arrayOfBusinessData.length; y++) {
            if (arrayOfBusinessData[y]
              && arrayOfBusinessData[y].kpis
              && arrayOfBusinessData[y].kpis[kpis[i]]
              && arrayOfBusinessData[y].kpis[kpis[i]].data
              && arrayOfBusinessData[y].kpis[kpis[i]].data[displayPeriod]
            ) {
              kpiSeriesConfig.data.push(arrayOfBusinessData[y].kpis[kpis[i]].data[displayPeriod]);
            } else {
              kpiSeriesConfig.data.push(null);
            }
          }

          chartConfig.series.push(kpiSeriesConfig);
        }
      }

      // add specific logic
      if (chartConfig.custom
        && chartConfig.custom.config
        && my._specific.charts[chartConfig.custom.config]) {

        my._specific.charts[chartConfig.custom.config].apply(this, [chartConfig])
      }

      return chartConfig;
    }


    function getConfigKpiChart(config, dataId, businessData) {

      // parse the configuration strings
      var chartConfig = parseConfigString(config, "Config"),
        periodsConfig = parseConfigString(config, "DataPoints");

      // the periods configuration is mandatory
      if (!periodsConfig || !periodsConfig.length) {
        return null;
      }

      // add the series and the categories
      if (businessData && dataId) {
        var chartData = filterDataByKpi(periodsConfig, businessData, dataId);
        if (chartData) {
          chartConfig.xAxis.categories = chartData.categories;
          chartConfig.series = chartData.series;
        }
      }

      // add specific logic
      if (chartConfig.custom
        && chartConfig.custom.config
        && my._specific.charts[chartConfig.custom.config]) {

        my._specific.charts[chartConfig.custom.config].apply(this, [chartConfig])
      }

      return chartConfig;
    }


    function filterDataByKpi(periodSettings, businessData, dataId) {
      var chartData = {
          categories: [],
          series: []
        },
        kpiData,
        currentPeriod = null,
        i, y;

      // get the kpis to be displayed
      var kpis = dataId.split(";");

      // determine the current period
      kpiData = businessData.kpis[kpis[0]];
      if (!kpiData || !kpiData.headerLabels || !kpiData.headerLabels.length) {
        return null;
      }
      for (i = 0; i < kpiData.headerLabels.length; i++) {
        if (kpiData.headerLabels[i].id === "CM CY") {
          currentPeriod = kpiData.headerLabels[i];
          break;
        }
      }

      // determine which periods are valid for the current month
      var displayPeriods = [];
      for (i = 0; i < periodSettings.length; i++) {
        if (periodSettings[i].months.indexOf(currentPeriod.label.substring(0, 3).toUpperCase()) > -1) {
          displayPeriods = periodSettings[i].displayPeriods;
          break;
        }
      }
      if (!displayPeriods.length) {
        return chartData;
      }

      // find the period names from the header labels
      for (i = 0; i < displayPeriods.length; i++) {
        for (y = 0; y < kpiData.headerLabels.length; y++) {
          if (displayPeriods[i].id === kpiData.headerLabels[y].id) {
            displayPeriods[i].text = kpiData.headerLabels[y].label;
            break;
          }
        }
      }

      // categories ==> kpis
      for (i = 0; i < kpis.length; i++) {
        kpiData = businessData.kpis[kpis[i]];
        if (!kpiData || !kpiData.text) {
          continue;
        }

        chartData.categories.push(kpiData.text);
      }

      // data ==> periods
      for (i = 0; i < displayPeriods.length; i++) {
        var seriesObject = {
          data: [],
          name: displayPeriods[i].text
        };
        for (y = 0; y < kpis.length; y++) {
          if (!businessData.kpis[kpis[y]] || !businessData.kpis[kpis[y]].data) {
            continue;
          }

          seriesObject.data.push(businessData.kpis[kpis[y]].data[displayPeriods[i].id]);
        }

        // series configuration
        var seriesConfiguration = displayPeriods[i].config;
        if (seriesConfiguration.color === "%selectedBusiness%") {
          seriesConfiguration.color = businessData.color;
        }

        seriesObject = $.extend(true, seriesObject, displayPeriods[i].config);
        chartData.series.push(seriesObject);
      }
      return chartData;
    }


    function filterDataByPeriod(periodSettings, businessData, dataId, seriesConfig) {
      var chartData = {
          categories: [],
          series: [],
          currentPeriod: {}
        },
        i, y,
        kpiData,
        defaultSeriesConfig = (seriesConfig && seriesConfig["default"]) ? seriesConfig["default"] : null,
        childrenSeriesConfig = (seriesConfig && seriesConfig.children) ? seriesConfig.children : null;

      // split the kpis
      var kpis = dataId.split(";");

      // determine the current period
      kpiData = businessData.kpis[kpis[0]];
      if (!kpiData) {
        return null;
      }

      var currentPeriod = my.period_functions.getCurrentPeriod();
      chartData.currentPeriod = {
        id: currentPeriod.periodIdentifier,
        label: currentPeriod.currentPeriod
      };

      // determine which periods are valid for the current month
      var displayPeriods = [];
      for (i = 0; i < periodSettings.length; i++) {
        if (periodSettings[i].months.indexOf(currentPeriod.periodShortName) > -1) {
          displayPeriods = periodSettings[i].displayPeriods;
          break;
        }
      }
      if (!displayPeriods.length) {
        return chartData;
      }

      // categories
      chartData.categories = my.period_functions.getPeriodIdentifierLabel(displayPeriods);


      // data
      var showChildren,
        kpi = null,
        customConfig;

      for (i = 0; i < kpis.length; i++) {
        showChildren = (kpis[i] === "++");
        kpiData = businessData.kpis[kpis[i]];

        // add the KPI for the selected business
        if (!showChildren) {
          var defConfig = defaultSeriesConfig;
          if ((Object.prototype.toString.call(defaultSeriesConfig) === '[object Array]') && defaultSeriesConfig.length > i) {
            defConfig = defaultSeriesConfig[i];
          }

          // check if there is a specific configuration for this kpi
          customConfig = $.extend(true, {}, defConfig);
          if (seriesConfig
            && seriesConfig["kpiSpecificConfig"]
            && seriesConfig["kpiSpecificConfig"][kpis[i]]) {
            customConfig = $.extend(true, customConfig, seriesConfig["kpiSpecificConfig"][kpis[i]]);
          }


          // if next item is ++, show business name, else kpi name
          var displayText = kpiData.text;
          if (i < kpis.length - 1 && kpis[i + 1] === "++") {
            displayText = businessData.text;
          }
          kpi = getKPIChartSeries(businessData, kpis[i], displayPeriods, displayText, customConfig);
          if (kpi) {
            chartData.series.push(kpi);
          }
        }

        // add the children if required
        if (showChildren) {
          var businessDatasets = $("body").data("customDataApp").datasets;

          if (businessData && businessData.children && businessData.children.length) {
            for (y = 0; y < businessData.children.length; y++) {
              var childKpis = businessDatasets[businessData.children[y]];

              // check if this child needs to be hidden
              if (seriesConfig
                && seriesConfig["hideChildren"]
                && seriesConfig["hideChildren"].length
                && seriesConfig["hideChildren"].indexOf(childKpis.id) > -1) {
                continue;
              }

              // get the id of the previous entry
              var kpiId = -1;
              if (i > 0) {
                kpiId = kpis[i - 1];
              }

              // check if there is a specific configuration for this kpi
              customConfig = $.extend(true, {}, childrenSeriesConfig);
              if (seriesConfig
                && seriesConfig["kpiSpecificConfig"]
                && seriesConfig["kpiSpecificConfig"][kpiId]) {
                customConfig = $.extend(true, customConfig, seriesConfig["kpiSpecificConfig"][kpiId]);
              }

              // check if there is a specific configuration for this child
              if (seriesConfig
                && seriesConfig["childSpecificConfig"]
                && seriesConfig["childSpecificConfig"][childKpis.id]) {
                customConfig = $.extend(true, customConfig, seriesConfig["childSpecificConfig"][childKpis.id]);
              }

              kpi = getKPIChartSeries(childKpis, kpiId, displayPeriods, childKpis.text, customConfig);
              if (kpi) {
                chartData.series.push(kpi);
              }
            }
          }
        }
      }
      return chartData;
    }


    function getKPIChartSeries(businessData, kpiId, displayPeriods, displayText, seriesConfig) {
      var kpiData = businessData.kpis[kpiId];

      if (!kpiData) {
        return null;
      }

      var kpiText = displayText ? displayText : kpiData.text;
      var kpi = {
        name: kpiText,
        id: businessData.id,
        data: [],
        color: businessData.color ? businessData.color : null
      };
      for (var y = 0; y < displayPeriods.length; y++) {
        kpi.data.push(kpiData.data[displayPeriods[y]])
      }

      return $.extend(true, kpi, seriesConfig);
    }

  };

  return my;

}(shell.app.execdblp.dashboard));

//####src/execdblpig/dashboard/mod_header.js
shell.app.execdblp.dashboard = ( function (my) {

    /**
     * buildHeader
     *
     * This function creates the header of the report. Takes care about the filters
     * that are part in the header. The look and feel of the header is driven from
     * the configuration object.
     *
     * @private
     */
    my._buildHeader = function () {
      var $customConfig = $('body').data('customConfig');
      var headerConfig = $customConfig && $customConfig.CONFIG && $customConfig.CONFIG.header;
      if(headerConfig === undefined) {
        headerConfig = getConfig();
      }

      addCSS(headerConfig);
      addHTML(headerConfig);
      addEventlisteners();


      function addCSS(headerConfig) {
        var $customConfig = $("body").data("customConfig");
        var fontFamily = ($customConfig && $customConfig["CONFIG"] && $customConfig["CONFIG"]["dashboard"] && $customConfig["CONFIG"]["dashboard"]["FontFamily"]) || 'Futura, "Trebuchet MS", Arial, sans-serif';

        // generate the CSS based on the configuration
//@formatter:off
      var s = "";
      s += "<style type='text/css' id='CSS_JBI_HEADER' data-repstyle='execdblp'>" +
            "#jbi_header{" +
              "position: relative;" +
              "display: block;" +
              "height:" + headerConfig["HeightPixels"] + "px;" +
              "background-color: " + headerConfig["BackgroundColor"] + ";" +
            "}" +
            "#jbi_header_title{" +
              "position: absolute;" +
              "display: inline-block;" +
              "line-height: " + headerConfig["HeightPixels"] + "px;" +
              "color: " + headerConfig["FontColor"] + ";" +
              "font-family: Futura, 'Trebuchet MS', Arial, sans-serif;" +
              "font-size: " + headerConfig["FontSizePixels"] + "px;" +
              "font-weight: bold;" +
              "left: " + headerConfig["TitleXPosition"] + "px;" +
              "top: " + headerConfig["TitleYPosition"] + "px;" +
            "}";

      if (headerConfig.SubTitleEnabled === 'True') {
        s += "#jbi_header_subtitle{" +
          "position: absolute;" +
          "display: inline-block;" +
          "line-height: " + headerConfig.HeightPixels + "px;" +
          "color: " + headerConfig.SubTitleFontColor + ";" +
          "font-family: Futura, 'Trebuchet MS', Arial, sans-serif;" +
          "font-size: " + headerConfig.SubTitleFontSize + ";" +
          "left: " + headerConfig.SubTitleXPosition + "px;" +
          "top: " + headerConfig.SubTitleYPosition + "px;" +
        "}";
      }

      s += "#jbi_header_logo{" +
              "width: " + headerConfig["LogoWidthPixels"] + "px;" +
              "height: " + headerConfig["LogoHeightPixels"] + "px;" +
              "position:absolute;" +
              "top: " + headerConfig["LogoYPosition"] + "px;" +
              "left: " + headerConfig["LogoXPosition"] + "px;";
            s += "display: " + (headerConfig["LogoEnabled"] !== "True") ? "block;" : "none;";
            s += "}" +
            "#jbi_header_reports{" +
              "float: right;" +
              "max-height: 35px;" +
              "box-sizing: border-box;" +
              "overflow: hidden;" +
            "}" +
            ".jbi_header_report{" +
              "display:inline-block;" +
              "width:35px;" +
              "height:35px;" +
              "font-family:" + fontFamily + ";" +
              "text-align: center;" +
              "vertical-align:top;" +
              "border-left: 1px solid lightgrey;" +
              "border-bottom: 1px solid lightgrey;" +
              "box-sizing: border-box;" +
            "}" +
            ".jbi_header_report span{" +
              "opacity: 0.2;" +
            "}" +
            ".jbi_header_report.active span{" +
              "opacity: 1;" +
            "}" +
            ".jbi_header_report.active{" +
              "cursor: pointer;" +
            "}";
          if (!my.isMobile) {
            s += ".jbi_header_report.active:hover{" +
              "background-color: " + headerConfig["PublishedReportLinkBackgroundHoverColor"] + ";" +
              "-webkit-transition: background-color 200ms ease-in-out;" +
              "-moz-transition: background-color 200ms ease-in-out;" +
              "-o-transition: background-color 200ms ease-in-out;" +
              "transition: background-color 200ms ease-in-out;" +
            "}" +
            ".jbi_header_glossary:hover{" +
              "background-color: " + headerConfig["PublishedReportLinkBackgroundHoverColor"] + ";" +
              "-webkit-transition: background-color 200ms ease-in-out;" +
              "-moz-transition: background-color 200ms ease-in-out;" +
              "-o-transition: background-color 200ms ease-in-out;" +
              "transition: background-color 200ms ease-in-out;" +
            "}";
          }
         s+= "#jbi_header_glossary{" +
              "float: right;" +
              "margin-right: 160px;" +
              "max-height: 35px;" +
              "box-sizing: border-box;" +
              "overflow: hidden;" +
            "}";




      // General report link styles
      s += "#jbi_header .jbi_header_icon{";
      s += " width: 42px;";
      s += "}";
      s += "#jbi_header .jbi_header_icon i{";
      s += " line-height: " + headerConfig.HeightPixels + "px;";
      s += " color: #FFFFFF;";
      s += " font-size: 25px;";
      s += "}";
      s += "#jbi_header .jbi_header_button{";
      s += " text-align: center;";
      s += " position: absolute;";
      s += " display: inline-block;";
      s += " border-left: 1px solid lightgrey;";
      s += " border-bottom: 1px solid lightgrey;";
      s += "}";
      s += ".jbi_header_period_filter_active{";
      s += " background-color: #E7EFF3;";
      s += "}";

      // Period filter styles
      s += "#jbi_header_period{";
      s += " position: absolute;";
      s += " max-height:35px;";
      s += " display: inline-block;";
      s += " right: 0;";
      s += " color: " + headerConfig["PeriodFilterFontColor"] + ";";
      s += " font-size: " + headerConfig["PeriodFilterFontSizePixels"] + "px;";
      s += " font-family: " + fontFamily + ";";
      s += " text-align: center;";
      s += " width: 160px;";
      s += " line-height: " + headerConfig["HeightPixels"] + "px;";
      s += " text-transform: uppercase;";
      s += " font-weight: bold;";
      s += " list-style: none;";
      s += " margin: 0;";
      s += " padding: 0;";
      s += " z-index: 99;";
      s += " cursor: pointer;";
      s += " box-sizing: border-box;";
      s += "}";
      if (!my.isMobile) {
        s += "#jbi_header_period:hover{";
        s += " background-color: " + headerConfig["PublishedReportLinkBackgroundHoverColor"] + ";";
        s += " -webkit-transition: background-color 200ms ease-in-out;";
        s += " -moz-transition: background-color 200ms ease-in-out;";
        s += " -o-transition: background-color 200ms ease-in-out;";
        s += " transition: background-color 200ms ease-in-out;";
        s += "}";
      }
      s += "#jbi_header_period_filter_items{";
      s += " display: block;";
      s += " color: " + headerConfig["PeriodFilterItemsFontColor"] + ";";
      s += " font-size: " + headerConfig["PeriodFilterItemsFontSizePixels"] + "px;";
      s += " font-family: " + fontFamily + ";";
      s += " background-color: " + headerConfig["PeriodFilterItemsBackground"] + ";";
      s += " text-align: " + headerConfig["PeriodFilterItemsTextAlign"] + ";";
      s += " width: 160px;";
      s += " line-height: 40px;";
      s += " text-transform: uppercase;";
      s += " font-weight: bold;";
      s += " list-style: none;";
      s += " margin: 0;";
      s += " margin-top: -1px;";
      s += " padding: 0;";
      s += " box-sizing: border-box;";
      s += " border: 1px solid lightgrey;";
      s += " max-height:300px;";
      s += " overflow-y:auto;";
      s += " display:none;";
      s += "}";
      s += ".jbi_header_filter_value{";
      s += " border-bottom: 1px solid #D7D7D7;";
      s += " border-left: 1px solid #D7D7D7;";
      s += " line-height: 38px;";
      s += " background-color: white;";
      s += " padding: 0 5px 0 5px;";
      s += "}";
      if (!my.isMobile) {
        s += ".jbi_header_filter_value:hover{";
        s += " background-color: #F2F2F2;";
        s += "}"
      }
      s += "</style>";
//@formatter:on

        // Add the CSS to the head of the HTML page
        $(s).appendTo("head");
      }


      /**
       * addHTML
       *
       * Add the HTML for the header page
       */
      function addHTML(headerConfig) {
        // get the periods for the filters
        var $body = $("body"),
          periods = $body.data("customPeriods"),
          i;

//@formatter:off
      var s = "<div id='jbi_header_title'>" + headerConfig["Title"] + "</div>";

      if (headerConfig.SubTitleEnabled === 'True') {
        s += "<div id='jbi_header_subtitle'>" + (headerConfig.SubTitleContent || '') + "</div>";
      }

      s += "<img id='jbi_header_logo' src='" + shell.app.execdblp.dashboard._getLogoBase64() + "'>"


      // Glossary button
      + "<div id='jbi_header_glossary'>" +
          "<div class='jbi_header_report active' title='Glossary' data-jbiid='glossary'><img style='margin-top:5px;' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4yMfEgaZUAAAKcSURBVFhHzZg9rzFRFIUVCgWhUIgoFBIKlRAKhZJEoVBohEKhVGp8JAqlwg8gIVH6ieeddZNJ5uy95uMO980UT+Qse629Y8zHmZQxJtFQMUlQMUlQMQ7v99vcbjeDT/ndJ1AxCuv12hSLRSch5Qu+X61WTjnPiAIV/Xg8HqbX66lBotButw38MjMMKjIWi4VqGgfkyOwgqCipVCqqkUuz2XRKtKfRaNB6gDxZ7wcVXfCHT6fTqoGXwWDglGovdFbvgtwoJxQVXer1ugqWxB0QIF/6JFQEo9FIBTI+GRCgj/R6oSIuDSyMUavVHIvOqFartJ4RdCmiYiaTUSF/CfrJGVyUsNlsVMD/AH3lLEAJ2WxWmRnD4dAsl0vKbDYLPfsl6CtnAdbicrkoI6NUKjnldpCk3+9TbxDX69Wx2jnWYj6fKxOjUCg45XaQJOpZ7AX9ZY61iBr6VwOyS5a1CHs6cYlyiOMMyHLthTAEMR6Pf06I8/nsWO1QEGdAIHPshSiOAjss4E8GLJfLyhDGNwdEf5ljLbrdrjKF8c0B0V/mWIvpdKpMYXxzQPSXOdZiu90qUxjfHBD9ZY61ALlcThmD+NaA6CszgBJwj2UBElxesM2Ufi/4/ng8Ur8EfaUfKOH5fCqzJMqdxAvqWY4X9JU+oASAjRALccHDqPQEIf0Sv40XoCII2o988xcM25dQEbxeLxXmgnu2rA9C+r2gj6z3QkUXvN5goQCHBWdqGEH7Y+TLnhIqetnv9yafz6vwT8AhR67sxaCi5H6/m1arpRrFATnIkz38oKIfeMT67V7DBb7JZOLE8Gw/qBjG4XAwnU5HDcHAL7bb7RwbzwqDir8Br9ROp9PPwytOCnxiHedVG4OKSYKKSYKKycGk/gFklHOJdFd2YAAAAABJRU5ErkJggg==' width='25px' height='25px' /></div>" +
        "</div>"

      // Reports
      + "<div id='jbi_header_reports'></div>"

     // Period filter
       + "<ul id='jbi_header_period' class='jbi_header_button'>"
         + "<li id='jbi_header_period_filter'>"
          + "<span> </span>"
          + "<ul id='jbi_header_period_filter_items'>";
          for (i = 0; i < periods.length; i++) {

            // show the version and the status in case they are provided.
            if (periods[i].version && periods[i].status) {
              var statusText = "",
                statusTextStyle = 'color:#505050;font-weight:bold;';
              if (periods[i].status === "10") {
                statusText = " (DRAFT)";
                statusTextStyle = "color:red;font-weight:normal;";
              } else if (periods[i].status === "20") {
                statusText = " (INACTIVE)";
                statusTextStyle = "color:red;font-weight:normal;"
              }

              s += "<li";
                s += " data-version='" + periods[i].version + "'";
                s += " data-status='" + periods[i].status + "'";
                s += " data-filterkey='" + periods[i].id + "'";
                s += " data-filtertext='" + periods[i].name + "'";
                s += " style='text-align:left;padding:10px 5px;line-height:normal;box-sizing:border-box;'";
                s += " class='" + ((i === 0) ? "jbi_header_period_filter_active" : "") + "'";
                s += ">";
                  s += "<span>" + periods[i].name + "</span>";
                  s += "<div style='block;font-size:9px;text-transform:initial;font-weight:normal;" + statusTextStyle + "'>Version: " + periods[i].version + statusText + "</div>";
              s += "</li>";
            } else {
              s += "<li data-filterkey='" + periods[i].id + "' data-filtertext='" + periods[i].name + "' class='" + ((i === 0) ? "jbi_header_period_filter_active" : "") + "'>";
                s += "<span>" + periods[i].name + "</span>";
              s += "</li>";
            }
          }
          s += "</ul>"
           + "</li>"
         + "</ul>";
//@formatter:on
        $("#jbi_header").html(s);


        // set the initial selected value
        var initalSelectedText = $("#jbi_header_period_filter_items .jbi_header_period_filter_active").data("filtertext");
        $("#jbi_header_period_filter > span").html(initalSelectedText + " <svg style='position:relative;right:3px;top:8px;float:right;' class='filter_click_down_icon' width='12px' height='12px' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'><path d='M1408 704q0 26-19 45l-448 448q-19 19-45 19t-45-19l-448-448q-19-19-19-45t19-45 45-19h896q26 0 45 19t19 45z'></path></svg>");
      }


      function addEventlisteners() {

        // period filter click (to open the filter values)
        var $jbi_header_period = $("#jbi_header_period");
        $jbi_header_period.unbind(my.eventTrigger);
        $jbi_header_period.on(my.eventTrigger, function () {
          $('#jbi_header_period_filter_items').fadeToggle(300);
        });


        // period click (to select a period)
        var $periodItemButton = $("#jbi_header_period ul li");
        $periodItemButton.unbind(my.eventTrigger);
        $periodItemButton.on(my.eventTrigger, function () {

          // get the selected item
          var filterText = $(this).data("filtertext"),
            filterKey = $(this).data("filterkey"),
            versionNumber = $(this).data("version");
          $("#jbi_header_period_filter > span").html(filterText + " <svg style='position:relative;right:3px;top:10px;float:right;' class='filter_click_down_icon' width='12px' height='12px' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'><path d='M1408 704q0 26-19 45l-448 448q-19 19-45 19t-45-19l-448-448q-19-19-19-45t19-45 45-19h896q26 0 45 19t19 45z'></path></svg>");

          // add the class 'jbi_header_period_filter_active' to the selected item
          $("#jbi_header_period_filter_items li").removeClass("jbi_header_period_filter_active");
          $(this).addClass("jbi_header_period_filter_active");
          $("body").trigger("periodUpdate", [filterKey, versionNumber]);
        });

        var $glossary = $("#jbi_header_glossary");
        $glossary.unbind(my.eventTrigger);
        $glossary.on(my.eventTrigger, function () {
          window.location.href = "glossary.html";
        });
      }

      //Helper function
      /**
       * Read the header configuration
       * @returns {object} Header configuration object
       */
      function getConfig() {
        return {
          "Title": "MI LAUNCHPAD",
          "BackgroundColor": "white",
          "HeightPixels": 35,
          "FontColor": "#dd1d21",
          "FontSizePixels": 14,
          "TitleYPosition": 0,
          "TitleXPosition": 70,
          "LogoEnabled": "True",
          "LogoWidthPixels": 50,
          "LogoHeightPixels": 50,
          "LogoYPosition": 0,
          "LogoXPosition": 4,
          "PeriodFilterFontColor": "#505050",
          "PeriodFilterFontSizePixels": 12,
          "PeriodFilterItemsFontColor": "#505050",
          "PeriodFilterItemsFontSizePixels": 12,
          "PeriodFilterItemsBackground": "white",
          "PeriodFilterItemsTextAlign": "center",
          "UnpublishedReportLinkFontColor": "lightgrey",
          "UnpublishedReportLinkBackground": "white",
          "PublishedReportLinkFontColor": "#505050",
          "PublishedReportLinkBackground": "white",
          "PublishedReportLinkBackgroundHoverColor": "#EFEFEF",
          "GlossaryIcon": "<svg style=\"width:25px;height:25px;padding-top:5px;\" width=\"1792\" height=\"1792\" viewBox=\"0 0 1792 1792\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M1152 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zm-128-896v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zm640 416q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z\"/></svg>"
        }
      }
    };


    return my;

  }(shell.app.execdblp.dashboard)
);

//####src/execdblpig/dashboard/mod_logo.js
shell.app.execdblp.dashboard = ( function (my) {

  /**
   * Handle the periods
   * @private
   */
  my._getLogoBase64 = function () {
    return "data:image/png;base64,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";
  };

  return my;

}(shell.app.execdblp.dashboard));

//####src/execdblpig/dashboard/mod_period.js
shell.app.execdblp.dashboard = ( function (my) {


  /**
   * Converts a month short name to a number (Jan --> 1)
   * @param periodShortName {string} the short name of the month
   * @returns {string} the number of the month. Or (in case the input string was not valid, -1)
     */
  function periodShortNameToNumber(periodShortName) {
    var periodShortNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
      periodShortNamesIndex = periodShortNames.indexOf(periodShortName);
    if (periodShortNamesIndex > -1) {
      var periodNumber = "000" + (periodShortNamesIndex + 1);
      return periodNumber.substring(periodNumber.length - 3);
    }
    return "000";
  }


  function periodNumberToShortName(periodNumber) {
    var periodNumbers = ["001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011", "012"],
      periodShortNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    var periodIndex = periodNumbers.indexOf(periodNumber);
    if (periodIndex > -1) {
      return periodShortNames[periodIndex];
    }
    return null;
  }


  function periodNumberToFullName(periodNumber) {
    var periodNumbers = ["001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011", "012"],
      periodShortNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    var periodIndex = periodNumbers.indexOf(periodNumber);
    if (periodIndex > -1) {
      return periodShortNames[periodIndex];
    }
    return null;
  }


  /**
   * Converts a month short name to a full name
   * @param periodShortName {string} the short name of the month
   * @returns {string} the full name of the month
     */
  function periodShortNameToFullName(periodShortName) {
    var periodShortNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
      periodFullNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      periodShortNamesIndex = periodShortNames.indexOf(periodShortName);
    if (periodShortNamesIndex > -1) {
      return (periodFullNames[periodShortNamesIndex]);
    }
    return "";
  }


  /**
   * Either accepts a single period identifier or an array of them. It does a
   * lookup of the name of the periodIdentifiers. If none can be found, it returns
   * the identifier
   * @param periodIdentifier {string || array} holding the identifiers
   * @param fixedPeriods {object=} Optional parameter holding the periods. If not
   *                               provided, the periods are read from the body data
   * @returns {string || array} the header labels
     */
  function getPeriodIdentifierLabel(periodIdentifier, fixedPeriods) {
    var customData = $("body").data("customDataApp"),
      periods = fixedPeriods || customData.periods,
      returnObject;

    // in case an array is provided, get the header labels for each item
    if (Object.prototype.toString.call(periodIdentifier) === '[object Array]') {
      returnObject = [];
      for (var i=0; i<periodIdentifier.length; i++) {
        returnObject.push( (periods[periodIdentifier[i]] || periodIdentifier[i]) );
      }
      return returnObject;
    }

    return (periods[periodIdentifier] || periodIdentifier);
  }


  /**
   * Gets information about the current period
   * @param periods {object=} Optional parameter holding the periods. If not
   *                          provided, the periods are read from the body data
   * @returns {object} Names for the current period
     */
  function getCurrentPeriod(periods) {

    var periodIdentifier = "CM CY",
      selectedPeriod = $(".jbi_header_period_filter_active").data(),
      selectedPeriodSplit;

    if (selectedPeriod) {
      selectedPeriodSplit = selectedPeriod["filterkey"].toString().split(".");

      return {
        periodIdentifier: periodIdentifier,
        currentPeriod: periodNumberToShortName(selectedPeriodSplit[0]) + " " + selectedPeriodSplit[1],
        periodNumber: selectedPeriodSplit[0],
        periodShortName : periodNumberToShortName(selectedPeriodSplit[0]),
        periodFullName : periodNumberToFullName(selectedPeriodSplit[0]),
        year : selectedPeriodSplit[1]
      };
    } else {

      var periodSplit,
        currentPeriod = getPeriodIdentifierLabel(periodIdentifier, periods);

      // check if a valid name is found
      if (currentPeriod === periodIdentifier) {
        return null;
      }

      // a valid period contains of 2 items in the split period eg [001, 2010]
      periodSplit = currentPeriod.split(" ");
      if (!periodSplit.length || periodSplit.length !== 2) {
        return null;
      }

      // create the period object
      return {
        periodIdentifier: periodIdentifier,
        currentPeriod: currentPeriod,
        periodNumber: periodShortNameToNumber(periodSplit[0]),
        periodShortName : periodSplit[0],
        periodFullName : periodShortNameToFullName(periodSplit[0]),
        year : periodSplit[1]
      };
    }

    // create the period object
    return {
      periodIdentifier: periodIdentifier,
      currentPeriod: periodNumberToShortName(selectedPeriodSplit[0]) + " " + selectedPeriodSplit[1],
      periodNumber: selectedPeriodSplit[0],
      periodShortName : periodNumberToShortName(selectedPeriodSplit[0]),
      periodFullName : periodNumberToFullName(selectedPeriodSplit[0]),
      year : selectedPeriodSplit[1]
    };
  }

  /**
   * Expose the period functions to the application
   */
  my.period_functions = {
    getCurrentPeriod : getCurrentPeriod,
    getPeriodIdentifierLabel: getPeriodIdentifierLabel
  };

  return my;

}(shell.app.execdblp.dashboard));

//####src/execdblpig/dashboard/mod_reports.js
shell.app.execdblp.dashboard = (function (my) {
  my._buildReports = function () {
    var reportConfig = getConfig();

    addHeaderReports(reportConfig);
    addTileReports(reportConfig);
    addEventListeners();

    $('body').on('hierarchyFilterSelectionChanged', function () {
      addTileReports(reportConfig);
      addEventListeners();
    });

    function addHeaderReports(reportConfig) {
      var $headerReports = $("#jbi_header_reports")
        .empty();

      reportConfig.reports
        .filter(function (report) {
          return report.location.toLowerCase() === 'header';
        })
        .map(function (report) {
          return (
            $("<div>")
              .addClass('jbi_header_report')
              .addClass('jbi_report')
              .attr('title', report.name)
              .attr('data-reportview', report.view)
              .attr('data-reportid', report.id)
              .append(report.icon)
              .appendTo($headerReports)
          );
        });
    }

    function addTileReports(reportConfig) {
      var selectedBusinessId = $('.jbi_summary_filter_active').data('filterkey');
      var getReportDataByKpi = getReportDataByBusiness(selectedBusinessId);


      $("#jbi_reports")
        .empty()
        .append(
          $("<ul>")
            .attr('id', 'jbi_reports_items')
            .addClass('jbi_reports_items')
            .appendTo('#jbi_reports')
        );


      //var s = '';
      //s += "<ul class='jbi_reports_items'>";
      reportConfig.reports
        .filter(function (report) {
          return report.location.toLowerCase() === 'tile';
        })
        .forEach(function (report) {

          // get the data
          var kpiData, monthlyActual, monthlyPlan, ytdActual, ytdPlan;
          if (report.data) {
            kpiData = getReportDataByKpi(report.data);
            monthlyActual = (kpiData['CM CY']) || '';
            monthlyPlan = kpiData['CM CY Plan'] || '';
            ytdActual = kpiData['YTD CY'] || '';
            ytdPlan = kpiData['YTD CY Plan'] || '';
          }

          var noDataAvailable = (monthlyActual === '' && monthlyPlan === '' && ytdActual === '' && ytdPlan === '');


          // add the report icon and text
          var $reportItem = $("<li>").append(
            $("<div>")
              .addClass("jbi_reports_item")
              .addClass('jbi_report')
              .attr('data-reportview', report.view)
              .attr('data-reportid', report.id)
              .append(
                $("<div>")
                  .addClass('jbi_reports_name')
                  .text(report.name)
              )
              .append(
                $("<div>")
                  .addClass('jbi_reports_icon')
                  .append(report.icon)
              )
            )
            .appendTo("#jbi_reports_items");

          // if there is no data, show a message
          // else show a table containing the data
          if (noDataAvailable) {
            $reportItem.find(".jbi_report").append(
              $("<div>")
                .addClass('jbi_reports_nodata_table')
                .append(
                  $("<div>")
                    .addClass('jbi_reports_nodata_div')
                    .text('No data available.')
                )
            )
          }
          else if (report.data) {

            // calculate the deltas
            var positive = report.high_values_good ? 'green' : 'red';
            var negative = report.high_values_good ? 'red' : 'green';
            var monthlyDelta =
              monthlyActual !== '' && monthlyPlan !== ''
                ? monthlyActual - monthlyPlan
                : '';
            var monthlyDeltaColor = monthlyDelta >= 0 ? positive : negative;
            var ytdDelta =
              ytdActual !== '' && ytdPlan !== '' ? ytdActual - ytdPlan : '';
            var ytdDeltaColor = ytdDelta >= 0 ? positive : negative;

            // format the numbers (add thousand separator)
            monthlyActual = (monthlyActual !== '') ? my._formatNumber("#,##0.", monthlyActual) : "";
            monthlyPlan = (monthlyPlan !== '') ? my._formatNumber("#,##0.", monthlyPlan) : "";
            monthlyDelta = (monthlyDelta !== '') ? my._formatNumber("#,##0.", monthlyDelta) : "";
            ytdActual = (ytdActual !== '') ? my._formatNumber("#,##0.", ytdActual) : "";
            ytdPlan = (ytdPlan !== '') ? my._formatNumber("#,##0.", ytdPlan) : "";
            ytdDelta = (ytdDelta !== '') ? my._formatNumber("#,##0.", ytdDelta) : "";


            $reportItem.find(".jbi_report").append(
              $("<table>")
                .addClass('jbi_reports_data_table')
                .append(
                  $("<thead>")
                    .append(
                      $("<tr>")
                        .addClass('jbi_reports_table_background')
                        .append(
                          $('<th>')
                            .addClass('jbi_text_left')
                            .text(report.unit || '')
                        )
                        .append(
                          $('<th>')
                            .addClass('jbi_text_right')
                            .text('Actual')
                        )
                        .append(
                          $('<th>')
                            .addClass('jbi_text_right')
                            .text('Plan')
                        )
                        .append(
                          $('<th>')
                            .addClass('jbi_text_right')
                            .text('Delta')
                        )
                    )
                    .append(
                      $("<tr>")
                        .append(
                          $('<td>')
                            .addClass('jbi_text_left')
                            .text("Month")
                        )
                        .append(
                          $('<td>')
                            .addClass('jbi_text_right')
                            .text(monthlyActual)
                        )
                        .append(
                          $('<td>')
                            .addClass('jbi_text_right')
                            .text(monthlyPlan)
                        )
                        .append(
                          $('<td>')
                            .addClass('jbi_text_right')
                            .text(monthlyDelta)
                            .attr('style', 'color:' + monthlyDeltaColor)
                        )
                    )
                    .append(
                      $("<tr>")
                        .append(
                          $('<td>')
                            .addClass('jbi_text_left')
                            .addClass('jbi_tablerow_border_top')
                            .text("YTD")
                        )
                        .append(
                          $('<td>')
                            .addClass('jbi_text_right')
                            .addClass('jbi_tablerow_border_top')
                            .text(ytdActual)
                        )
                        .append(
                          $('<td>')
                            .addClass('jbi_text_right')
                            .addClass('jbi_tablerow_border_top')
                            .text(ytdPlan)
                        )
                        .append(
                          $('<td>')
                            .addClass('jbi_text_right')
                            .addClass('jbi_tablerow_border_top')
                            .text(ytdDelta)
                            .attr('style', 'color:' + ytdDeltaColor)
                        )
                    )
                )
            );
          }
        });


      // broadcast an event about the reports being displayed
      // depending on the type of report, the active class can be applied or not
      $('body').trigger('reportsUpdated');

      function getReportDataByBusiness(businessId) {
        var customDataApp = $('body').data('customDataApp');

        var businessData =
          customDataApp &&
          customDataApp.datasets &&
          customDataApp.datasets[businessId]
            ? customDataApp.datasets[businessId]
            : null;

        return function (kpiId) {
          return businessData && businessData.kpis && businessData.kpis[kpiId]
            ? businessData.kpis[kpiId].data
            : {};
        };
      }
    }

    function addEventListeners() {
      addReportClickHandler();

      /**
       * Depending on the source of the report, make sure that the
       * correct handler for the reports is being exectuted.
       */
      function addReportClickHandler() {
        // trigger an openReport event. Each source of the report
        // will have its own handler
        var $body = $('body');
        var $jbiReport = $('.jbi_report');
        $jbiReport.unbind(my.eventTrigger);
        $jbiReport.on(my.eventTrigger, function () {

          // only proceed if the report is available
          if (!$(this).hasClass("active")) {
            return;
          }

          var currentPeriod = my.period_functions.getCurrentPeriod();
          var period = currentPeriod.periodNumber + '.' + currentPeriod.year;
          var view = $(this).data('reportview') || {};
          var reportId = $(this).data('reportid') || '';
          var businessId =
            $('.jbi_summary_filter_value.jbi_summary_filter_active').data(
              'filterkey'
            ) || $body.data('customAppFilters').businessElement;

          $body.trigger('openReport', {
            view: view,
            period: period,
            dashboardParams: $.extend(
              {
                period: period,
                dashboard: reportId,
                businessId: businessId
              },
              view
            )
          });
        });
      }
    }

    // HELPER FUNCTIONS

    /**
     * Get the reports specific configuration
     * @returns {{general: null, reports: Array}}
     */
    function getConfig() {
      var customConfig = $('body').data('customConfig');
      return {
        general: customConfig && customConfig['CONFIG']
          ? customConfig['CONFIG']['report']
          : null,
        reports: customConfig && customConfig['REPORTS'] ? customConfig['REPORTS'] : []
      };
    }
  };

  return my;
})(shell.app.execdblp.dashboard);

//####src/execdblpig/dashboard/mod_skeleton.js
shell.app.execdblp.dashboard = ( function (my) {

  my._buildSkeleton = function (elementId) {

    // Set the application CSS and HTML
    my._applyStyles();
    setHTML();

    /**
     * HTML
     * Add the framework specific HTML
     **/
    function setHTML( ){
      var s = "";
//@formatter:off
      s += "<div id='jbi_container'>"
           + "<div id='jbi_app'>"
             + "<div id='jbi_header'></div>"
             + "<div id='jbi_summary'></div>"
             + "<div id='jbi_reports'></div>"
             + "<div id='jbi_trend'></div>"
           + "</div>"
         + "</div>";
//@formatter:on
      // add the HTML placeholders to the component
      $("#" + elementId).html(s);
    }

  };

  return my;

}(shell.app.execdblp.dashboard));

//####src/execdblpig/dashboard/mod_specific_logic.js
shell.app.execdblp.dashboard = ( function (my) {

  my._specific = {

    charts: {

      /**
       * MI LaunchPad - Stacked bar tooltip & data label
       *
       * @param chartConfig
       */
      birdy_stack: function(chartConfig) {

        // add the specific Birdy Stacked logic
        // tooltip formatter
        chartConfig.tooltip = chartConfig.tooltip || {};
        chartConfig.tooltip.formatter = function () {
          return '<b>' + this.x + '</b>' + '<br/>' + this.series.name + ': ' + (chartConfig["custom"]["uom_prefix"] ? chartConfig["custom"]["uom_prefix"] : "") + Highcharts.numberFormat(this.y, 0) + (chartConfig["custom"]["uom_suffix"] ? chartConfig["custom"]["uom_suffix"] : "") + ( (chartConfig && chartConfig.custom && chartConfig.custom.periodText) ? '<br>' + chartConfig.custom.periodText : "");
        };

        // stacklabels formatter
        chartConfig.yAxis = chartConfig.yAxis || {};
        chartConfig.yAxis.stackLabels = chartConfig.yAxis.stackLabels || {};
        chartConfig.yAxis.stackLabels.formatter = function () {

          var stackItem = this,
            allStacks = stackItem.axis.stacks;

          for (var key in allStacks) {
            if (allStacks.hasOwnProperty(key)) {
              if (allStacks[key][stackItem.x] == stackItem) {
                var oppositeKey = stackItem.isNegative ? key.slice(1) : '-' + key,
                  oppositeItem = allStacks[oppositeKey] && allStacks[oppositeKey][stackItem.x];

                if (oppositeItem === undefined) {
                  if (stackItem.total && stackItem.total !== 0.0) {
                    return (chartConfig["custom"]["uom_prefix"] ? chartConfig["custom"]["uom_prefix"] : "") + Highcharts.numberFormat(stackItem.total, 0) + (chartConfig["custom"]["uom_suffix"] ? chartConfig["custom"]["uom_suffix"] : "");
                  }
                } else {
                  var sum = stackItem.total + oppositeItem.total;
                  if (stackItem.isNegative ^ sum > 0) {
                    return (chartConfig["custom"]["uom_prefix"] ? chartConfig["custom"]["uom_prefix"] : "") + Highcharts.numberFormat(sum, 0) + (chartConfig["custom"]["uom_suffix"] ? chartConfig["custom"]["uom_suffix"] : "");
                  }
                }
              }
            }
          }
        };

        return chartConfig;
      }
    }

  };


  return my;

}(shell.app.execdblp.dashboard));

//####src/execdblpig/dashboard/mod_styles.js
shell.app.execdblp.dashboard = ( function (my) {

  my._applyStyles = function () {

    // remove the 'old' style
    $("#CSS_JBI_SKELETON").remove();
    $("[data-group='LAYOUT']").remove();


    var configStyle = getConfigStyle(),
      summaryConfig = (configStyle && configStyle["summary"]) ? configStyle["summary"] : {},
      trendConfig = (configStyle && configStyle["trend"]) ? configStyle["trend"] : {},
      reportConfig = (configStyle && configStyle["report"]) ? configStyle["report"] : {};

    var filtersWidthPixels = (summaryConfig["FiltersWidthPixels"] === undefined)
      ? '260'
      : summaryConfig["FiltersWidthPixels"];

    var fontFamily = (configStyle && configStyle["dashboard"] && configStyle["dashboard"]["FontFamily"]) || "Verdana";

    var s = "";
//@formatter:off
    s += "<style type='text/css' id='CSS_JBI_SKELETON' data-repstyle='execdblp'>"
      + "svg{"
      + "overflow:visible !important;"
      + "}"
      + ".highcharts-container{"
      + "overflow:visible !important;"
      + "position: inherit !important;"
      + "}"
      + ".highcharts-stack-labels>text {"
      + "visibility: visible!important;"
      + "}"
      + ".highcharts-container>svg{"
      + "position: absolute;"
      + "}"
      + ".highcharts-tooltip {"
      + "z-index: 9998;"
      + "}"
      + "#jbi_container{"
      + "position: fixed;"
      + "top: 0;"
      + "left: 0;"
      + "right: 0;"
      + "height: 100%;"
      + "background-color : white;"
      + "overflow: auto;"
      + "}"
      + "#jbi_app{"
      + "margin-left: auto;"
      + "margin-right: auto;"
      + "max-width: 1200px;"
      + "min-width: 400px;"
      + "position: relative;"
      + "display: block;"
      + "min-height: 100px;"
      + "height: 100%;"
      + "top: 0;"
      + "left: 0;"
      + "right: 0;"
      + "border-left : 1px solid #e5e5e5;"
      + "border-right : 1px solid #e5e5e5;"
      + "z-index: 12000;"
      + "}"

        // Static summary section
      + "#jbi_summary{"
      + "position: absolute;"
      + "display: block;"
      + "left: 0;"
      + "right: 0;"
      + "top: 0;"
      + "pointer-events: none;"
      + "}";

    s += "#jbi_summary_filter{"
      + "position: relative;"
      + "display: block;"
      + "left: 0;"
      + "right: 0;"
      + "height:" + summaryConfig["FiltersHeightPixels"] + "px;"
      + "background-color: white;"
      + "}"
      + "#jbi_summary_filter_business{"
      + "margin-left: auto;"
      + "margin-right: auto;"
      + "line-height: 34px;"
      + "text-align: center;"
      + "font-family: " + fontFamily + ";"
      + "font-weight: bold;"
      + "font-size: 12px;"
      + "color: #4A4A4A;"
      + "width: " + filtersWidthPixels + "px;"
      + "border: 1px solid lightgrey !important;"
      + "border-top: 0 !important;"
      + "white-space: nowrap;"
      + "box-sizing: border-box;"
      + "pointer-events: initial;"
      + "}";

    if (!my.isMobile) {
      s += "#jbi_summary_filter_business:hover{"
        + "background-color: #EFEFEF;"
        + "-webkit-transition: background-color 200ms ease-in-out;"
        + "-moz-transition: background-color 200ms ease-in-out;"
        + "-o-transition: background-color 200ms ease-in-out;"
        + "transition: background-color 200ms ease-in-out;"
        + "}";
    }


    if (my.isMobile) {
      s += "body {"
    } else {
      s += ".noselect {"
    }
    s += "-webkit-touch-callout: none;"
      + "-webkit-user-select: none;"
      + "-khtml-user-select: none;"
      + "-moz-user-select: none;"
      + "-ms-user-select: none;"
      + "user-select: none;"
      + "}"

      + "#jbi_summary_kpi{"
      + "position: relative;"
      + "display: block;"
      + "height: " + summaryConfig["KpiHeightPixels"] + "px;"
      + "left: 0;"
      + "right: 0;"
      + "font-size: 0px;"
      + "}"
      + "#jbi_summary_kpi .jbi_summary_kpi{"
      + "position: relative;"
      + "width: 25%;"
      + "height:" + summaryConfig["KpiHeightPixels"] + "px;"
      + "display: inline-block;"
      + "}"
      + ".jbi_summary_kpi_item{"
      + "position: absolute;"
      + "top: 0;"
      + "bottom: 0;"
      + "left: 0;"
      + "right: 0;"
      + "border-top: 1px solid #e5e5e5;"
      + "border-bottom: 1px solid #e5e5e5;"
      + "}"
      + "#jbi_summary_chart{"
      + "position: relative;"
      + "display: block;"
      + "height: " + summaryConfig["ChartHeightPixels"] + "px;"
      + "left: 0;"
      + "right: 0;"
      + "font-size: 0px;"
      + "}"
      + ".jbi_summary_kpi_item {"
      + "border-left: 1px solid #e5e5e5;"
      + "}"
      + "#jbi_summary_chart .jbi_summary_chart{"
      + "position: relative;"
      + "width: 25%;"
      + "height:" + summaryConfig["ChartHeightPixels"] + "px;"
      + "display: inline-block;"
      + "}"
      + "#jbi_summary_chart .jbi_summary_chart_item{"
      + "position: absolute;"
      + "top: 0;"
      + "bottom: 0;"
      + "left: 0;"
      + "right: 0;"
      + "}"
      + "#jbi_summary_chart_2Content,"
      + "#jbi_summary_chart_3Content,"
      + "#jbi_summary_chart_4Content{"
      + "border-left: 1px solid #e5e5e5;"
      + "box-sizing: border-box;"
      + "}"
      + "#jbi_summary_legend{"
      + "position: relative;"
      + "display: block;"
      + "height: " + ( summaryConfig["LegendHeightPixels"] + 30 ) + "px;";
    if (my.isMobile) {
      s += "margin-top: -8px;"
    }
    s += "width:100%;"
      + "font-size: 0px;"
      + "border-bottom: 1px solid #e5e5e5;"
      + "}"
      + ".jbi_summary_legend_item{"
      + "box-sizing:border-box;"
      + "background-color:#f4f4f4;"
      + "height:100%;"
      + "}"
      + ".jbi_summary_legend_item:not(:first-child){"
      + "border-left:1px solid lightgrey;"
      + "}"
      + "#jbi_summary_kpi .jbi_summary_kpi_title{"
      + "font-family: " + fontFamily + ";"
      + "font-size: 12px;"
      + "line-height: " + summaryConfig["KpiHeightPixels"] + "px;"
      + "color: #505050;"
      + "text-transform: uppercase;"
      + "display: inline-block;"
      + "position: absolute;"
      + "left: 5px;"
      + "right: 0;"
      + "top: 0;"
      + "bottom: 0;"
      + "}"
      + "#jbi_summary_kpi .jbi_summary_kpi_value{"
      + "display: inline-block;"
      + "position: absolute;"
      + "top: 0;"
      + "bottom: 0;"
      + "right: 5px;"
      + "font-size: 12px;"
      + "font-family: " + fontFamily + ";"
      + "line-height: " + summaryConfig["KpiHeightPixels"] + "px;"
      + "background-color: white;"
      + "}"
      + "#jbi_summary_kpi .jbi_summary_kpi_value i{"
      + "font-weight: normal;"
      + "line-height: " + summaryConfig["KpiHeightPixels"] + "px;"
      + "}"
      + "#jbi_summary_kpi .jbi_summary_kpi_value span{"
      + "line-height: " + summaryConfig["KpiHeightPixels"] + "px;"
      + "vertical-align: top;"
      + "}"
      + "#jbi_summary_kpi .jbi_summary_kpi_value_negative{"
      + "color: #1491B8;"
      + "}"
      + "#jbi_summary_kpi .jbi_summary_kpi_value_negative i{"
      + "transform: rotate(135deg);"
      + "}"
      + "#jbi_summary_filters{"
      + "display: block;"
      + "color: white;"
      + "font-size: 12px;"
      + "font-family: " + fontFamily + ";"
      + "text-align: center;"
      + "width: " + filtersWidthPixels + "px;"
      + "line-height: " + summaryConfig["FiltersHeightPixels"] + "px;"
      + "text-transform: uppercase;"
      + "list-style: none;"
      + "margin: 0;"
      + "padding: 0;"
      + "z-index: 99;"
      + "margin-left: auto;"
      + "margin-right: auto;"
      + "cursor: pointer;"
      + "}";
    if (!my.isMobile) {
      s += "#jbi_summary_filters:hover{"
        + "background-color: " + summaryConfig["BackgroundFilterHoverColor"] + ";"
        + "-webkit-transition: background-color 200ms ease-in-out;"
        + "-moz-transition: background-color 200ms ease-in-out;"
        + "-o-transition: background-color 200ms ease-in-out;"
        + "transition: background-color 200ms ease-in-out;"
        + "}"
        + ".jbi_summary_filter_value:hover{"
        + "background-color: #628593;"
        + "-webkit-transition: background-color 200ms ease-in-out;"
        + "-moz-transition: background-color 200ms ease-in-out;"
        + "-o-transition: background-color 200ms ease-in-out;"
        + "transition: background-color 200ms ease-in-out;"
        + "}"
        + "#jbi_summary_filter_business_items li:hover{"
        + "background-color: " + summaryConfig["BackgroundFilterHoverColor"] + ";"
        + "-webkit-transition: background-color 200ms ease-in-out;"
        + "-moz-transition: background-color 200ms ease-in-out;"
        + "-o-transition: background-color 200ms ease-in-out;"
        + "transition: background-color 200ms ease-in-out;"
        + "}";
    }
    s += "#jbi_summary_filter_business_items{"
      + "display: none;"
      + "color: #505050;;"
      + "font-size: 12px;"
      + "box-sizing: border-box;"
      + "font-family: " + fontFamily + ";"
      + "background-color: white;"
      + "text-align: left;"
      + "width: " + filtersWidthPixels + "px;"
      + "line-height: " + summaryConfig["FiltersHeightPixels"] + "px;"
      + "text-transform: uppercase;"
      + "font-weight: bold;"
      + "list-style: none;"
      + "margin: 0;"
      + "margin-left: -1px;"
      + "padding: 0;"
      + "position: absolute;"
      + "z-index: 99;"
      + "border: 1px solid lightgrey;"
      + "}"
      + ".jbi_summary_filter_value{"
      + "padding-left: 5px;"
      + "line-height: 40px;"
      + "background-color: white;"
      + "}"
      + ".jbi_summary_filter_active{"
      + "background-color: #E7EFF3;"
      + "}"
      + ".jbi_summary_kpi_trend_icon{"
      + "width:24px;"
      + "margin-top:-2px;"
      + "padding-right:4px;"
      + "vertical-align:middle;"
      + "}"
      + ".jbi_summary_kpi_value span.jbi_summary_tooltip {"
      + "display: none;"
      + "position: absolute;"
      + "top: 36px;"
      + "right: -15px;"
      + "padding: 5px;"
      + "z-index: 100;"
      + "background: #ffffff;"
      + "color: #555555;"
      + "border: 1px solid #8f8f8f;"
      + "box-shadow: 1px 1px 1px #888888;"
      + "border-radius: 5px;"
      + "}"
      + ".jbi_summary_kpi_value:hover span.jbi_summary_tooltip {"
      + "display: block;"
      + "}"
      + ".jbi_summary_tooltip:before {"
      + "content: '';"
      + "display: block;"
      + "position: absolute;"
      + "width: 0;"
      + "height: 0;"
      + "right: 38px;"
      + "top: -9px;"
      + "border-left: 6px solid transparent;"
      + "border-right: 6px solid transparent;"
      + "border-bottom: 9px solid #8f8f8f;"
      + "}"
      + ".jbi_summary_tooltip > table {"
      + "font-size: 10px;"
      + "font-weight: normal;"
      + "line-height: 14px;"
      + "width: 100%;"
      + "white-space: nowrap;"
      + "}"
      + ".jbi_summary_tooltip_value{"
      + "text-align: right;"
      + "padding-left: 15px;"
      + "}"

      + ".jbi_summary_chart{"
      + "position: absolute;"
      + "left : 0;"
      + "right : 0;"
      + "top : 0;"
      + "bottom : 5px;"
      + "overflow: hidden;"
      + "}"
      + ".jbi_summary_chart ToggleSeriesButton.ToggleSeriesButton{"
      + "right: 2px;"
      + "bottom: 2px;"
      + "width: 100px;"
      + "height: 20px;"
      + "line-height: 20px;"
      + "position: absolute;"
      + "float: right;"
      + "font-size: 10px;"
      + "font-family: " + fontFamily + ";"
      + "cursor: pointer;"
      + "text-align: center;"
      + "background-color: #EEE;"
      + "color: #666;"
      + "}";
    if (!my.isMobile) {
      s += ".jbi_summary_chart ToggleSeriesButton.ToggleSeriesButton:hover{"
        + "background-color: #D8D8D8;"
        + "}";
    }

    // Static reports section
    s += "#jbi_reports{"
      + "position: relative;"
      + "display:block;"
      + "left: 0;"
      + "right: 0;"
      + "top: " + (reportConfig["TopPixels"] || 0) + "px;"
      + "background-color : white;"
      + "}"
      + "#jbi_reports_published {"
      + "position: relative;"
      + "display: block;"
      + "left: 0;"
      + "right: 0;"
      + "top: 30px;"
      + "background-color: white;"
      + "}"
      + ".jbi_reports_title{"
      + "margin-top: 5px;"
      + "margin-left: 7px;"
      + "font-size: 16px;"
      + "color: #32323A;"
      + "font-family: Futura, 'Trebuchet MS', Arial, sans-serif;"
      + "font-weight: bold;"
      + "text-transform: uppercase;"
      + "}"
      + ".jbi_reports_item table {"
      + "text-transform: initial !important;"
      + "font-weight: normal;"
      + "font-size: 11px;"
      + "font-family: " + fontFamily + ";"
      + "}"
      + ".jbi_reports_item td {"
      + "padding: 5px;"
      + "}"
      + ".jbi_reports_item th {"
      + "padding: 2px 5px 2px 5px;"
      + "}"
      + ".jbi_reports_items{"
      + "list-style: none;"
      + "display: block;"
      + "margin: 0px;"
      + "margin-left: 5px;"
      + "margin-right: 5px;"
      + "padding: 0px;"
      + "}"
      + ".jbi_reports_items li{"
      + "display: inline-block;";

    // if (my.isMobile) {
    //   s += "min-width: 160px;"
    // } else {
      s += "width: 20%;";
    // }
    s += "padding: 0px;"
      + "margin: 0px;"
      + "vertical-align: top;"
      + "}"
      + ".jbi_reports_item{"
      + "position: relative;"
      + "font-size: 15px;"
      + "border: 1px solid #EFEFEF;"
      + "border-radius: 5px;"
      + "color: black;"
      + "font-family: " + fontFamily + ";"
      + "font-weight: normal;"
      + "margin: 5px;"
      + "height: 200px;"
      + "background-color: white;"
      + "}"
      + ".jbi_reports_item.jbi_report.active{"
      + "cursor: pointer;"
      + "}"
        //+ ".jbi_header_report.jbi_report.online{"
        //  + "background-color: #00576d;"
        //  + "border: 1px solid #0090B6;"
        //  + "color: white;"
        //  + "opacity: 1!important;"
        //  + "cursor: pointer;"
        //+ "}"
      + ".jbi_header_report.jbi_report.online span{"
      + "opacity: 1!important;"
      + "}";

    if (!my.isMobile) {
      s += ".jbi_reports_item.jbi_report.active:hover{"
        + "background-color: #dcdcdc;"
        + "-webkit-transition: background-color 200ms ease-in-out;"
        + "-moz-transition: background-color 200ms ease-in-out;"
        + "-o-transition: background-color 200ms ease-in-out;"
        + "transition: background-color 200ms ease-in-out;"
        + "}";
    }

    s += ".jbi_reports_item_clicker{"
      + "text-align: center;"
      + "color: #32323A;"
      + "font-family: Futura, 'Trebuchet MS', Arial, sans-serif;"
      + "height: 38px;"
      + "position: absolute;"
      + "left: 0;"
      + "right: 0;"
      + "bottom: 0;"
      + "background-color: #007fa0;"
      + "}"
      + ".jbi_reports_icon {"
      + "text-align: center; "
      + "margin-top: 10px; "
      + "height: 90px;"
      + "}"
        + ".jbi_reports_nodata_table{"
        + "display:table;"
    + "width:100%;"
    + "margin-top:40px;"
        + "}"

        + ".jbi_reports_nodata_div {"
        + "display:table-cell;"
    + "vertical-align:middle;"
      + "text-align:center;"
    + "font-size:11px;"
    + "font-family:Futura,\'Trebuchet MS\', Arial, sans-serif;"
        + "}"
        + ".jbi_text_left {"
        + " text-align: left;"
        + "}"
        + ".jbi_text_right {"
        + "  text-align: right;"
        + "}"
        + ".jbi_tablerow_border_top {"
        + "border-top: solid 1px #d8d8d8;"
        + "}"
        + ".jbi_reports_table_background {"
        + " background-color: #f7d753"
        + "}"
        + ".jbi_reports_data_table{"
        + "border-spacing: 0;"
        + "width: 100%;"
        + "margin-top: 10px;"
        + "}"
      + ".jbi_reports_name{"
      + "padding-left: 5px;"
      + "padding-right: 5px;"
      + "text-align: center;"
      + "padding-top: 3px;"
      + "font-family: " + fontFamily + ";"
      + "text-transform: initial !important;"
      + "font-weight: normal;";

    if (!my.isMobile) {
      s += "font-size: 15px;";
    } else {
      s += "font-size: 10px;";
    }

    s += "overflow: hidden;"
      + "text-overflow: ellipsis;"
      + "white-space: nowrap;"
      + "}"
      + ".jbi_reports_details{"
      + "text-transform: initial;"
      + "font-weight: normal;"
      + "padding-left: 5px;"
      + "font-family: Futura, 'Trebuchet MS', Arial, sans-serif;"
      + "font-size: 11px;"
      + "overflow: hidden;"
      + "text-overflow: ellipsis;"
      + "white-space: nowrap;"
      + "}"




        // Static trend section
      + "#jbi_trend{"
      + "position: relative;"
      + "display: block;"
      + "margin-top: 24px;"
      + "background-color: " + trendConfig["BackgroundColor"] + ";"
      + "left: 0;"
      + "right: 0;";
    if (my.isMobile) {
      s += "height: 170px;";
    } else {
      s += "height:" + trendConfig["HeightPixels"] + "px;";
    }
    s += "}"
      + "#jbi_trend_chart{"
      + "position: absolute;"
      + "top: 25px;";
    if (my.isMobile) {
      s += "height: 170px;";
    } else {
      s += "height:" + trendConfig["HeightPixels"] + "px;";
    }
    s += "left: 0;"
      + "right: 0;"
      + "font-size: 0px;"
      + "}"
      + "#jbi_trend_chart .jbi_trend_chart{"
      + "position: relative;"
      + "width: 33.33%;";
    if (my.isMobile) {
      s += "height: 170px;";
    } else {
      s += "height:" + trendConfig["HeightPixels"] + "px;";
    }
    s += "display: inline-block;"
      + "}"
      + ".jbi_trend_chart_item{"
      + "position: absolute;"
      + "left: 0;"
      + "right: 0;"
      + "top: 0;"
      + "bottom: 0;"
      + "margin: 5px;"
      + "border: 1px solid #EFEFEF;"
      + "border-radius: 3px;"
      + "}";
    if (!my.isMobile) {
      s += ".jbi_trend_chart_item:hover{"
        + "background-color: " + trendConfig["BackgroundHoverColor"] + ";"
        + "-webkit-transition: background-color 200ms ease-in-out;"
        + "-moz-transition: background-color 200ms ease-in-out;"
        + "-o-transition: background-color 200ms ease-in-out;"
        + "transition: background-color 200ms ease-in-out;"
        + "}";
    }
    s += ".jbi_trend_chart_container{"
      + "position: absolute;"
      + "left: 0;"
      + "right: 0;"
      + "top: 30px;"
      + "bottom: 0;"
      + "}"
      + ".jbi_trend_chart_label{"
      + "position: absolute;"
      + "left: 0;"
      + "right: 0;"
      + "top: 0;"
      + "bottom: 0;"
      + "}"
      + ".jbi_trend_chart_title{"
      + "position: absolute;"
        //+ "background-color: #EFEFEF;"
      + "top: 0px;"
      + "left: 0;"
      + "right: 0;"
      + "height: 30px;"
      + "line-height: 30px;"
      + "text-align: center;"
      + "font-size: 15px;"
      + "font-family: " + fontFamily + ";"
      + "}"
      + ".jbi_trend_chart_value_left{"
      + "display: inline-block;"
      + "position: absolute;"
      + "top: 0;"
      + "bottom: 0;"
      + "left: 35px;"
      + "font-size: 12px;"
      + "font-family: " + fontFamily + ";"
      + "font-weight: bold;"
      + "line-height: 28px;"
      + "color: white;"
      + "padding-top: 2px;"
      + "}"
      + ".jbi_trend_chart_value_right{"
      + "display: inline-block;"
      + "position: absolute;"
      + "top: 0;"
      + "bottom: 0;"
      + "right: 5px;"
      + "font-size: 12px;"
      + "font-family: " + fontFamily + ";"
      + "font-weight: bold;"
      + "line-height: 28px;"
      + "color: white;"
      + "padding-top: 2px;"
      + "}"
      + ".jbi_trend_chart_value_left i{"
      + "font-weight: normal;"
      + "line-height: 28px;"
      + "}"
      + ".jbi_trend_chart_value_right i{"
      + "font-weight: normal;"
      + "line-height: 28px;"
      + "}"
      + ".jbi_trend_chart_value_right span{"
      + "font-weight: bold;"
      + "line-height: 28px;"
      + "vertical-align: top;"
      + "}"
      + ".jbi_trend_chart_value_left span{"
      + "font-weight: bold;"
      + "line-height: 28px;"
      + "vertical-align: top;"
      + "}"
      + ".jbi_trend_chart_value_negative i{"
      + "transform: rotate(135deg);"
      + "}"
      + ".jbi_trend_chart_value_left span.jbi_trend_tooltip {"
      + "display: none;"
      + "position: absolute;"
      + "top: -72px;"
      + "right: -15px;"
      + "padding: 5px;"
      + "z-index: 100;"
      + "background: #ffffff;"
      + "color: #555555;"
      + "border: 1px solid #8f8f8f;"
      + "box-shadow: 1px 1px 1px #888888;"
      + "border-radius: 5px;"
      + "}"
      + ".jbi_trend_chart_value_right span.jbi_trend_tooltip {"
      + "display: none;"
      + "position: absolute;"
      + "top: -72px;"
      + "right: -15px;"
      + "padding: 5px;"
      + "z-index: 100;"
      + "background: #ffffff;"
      + "color: #555555;"
      + "border: 1px solid #8f8f8f;"
      + "box-shadow: 1px 1px 1px #888888;"
      + "border-radius: 5px;"
      + "}"
      + ".jbi_trend_chart_value_left:hover span.jbi_trend_tooltip {"
      + "display: block;"
      + "}"
      + ".jbi_trend_chart_value_right:hover span.jbi_trend_tooltip {"
      + "display: block;"
      + "}"
      + ".jbi_trend_tooltip:before {"
      + "content: '';"
      + "display: block;"
      + "position: absolute;"
      + "width: 0;"
      + "height: 0;"
      + "right: 38px;"
      + "bottom: -9px;"
      + "border-left: 6px solid transparent;"
      + "border-right: 6px solid transparent;"
      + "border-top: 9px solid #8f8f8f;"
      + "}"
      + ".jbi_trend_tooltip > table {"
      + "font-size: 10px;"
      + "font-weight: normal;"
      + "line-height: 14px;"
      + "width: 100%;"
      + "white-space: nowrap;"
      + "}"
      + ".jbi_trend_tooltip_value{"
      + "text-align: right;"
      + "padding-left: 15px;"
      + "}"

      + "#jbi_trend_chart .message-placeholder{"
      + "  display: table;"
      + "  width: 100%;"
      + "  height: 100%;"
      + "  min-height: 100px;"
      + "  border: 1px solid #EFEFEF;"
      + "  border-radius: 5px;"
      + "}"
      + "#jbi_trend_chart .message-placeholder .message{"
      + "  display:table-cell;"
      + "  vertical-align: middle;"
      + "  font-family: " + fontFamily + ";"
      + "  font-size: 11px;"
      + "  text-align: center;"
      + "  color: black;"
      + "}";
//@formatter:on
    s += "</style>";

    // Add the CSS to the head of the HTML page
    $(s).appendTo("head");


    // HELPER FUNCTIONS

    function getConfigStyle() {
      var customConfig = $("body").data("customConfig");
      if (!customConfig
        || !customConfig["CONFIG"]) {
        return null;
      }
      return customConfig["CONFIG"];
    }

  };


  return my;

}(shell.app.execdblp.dashboard));

//####src/execdblpig/dashboard/mod_summary.js
shell.app.execdblp.dashboard = ( function (my) {

  my._buildSummary = function () {
    addHTML();
    addEventListeners();


    /**
     * addHTML
     * Generate the business filter and the containers for the summary KPIs
     **/
    function addHTML() {
      $("#jbi_summary").html('<div id="jbi_summary_businessfilter"></div>');
      addSummaryBusinessFilter();
    }

    /**
     * addSummaryBusinessFilter
     * Creates the dropdown selection filter for the summary section of the dashboard.
     * @param configSummary {object} Configuration object for the summary section
     */
    function addSummaryBusinessFilter(configSummary) {
      var $body = $("body");
      var customAppFilters = $body.data("customAppFilters");
      var customDataApp = $body.data('customDataApp');
      var customConfig = $body.data('customConfig');
      var initialBusiness = $body.data('initialBusiness');

      if (!customDataApp || !customDataApp.businessHierarchy.length) {
        return;
      }

      if (customDataApp.businessHierarchy.length > 1) {
        console.log('More than one top node given, first one is used');
      }

      var businessHierarchyNodes = flat(customDataApp.businessHierarchy)
        .filter(function(hierarchyNode) {
          return (
            hierarchyNode.nodetype === 'S' ||
            hierarchyNode.nodetype === 'B' ||
            hierarchyNode.nodetype === 'LOB'
          );
        });

        var initialBusinessIndex = 0;
        if (initialBusiness) {
          businessHierarchyNodes.forEach(function(hierarchyNode, index) {
            if (hierarchyNode.id === initialBusiness) {
              initialBusinessIndex = index;
            }
          });
          $body.data('initialBusiness', null);
        }

      // create the business filters based on the available businesses in the BEx query
//@formatter:off
      var s = "";
      s += "<ul id='jbi_summary_filters'>";
        s += "<li id='jbi_summary_filter_business'>";
          s += "<span>" + businessHierarchyNodes[initialBusinessIndex].name + " <svg style='position:relative;right:3px;top:8px;float:right;' class='filter_click_down_icon' width='12px' height='12px' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'><path d='M1408 704q0 26-19 45l-448 448q-19 19-45 19t-45-19l-448-448q-19-19-19-45t19-45 45-19h896q26 0 45 19t19 45z'></path></svg></span>";
            s += "<ul id='jbi_summary_filter_business_items'>";
            businessHierarchyNodes.forEach(function(hierarchyNode, index) {
              s += "<li" +
                " data-filterkey='" + hierarchyNode.id +"'" +
                " data-filtertext='" + hierarchyNode.name + "'" +
                " class='jbi_summary_filter_value" + ( (index === initialBusinessIndex) ? " jbi_summary_filter_active" : "" ) + "'>";
              s += "<span>" + hierarchyNode.name + "</span>";
              s += "</li>";
            });
            s += "</ul>";
          s += "</li>";
        s += "</ul>";
//@formatter:on

      function flat(array) {
        var result = [];
        array.forEach(function (a) {
          result.push(a);
          if (Array.isArray(a.children)) {
            result = result.concat(flat(a.children));
          }
        });
        return result;
      }

      // add the HTML placeholders to the component
      $("#jbi_summary_businessfilter").html(s);
      $body.trigger('hierarchyFilterSelectionChanged');
    }

    function addEventListeners() {

      // open or close the business filter item list
      var $summaryFilterBusiness = $("#jbi_summary_filter_business");
      $summaryFilterBusiness.unbind(my.eventTrigger);
      $summaryFilterBusiness.on(my.eventTrigger, function () {
        $('#jbi_summary_filter_business_items').fadeToggle(300);
      });


      // select a business filter from the business filter item list
      var $summaryFilterBusinessFilterItem = $("#jbi_summary_filter_business ul li");
      $summaryFilterBusinessFilterItem.unbind(my.eventTrigger);
      $summaryFilterBusinessFilterItem.on(my.eventTrigger, function () {
        var filterText = $(this).data("filtertext");
        $("#jbi_summary_filter_business > span").html(filterText + " <svg style='position:relative;right:3px;top:8px;float:right;' class='filter_click_down_icon' width='12px' height='12px' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'><path d='M1408 704q0 26-19 45l-448 448q-19 19-45 19t-45-19l-448-448q-19-19-19-45t19-45 45-19h896q26 0 45 19t19 45z'></path></svg></span>");
        $("#jbi_summary_filter_business li").removeClass("jbi_summary_filter_active");
        $(this).addClass("jbi_summary_filter_active");
        $('body').trigger('hierarchyFilterSelectionChanged');
      });
    }
  };

  return my;

}(shell.app.execdblp.dashboard));

//####src/execdblpig/dashboard/mod_trend.js
shell.app.execdblp.dashboard = ( function (my) {

  my._buildTrend = function () {
    addHTML();

    function addHTML() {
      var configTrendContainers = getConfigTrend();
      if (!configTrendContainers) {
        return;
      }

      // create a placeholder for the entire section
      $("#jbi_trend").html("<div id='jbi_trend_chart'></div>");


      // create the HTML for the trend section
      for (var i = 0; i < configTrendContainers.length; i++) {
        addContainerContent(configTrendContainers[i], i);
      }
    }

    function addContainerContent(config, i) {

      // get the kpi data
      var $body = $("body"),
        customData = $body.data("customDataApp"),
        customConfig = $body.data("customConfig");

      if (!customData || !customData.datasets || !customData.datasets[config.business]) {
        return;
      }

      var businessData = customData.datasets[config.business],
        containerConfig = customConfig[config.config],
        containerContentDOMId = "jbi_trend_chart_" + ( i + 1 ),
        dataIds = config.data.split(";"),
        containerText = "",
        $jbiTrendChart = $("#jbi_trend_chart");

      // check if data is available
      if (!businessData || !businessData.kpis) {
        $jbiTrendChart.html("<div style='padding:10px;box-sizing: border-box;width:100%;height:100%;'><div class='message-placeholder'><div class='message'>No data available.</div></div></div>")
        return;
      }

      dataIds.forEach(function (id) {
        if (containerText !== "") {
          containerText += " and ";
        }
        if (businessData.kpis[id]) {
          containerText += businessData.kpis[id].text;
        }
      });


      var s = "";
//@formatter:off
      s += "<div class='jbi_trend_chart'>";
      s += "<div class='jbi_trend_chart_item'>";
      s += "<div class='jbi_trend_chart_container' id='" + containerContentDOMId + "Content'></div>";
      s += "<div class='jbi_trend_chart_title'>" + containerText + "</div>";
      s += "</div>";
      s += "</div>";
//@formatter:on

      $jbiTrendChart.append(s);

      my._createChart(
        containerContentDOMId,
        containerConfig.chart,
        config.data,
        businessData
      );

    }


    // HELPER FUNCTIONS

    /**
     * Get the trend specific configuration
     * @returns {object} the configuration settings
     */
    function getConfigTrend() {
      var customConfig = $("body").data("customConfig");
      if (!customConfig
        || !customConfig["TREND"]) {
        return null;
      }
      return customConfig["TREND"];
    }

    /**
     * Get the base64 image for the trend icon
     * @param direction {string} Either up or down
     * @returns {string} The base64 representation of the image
     */
    function getTrendIcon(direction) {
      if (direction === "up") {
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAACXBIWXMAABJ0AAASdAHeZh94AAACR0lEQVRIS62WzUtUURiHZ9SkReXGhVGMi8hE/AAXbduEtBAXQrUJwmgjuWgjDEStMmj+hcxZaBoRgqAgUhG0qAjRxWwKUZpKqUyQibRG7vS8t98UwzlO4zgPPJ7zfp073nsZJlIKQRAcyeVycdZRfIVTeINcs1rKgwOiHJRkzengXjyBx0nFWLtwTPUFliqNlgZDVzR8leWg0l6oH8Cz9H5nfYRRlXaH5nF8o7BkOLyKuQS+xsNKu1CcwPsKy4L5flxWWAiF6/hC4b7gnDv4WOE/SAbaVgRu33OOPKcwvMAsyfMKC6C2gl8wjW9xEV/iM5zBad/DJt+KaYXhVQ3vW0FjI57EU9iCbdiBTThvg2p1oP6Ucsw2NjyhfMkw8xCT+E4pB2o9OGybEWxX/r/wyexVncRxi1k/hAUP9l9Q37CmBTymfFF0gTl8oJTNf9LWgf5D1LesKUtQr3xR6LUHfk9hCPGqtl6oB/YnzUUalNsV+lKYUPgXcmvaOnBuLfWsNT0hiCnvhZ4leuIKC6D2WVsHu0PUM9bUh9eUd6C2hgMKHaita+tArRNT+eBjuPFArVtbL9RvaetA7Tb25oOv2BQGFYQzf2obBmdwWmFF4LxBTCr8Awl7ey4o3Bf2wNH/dcNFtrFRYdlwxg/sUFgIBfse+4VdSu0JPnwdsxm8qJQfGo7iKt5lqEbpotBXTX+f3SLW00oXh177pZLQ0E1sYVurcoh67NfLJdzEGXJ7+8WSh+HL+B7tNu7gMmbR+IZDHF6tdg+RyG+AGXPS+E2WXgAAAABJRU5ErkJggg==';
      } else if (direction === "down") {
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAACXBIWXMAABJ0AAASdAHeZh94AAACRUlEQVRIS62Wy0tUYRjGx0sqqBDiiIhEXkIhCIUgcCUIgm4MRHLlplByY7hxqdDGZX9BBBJBGIiguFUhSAQvGzeiLfKWBoWBlxnm+HuPjx4O54zO7YGf3/c+3/u+33ecmW8mkooSiUQjfIQ1OIM9mHMcZ1ApmYkGeWrkMH6BVqiBKFY1Yy0MwQGc4LWrNDVRNAxxCvvggeykIrcBFmCL/DLZyUXiNCwrTEvU9cIZGzXLCorFT4bCjMQm9vrFoUqWJ8wR+K4wK9GnG3YUeuIJTAUKsxabvIcPCl1jBgYU5kQcON9OrdDd5BJKFQbE2i70KwyItXlNfcIfg7e2o73nF+WHipyH5PyGLlk+sb6qqU/kP4Ntm7wj6aX8pNJh/sFzWbfC29TUJ/xiiNnkMzTIv1PkRcH+tU9kuSLe0jQgDudYwjrUyLtX1JSQn2Csl2U9tjUNiLU9+zNNwWN5KYmaUjsho/tEjD/dhRCxdmEnm2TSJi9lUWMXZAyqYF+2T/QuYC1uyXUEX+WnJWqbwG7hY1k+0beetT83gfehCRGJJ3AEh2BN9+EX7MAxnCvVJ/zXMH4TrECnG+RQ9PSekAexK+CvwpyIfoNsMqvwWhhT4F1oWYgNyiD8JWCTH/BGYcaixym8UOgXC+VgX6GTstISdZXU2w+NV7LCRWIhSd9gCZ7KvlPUFJE7ymhqkX2/KOoAe5suQg/FjxjLbY25Na2AVuYTjDFG++rOd4vTFQ3sk22/uewGth8Jdp3YJfkfNgj7lJpEkcgVn89c3ptQCB8AAAAASUVORK5CYII=';
      }
    }

  };


  return my;

}(shell.app.execdblp.dashboard));

//####src/execdblpig/dashboard/mod_utilities.js
shell.app.execdblp.dashboard = ( function (my) {

  // check for mobile thingies
  my.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  my.eventTrigger = (my.isMobile) ? "touchstart" : "click";


  my.getSourceValue = function(businessKey, kpiKey, periodKey) {
    var foundItems = [];

    var $queries = $("body").data("customData");
    Object.keys($queries).forEach(function(query) {
      var queryResults = $queries[query].filter(function(obj){
        return (obj.businessKey === businessKey && obj.extKey === kpiKey && obj.extPeriodKey === periodKey);
      });

      if (queryResults.length) {
        var foundItem = {};
        foundItem[query] = queryResults;
        foundItems.push(foundItem);
      }
    });

    return foundItems;
  };


  my._addUtilities = function () {

    Highcharts.setOptions({
      lang: {
        numericSymbols: null //otherwise by default ['k', 'M', 'G', 'T', 'P', 'E']
      }
    });

// special functions
    Number.prototype.mod = function (n) {
      return ((this % n) + n) % n;
    };

    Date.prototype.addBusDays = function (dd) {
      var wks = Math.floor(dd / 5);
      var dys = dd.mod(5);
      var dy = this.getDay();

      if (dy === 6 && dys > -1) {
        if (dys === 0) {
          dys -= 2;
          dy += 2;
        }
        dys++;
        dy -= 6;
      }

      if (dy === 0 && dys < 1) {
        if (dys === 0) {
          dys += 2;
          dy -= 2;
        }
        dys--;
        dy += 6;
      }

      if (dy + dys > 5) dys += 2;
      if (dy + dys < 1) dys -= 2;
      this.setDate(this.getDate() + wks * 7 + dys);
    };
  };

  my._getTrendData = function (businessData, kpi, dataPoints) {
    var periods = getDataPointsForCurrentMonth(dataPoints),
      returnObject;

    // in order to get the trend, we need exactly two datapoints
    if (!periods || !periods.length) {
      return;
    } else if (periods.length !== 2) {
      return;
    }

    // check if the KPI data is available
    var kpiData = (businessData && businessData.kpis) ? businessData.kpis[kpi] : null;
    if (!kpiData) {
      return;
    }

    // define the return object
    returnObject = {
      kpi: {
        id: kpi,
        label: kpiData.text
      },
      oldPeriod: {
        id: periods[0],
        label: my.period_functions.getPeriodIdentifierLabel(periods[0])
      },
      newPeriod: {
        id: periods[1],
        label: my.period_functions.getPeriodIdentifierLabel(periods[1])
      }
    };

    // the trend icon and its value is set by the difference in percentage
    // between the current month compared to the previous month
    if (!kpiData
      || !kpiData.data
      || !kpiData.data[periods[0]]
      || !kpiData.data[periods[1]]) {
      return returnObject;
    }

    // get the values
    var valuePrevious = kpiData.data[periods[0]],
      valueCurrent = kpiData.data[periods[1]];
    try {
      returnObject.oldValue = valuePrevious;
      returnObject.newValue = valueCurrent;
      returnObject.differencePercentage = (( valueCurrent - valuePrevious ) / Math.abs( valuePrevious ) * 100).toFixed();
      return returnObject;
    } catch (err) {
      return 0;
    }


    function getDataPointsForCurrentMonth(dataPoints) {
      var currentMonth = my.period_functions.getCurrentPeriod().periodShortName;

      for (var i = 0; i < dataPoints.length; i++) {
        if (dataPoints[i].months
          && dataPoints[i].months.length
          && dataPoints[i].months.indexOf(currentMonth) > -1) {
          return dataPoints[i].displayPeriods;
        }
      }
      return null;
    }
  };



  my._formatNumber = function (m, v) {
    if (!m || isNaN(+v)) {
      return v; //return as it is.
    }
    //convert any string to number according to formation sign.
    var v = m.charAt(0) == '-' ? -v : +v;
    var isNegative = v < 0 ? v = -v : 0; //process only abs(), and turn on flag.

    //search for separator for grp & decimal, anything not digit, not +/- sign, not #.
    var result = m.match(/[^\d\-\+#]/g);
    var Decimal = (result && result[result.length - 1]) || '.'; //treat the right most symbol as decimal
    var Group = (result && result[1] && result[0]) || ',';  //treat the left most symbol as group separator

    //split the decimal for the format string if any.
    var m = m.split(Decimal);
    //Fix the decimal first, toFixed will auto fill trailing zero.
    v = v.toFixed(m[1] && m[1].length);
    v = +(v) + ''; //convert number to string to trim off *all* trailing decimal zero(es)

    //fill back any trailing zero according to format
    var pos_trail_zero = m[1] && m[1].lastIndexOf('0'); //look for last zero in format
    var part = v.split('.');
    //integer will get !part[1]
    if (!part[1] || part[1] && part[1].length <= pos_trail_zero) {
      v = (+v).toFixed(pos_trail_zero + 1);
    }
    var szSep = m[0].split(Group); //look for separator
    m[0] = szSep.join(''); //join back without separator for counting the pos of any leading 0.

    var pos_lead_zero = m[0] && m[0].indexOf('0');
    if (pos_lead_zero > -1) {
      while (part[0].length < (m[0].length - pos_lead_zero)) {
        part[0] = '0' + part[0];
      }
    }
    else if (+part[0] == 0) {
      part[0] = '';
    }

    v = v.split('.');
    v[0] = part[0];

    //process the first group separator from decimal (.) only, the rest ignore.
    //get the length of the last slice of split result.
    var pos_separator = ( szSep[1] && szSep[szSep.length - 1].length);
    if (pos_separator) {
      var integer = v[0];
      var str = '';
      var offset = integer.length % pos_separator;
      for (var i = 0, l = integer.length; i < l; i++) {

        str += integer.charAt(i); //ie6 only support charAt for sz.
        //-pos_separator so that won't trail separator on full length
        if (!((i - offset + 1) % pos_separator) && i < l - pos_separator) {
          str += Group;
        }
      }
      v[0] = str;
    }

    v[1] = (m[1] && v[1]) ? Decimal + v[1] : "";
    return (isNegative ? '-' : '') + v[0] + v[1]; //put back any negation and combine integer and fraction.

  };


  return my;

}(shell.app.execdblp.dashboard));

//####src/execdblpig/dataparser/app.js
var shell = shell || {};
shell.app = shell.app || {};
shell.app.execdblp = shell.app.execdblp || {};
shell.app.execdblp.dataparser = ( function (my) {



  return my;
}(shell.app.execdblp.dataparser || {}));

//####src/execdblpig/dataparser/mod_queryDesignStudio.js
shell.app.execdblp.dataparser = ( function (my) {

  my.parseQueryDesignStudio = function (config) {
    var businessConfig = {};
    if (config["BUSINESS"]) {
      businessConfig = config["BUSINESS"];
    }

    var hierarchyMetadata = _getHierarchyMetadata(businessConfig);
    var comments =  _getComments();
    var parsedData = _createDatasets(hierarchyMetadata);
    if (!parsedData) {
      return null;
    }

    var hierarchy = _createHierarchy(parsedData.datasets, hierarchyMetadata);
    var fullDataset = $.extend(true, {}, hierarchy.datasets);
    var dataset;


    // remove all the kpis from the hierarchy dataset
    for (dataset in hierarchy.datasets) {
      if (hierarchy.datasets.hasOwnProperty(dataset)) {
        delete hierarchy.datasets[dataset].kpis;
      }
    }

    // remove all the children from the kpi dataset
    for (dataset in fullDataset) {
      if (fullDataset.hasOwnProperty(dataset)) {
        var childrenIds = [];
        if (fullDataset[dataset].children && fullDataset[dataset].children.length) {
          for (var i = 0; i < fullDataset[dataset].children.length; i++) {
            childrenIds.push(fullDataset[dataset].children[i].id);
          }
        }
        fullDataset[dataset].children = childrenIds;
      }
    }


    // replace the full child object by just its ID
    //for (var dataset in fullDataset) {
    //  if (fullDataset.hasOwnProperty(dataset)) {
    //    var childrenIds = [];
    //    if (fullDataset[dataset].children && fullDataset[dataset].children.length) {
    //      for (var i = 0; i < fullDataset[dataset].children.length; i++) {
    //        childrenIds.push(fullDataset[dataset].children[i].id);
    //      }
    //    }
    //    fullDataset[dataset].children = childrenIds;
    //  }
    //}

    return ({
      businessHierarchy: hierarchy.businessHierarchy,
      datasets: fullDataset,
      comments: comments,
      periods: parsedData.headerLabels
    });

    //return({
    //  datasets: fullDataset,
    //  comments: comments,
    //  periods: parsedData.headerLabels
    //});


    function _getComments() {
      // get the data
      var customData = $("body").data("customData");
      if (!customData) {
        return [];
      }

      // structure holding the comment relevant infoobjects
      var iobj = {
        ReportName : "XX100134",   // not provided by the query
        Period : "XX100135",       // not provided by the query
        Menu : "XX100136",
        Business : "XX100137",
        Container : "XX100138",
        Filter1 : "XX100139",
        Filter2 : "XX100140",
        Filter3 : "XX100141",
        Filter4 : "XX100142",
        Filter5 : "XX100143",
        Filter6 : "XX100144",
        Filter7 : "XX100145",
        Text1 : "XX100146",
        Text2 : "XX100147",
        Text3 : "XX100148",
        Text4 : "XX100149"
      };

      // get the query that provides the comments
      var comments = [];
      for (var property in customData) {
        if (customData.hasOwnProperty(property)) {
          var data = customData[property];
          if (!data.length) {
            continue;
          }

          // a characteristic that identifies the comment query is the
          // comment text (XX100146)
          if (!data[0][iobj.Text1 + "_TEXT"]) {
            continue;
          }

          // go over each line of the query and create a set for the application
          for (var i=0; i<data.length; i++) {
            var commentText = "";
            for (var y=1; y<=4; y++) {
              if (data[i][iobj["Text" + y]  + "_KEY"] !== "#") {
                if (data[i][iobj["Text" + y]  + "_KEY"] === data[i][iobj["Text" + y]  + "_TEXT"]) {
                  commentText += data[i][iobj["Text" + y] + "_KEY"];
                } else {
                  commentText += data[i][iobj["Text" + y] + "_KEY"] + " ";
                  commentText += data[i][iobj["Text" + y] + "_TEXT"];
                }
              }
            }

            comments.push({
              Menu : data[i][iobj.Menu + "_KEY"],
              Business : data[i][iobj.Business + "_KEY"],
              Container : data[i][iobj.Container + "_KEY"],
              Filter1 : data[i][iobj.Filter1 + "_KEY"],
              Filter2 : data[i][iobj.Filter2 + "_KEY"],
              Filter3 : data[i][iobj.Filter3 + "_KEY"],
              Filter4 : data[i][iobj.Filter4 + "_KEY"],
              Filter5 : data[i][iobj.Filter5 + "_KEY"],
              Filter6 : data[i][iobj.Filter6 + "_KEY"],
              Filter7 : data[i][iobj.Filter7 + "_KEY"],
              Comment : commentText
            });
          }
        }
      }
      return comments;
    }


    function _createDatasets(hierarchyMetadata) {
      var datasets = {},
        headerLabels = {},
        settypes = {
          standard: [],
          exception: []
        };

      // Add data in Design studio is stored in the body of the
      // document in a property called "customData". This is done
      // by the DATA components.
      var customData = $("body").data("customData");
      if (customData) {
        for (var property in customData) {
          if (customData.hasOwnProperty(property)) {
            var data = customData[property];

            // check if the current query result is holding the
            // report data. This is true if two structures can
            // be found, of which one contains the CM period
            var metaStructures = getStructureIds(data);
            if (!metaStructures) {
              continue;
            }

            // pre-process the data
            var enhancedData = enhanceData(metaStructures, data, hierarchyMetadata);
            var dataLabels = getHeaderlabels(metaStructures, data);

            // store the headerLabels
            for (var i=0; i<dataLabels.length; i++) {
              headerLabels[dataLabels[i].id] = headerLabels[dataLabels[i].id] || dataLabels[i].label;
            }

            // because the standard queries needs to be processed before the exception
            // queries, we need to store the values for later processing
            var setObject = {
              data: enhancedData,
              metaStructures: metaStructures,
              dataLabels: dataLabels
            };

            // separate the standard datasets from the exception datasets
            if (enhancedData && enhancedData.length) {
              if (enhancedData[0].isException) {
                settypes.exception.push(setObject);
              } else {
                settypes.standard.push(setObject);
              }
            }
          }
        }

        // first process the standard queries
        // extract the kpi data
        var setIndex;
        if (settypes.standard.length) {
          for (setIndex = 0; setIndex < settypes.standard.length; setIndex++) {
            $.extend(
              true,
              datasets,
              buildDatasets(
                settypes.standard[setIndex].data,
                settypes.standard[setIndex].metaStructures,
                settypes.standard[setIndex].dataLabels
              ),
              datasets);
          }
        }

        // now process the exception queries
        if (settypes.exception.length) {
          for (setIndex = 0; setIndex < settypes.exception.length; setIndex++) {
            $.extend(
              true,
              datasets,
              buildDatasets(
                settypes.exception[setIndex].data,
                settypes.exception[setIndex].metaStructures,
                settypes.exception[setIndex].dataLabels
              ),
              datasets);
          }
        }

        return {
          datasets: datasets,
          headerLabels: headerLabels
        }
      }

      /**
       * Gets the generated BEx query structure Ids
       *
       * The IDs of the structures used in the BEx query are generated by SAP and
       * can be different per system. The query consists of two structures. One
       * for the PERIODS and one for the GROUPINGS.
       *
       * This function extracts the generated IDs and returns an object holding
       * the metadata (key and text).
       *
       * NOTE:
       * The first GROUPING text in the BEx query should always start with the
       * following four characters : ' ---'
       *
       * @param data   the query resultset
       * @return       object holding the ids of the BEx query structures or
       *               null in case the IDs could not be determined
       */
      function getStructureIds(data) {

        // prepare the result object
        var metaStructures = {
          periodStructureKey: null,
          periodStructureText: null,
          sectorKey: "SH000470_KEY",
          sectorText: "SH000470_TEXT",
          miSectorKey: "SH100098_KEY",
          miSectorText: "SH100098_TEXT",
          businessEntityKey: "SH100242_KEY",
          businessEntityText: "SH100242_TEXT",
          kpiStructureKey: null,
          kpiStructureText: null,
          value: "VALUE"
        };

        if (!data || !data[0]) {
          return null;
        }

        // determine the ID for the GROUPING structure based on the property name of the first
        // data item (starting with ' ---').
        var property;
        for (property in data[0]) {
          if (data[0].hasOwnProperty(property)) {

            // get the structure key and name
            if ( ( ("" + data[0][property]).substring(0, 4) === " ---" || ("" + data[0][property]).substring(0, 3) === "---" ) && property.substring(property.length - 4) !== "_KEY") {
              metaStructures.kpiStructureText = property;
              metaStructures.kpiStructureKey = property.substring(0, (property.length - 5)) + "_KEY";
              break;
            }
          }
        }

        // get the structure id for the PERIODS structure (the 'other' structure)
        for (property in data[0]) {
          if (data[0].hasOwnProperty(property)) {
            if (property !== metaStructures.kpiStructureKey &&
              property !== metaStructures.kpiStructureText &&
              property !== metaStructures.businessEntityKey &&
              property !== metaStructures.businessEntityText &&
              property !== metaStructures.sectorKey &&
              property !== metaStructures.sectorText &&
              property !== metaStructures.miSectorKey &&
              property !== metaStructures.miSectorText &&
              property !== metaStructures.value) {
              if (property.substring(property.length - 4) === "_KEY") {
                metaStructures.periodStructureKey = property;
                metaStructures.periodStructureText = property.substring(0, (property.length - 4)) + "_TEXT";
              }
              break;
            }
          }
        }

        // only proceed if the metadata is known
        if (!metaStructures.periodStructureKey || !metaStructures.periodStructureText || !metaStructures.kpiStructureText || !metaStructures.kpiStructureKey) {
          return null;
        }

        return metaStructures;
      }


      /**
       * Extract the KEY and TEXT used in the Structures
       *
       * The GROUPING structure has one leading row that describes a specific
       * grouping in the BEx query (called VIEW name). This leading row will
       * be followed with rows that hold the data for this specifi VIEW. These
       * rows start with the VIEW ID followed with a space and then the GROUP
       * NAME.
       *
       * Example:
       *  --- 100.01 My Description
       * 100.01 Group Name 1
       * 100.01 Another Group Name
       *
       * This function is used to add the following information to each data
       * record based on the GROUPING structure:
       * - viewName       --> i.e. 100.01 My Description
       * - extKey         --> i.e. 100.01
       * - extText        --> i.e. Group Name 1
       *
       *
       * Also this function extracts the KEY and TEXT for the period structure
       * which is required as the TEXTS of the periods are determined in SAP
       * via a text variable.
       *
       * Example:
       * CM CY - FEB 2015
       *
       * The following data will be extracted based on this property:
       * - extPeriodKey   --> i.e. CM CY
       * - extPeriodText  --> i.e. FEB 2015
       *
       * This function extracts the generated IDs and returns an object holding
       * the metadata (key and text).
       *
       *
       * @param metaStructures    the Ids of the BEx query structures
       * @param data              the query resultset
       * @param hierarchyMetadata the meta data for the hierarchy nodes
       * @return {Array}          the query resultset enhanced with the viewName, grouping
       *                          key, grouping text, period key and period text
       */
      function enhanceData(metaStructures, data, hierarchyMetadata) {
        var enhancedData = [],
            keySeparator;

        for (var i = 0; i < data.length; i++) {

          // check if the GROUPING property holds the VIEW DESCRIPTION (starts with ' ---')
          try {
            if (data[i][metaStructures.kpiStructureText].substring(0, 4) === " ---"
              || data[i][metaStructures.kpiStructureText].substring(0, 3) === "---") {
              continue;
            }
          } catch (err) {
            continue;
          }

          // add the grouping key and text
          try {
            // search for the - in the kpi description
            var sepIndex = data[i][metaStructures.kpiStructureText].indexOf("-");
            data[i].extKey = data[i][metaStructures.kpiStructureText].substring(0, sepIndex - 1);
            data[i].extText = data[i][metaStructures.kpiStructureText].substring(sepIndex + 2);
          } catch (err) {
            // do nothing if an error occurs
          }

          // the sector exception query contains the sector key in brackets
          var sectorExceptionOpeningBracket = data[i].extKey.indexOf("(");
          var sectorExceptionClosingBracket = data[i].extKey.indexOf(")");
          if (sectorExceptionOpeningBracket > -1 && sectorExceptionClosingBracket > sectorExceptionOpeningBracket) {
            data[i][metaStructures.sectorKey] = "/" + data[i].extKey.substring(sectorExceptionOpeningBracket + 1, sectorExceptionClosingBracket);
            data[i].extKey = data[i].extKey.substring(0, sectorExceptionOpeningBracket);
            data[i].isException = true;
          }

          // add the period key and text to the data
          try {
            var fullPeriod = data[i][metaStructures.periodStructureText];
            data[i].extPeriodKey = fullPeriod.substring(0, fullPeriod.indexOf(" - "));
            data[i].extPeriodText = fullPeriod.substring(fullPeriod.indexOf(" - ") + 3);
          } catch (err) {
            // do nothing if an error occurs
          }

          // move the Mi sector data to the sector
          if (data[i][metaStructures.miSectorKey]) {
            data[i][metaStructures.sectorKey] = data[i][metaStructures.miSectorKey];
            data[i][metaStructures.sectorText] = data[i][metaStructures.miSectorKey];
          }


          // add the sector to the data
          if (data[i][metaStructures.sectorKey]) {

            var sectorKey = data[i][metaStructures.sectorKey] || data[i][metaStructures.miSectorKey];
            keySeparator = sectorKey.lastIndexOf("/");
            if (keySeparator > -1) {
              sectorKey = sectorKey.substring(keySeparator + 1);
            } else {
              // only hierarchy nodes are permitted for sector
              continue;
            }

            data[i].businessKey = "SE-" + sectorKey;

            // read the business text from the hierarchy meta data
            if (hierarchyMetadata && hierarchyMetadata.nodeMetadata && hierarchyMetadata.nodeMetadata["SE-" + sectorKey]) {
              data[i].businessText = hierarchyMetadata.nodeMetadata["SE-" + sectorKey].name;
            } else if (data[i][metaStructures.sectorText]) {
              data[i].businessText = data[i][metaStructures.sectorText];
            } else {
              data[i].businessText = sectorKey;
            }


          } else if (data[i][metaStructures.businessEntityKey]) {
            var businessEntityKey = data[i][metaStructures.businessEntityKey];
            keySeparator = businessEntityKey.lastIndexOf("/");
            if (keySeparator > -1) {
              businessEntityKey = businessEntityKey.substring(keySeparator + 1);
            }

            data[i].businessKey = "BE-" + businessEntityKey;
            data[i].businessText = data[i][metaStructures.businessEntityText];
          }

          // change null to undefined for the merge of datasets
          if (data[i].VALUE === null) {
            data[i].VALUE = undefined;
          }

          enhancedData.push(data[i]);
        }

        return enhancedData;
      }


      /**
       * Get the header labels from the dataset
       *
       * The periods are provided as key and text. The provided periods are equal
       * to all the datasets within the data. This generic function is determining
       * the headerlabels only one time.
       *
       * NOTE:
       * The first GROUPING text in the BEx query should always start with the
       * following four characters : ' ---'
       *
       * @param metaStructures    the Ids of the BEx query structures
       * @param data              the query resultset
       * @return {Array}          the header labels (both id and label)
       */
      function getHeaderlabels(metaStructures, data) {

        // result object
        var headerLabels = [{
          id: "Group",
          label: ""
        }];

        // the first row in the dataset should have a value for each period and can therefore
        // be used to determine the periods.
        var curStr = null;
        for (var i = 0; i < data.length; i++) {

          // proceed as long as we are still on the first row
          if ( "" + data[i][metaStructures.kpiStructureText].substring(0, 4) === " ---" || "" + data[i][metaStructures.kpiStructureText].substring(0, 3) === "---" ) {
            if (curStr !== data[i][metaStructures.kpiStructureText] && curStr !== null) {
              break;
            } else {
              curStr =  data[i][metaStructures.kpiStructureText];
            }


            try {
              var fullPeriod = data[i][metaStructures.periodStructureText];
              headerLabels.push({
                id: fullPeriod.substring(0, fullPeriod.indexOf(" - ")),
                label: fullPeriod.substring(fullPeriod.indexOf(" - ") + 3)
              });
            } catch (err) {
              // do nothing
            }
          } else {
            // break the loop in case the second row is processed
            break;
          }
        }

        return headerLabels;
      }


      /**
       * Get the header labels from the dataset
       *
       * The periods are provided as key and text. The provided periods are equal
       * to all the datasets within the data. This generic function is determining
       * the headerlabels only one time.
       *
       * NOTE:
       * The first GROUPING text in the BEx query should always start with the
       * following four characters : ' ---'
       *
       * @param enhancedData      the query resultset enhanced with the viewName, grouping
       *                          key, grouping text, period key and period text
       * @param metaStructures    the Ids of the BEx query structures
       */
      function buildDatasets(enhancedData, metaStructures) {
        var datasets = {};

        for (var i = 0; i < enhancedData.length; i++) {

          // every row must have a business key assigned
          if (!enhancedData[i].businessKey) {
            continue;
          }

          // check if the dataset id is already defined
          if (!datasets[enhancedData[i].businessKey]) {
            datasets[enhancedData[i].businessKey] = {
              text: enhancedData[i].businessText,
              kpis: {},
              parentNode: enhancedData[i]["businessParent"],
              id: enhancedData[i].businessKey,
              color: enhancedData[i].color
            }
          }

          // add the kpi if not already defined
          if (!datasets[enhancedData[i].businessKey].kpis[enhancedData[i].extKey]) {
            datasets[enhancedData[i].businessKey].kpis[enhancedData[i].extKey] = {
              text: enhancedData[i].extText,
              data: {
                'Group': enhancedData[i].extText
              }
              //headerLabels: headerLabels
            };
          }

          // add the value
          datasets[enhancedData[i].businessKey].kpis[enhancedData[i].extKey].data[enhancedData[i].extPeriodKey] = enhancedData[i][metaStructures.value];
        }

        return datasets;
      }
    }


    function _createHierarchy(datasets, hierarchyMetadata) {

      // next: create the datasets and the hierarchy
      return {
        businessHierarchy: addHierarchyMetaToDatasets(hierarchyMetadata, datasets),
        datasets: datasets
      };


      // add the hierarchy metadata to the report data (actual data)
      function addHierarchyMetaToDatasets(hierarchyMetadata, datasets) {

        var arrData = [];
        for (var property in datasets) {
          if (datasets.hasOwnProperty(property)) {
            var mapIndex;

            // add the node metadata
            if (hierarchyMetadata.nodeMetadata && hierarchyMetadata.nodeMetadata[property]) {
              $.extend(true, datasets[property], datasets[property], hierarchyMetadata.nodeMetadata[property]);
            }

            // check if the node should be removed
            if (hierarchyMetadata && hierarchyMetadata.mappingTable && hierarchyMetadata.mappingTable.to){
                mapIndex = hierarchyMetadata.mappingTable.to.indexOf(datasets[property].parentNode);
              if (mapIndex > -1) {
                continue;
              }
            }

            // check if the parent node needs to be re-mapped
            if (hierarchyMetadata && hierarchyMetadata.mappingTable && hierarchyMetadata.mappingTable.from) {
              mapIndex = hierarchyMetadata.mappingTable.from.indexOf(datasets[property].parentNode);
              if (mapIndex > -1) {
                datasets[property].parentNode = hierarchyMetadata.mappingTable.to[mapIndex];
              }
            }

            arrData.push(datasets[property]);
          }
        }


        function buildHierarchy(arry, hierarchyMetadata) {

          var roots = [],
            children = {},
            customRoots = (hierarchyMetadata.topNodes && hierarchyMetadata.topNodes.length) ? hierarchyMetadata.topNodes : [],
            x, z;

          // find the top level nodes and hash the children based on parent
          for (x = 0; x < arry.length; x++) {
            var item = arry[x],
              p = item.parentNode;

            // check the roots
            if (customRoots.length
              && customRoots.length > 0
            ) {
              // roots may only be of type sector
              if (customRoots.indexOf(item.id) === -1 || (!customRoots.length && item.id.substring(0, 3) !== "SE-") ) {
                if (!p) {
                  continue;
                }
              } else {
                delete(item.parentNode);
                p = null;

                item.state = {
                  'opened': true
                }
              }
            }
            // if no topnodes are specified, the rootnodes are the items without a parent
            else if (!p) {
              // roots may only be of type sector
              if (item.id.substring(0, 3) !== "SE-") {
                continue;
              } else {
                item.state = {
                  'opened': true
                }
              }
            }

            var target = !p ? roots : (children[p] || (children[p] = []));
            target.push(item);
          }

          // function to recursively build the tree
          var findChildren = function (parent) {
            if (children[parent.id]) {
              parent.children = children[parent.id];
              for (var y = 0; y < parent.children.length; y++) {
                findChildren(parent.children[y]);
              }
            }
          };

          // enumerate through to handle the case where there are multiple roots
          for (z = 0; z < roots.length; z++) {
            findChildren(roots[z]);
          }
          return roots
        }

        /**
         * Sort the hierarchy nodes, first by the order defined in the configuration
         * next alphabetically
         * @param arrData
         * @param hierarchyMetadata
           */
        function sortHierNodes(arrData, hierarchyMetadata) {

          // read the sorting configuration
          var hierOrder = hierarchyMetadata.nodeOrder;

          // split the nodes:
          // - group A: items defined in the hierOrder array (will be sorted by hierOrder)
          // - group B: items not defined in the array (will be sorted alphabetically)
          var groupA = [],
            groupB = [];
          for (var x=0; x<arrData.length; x++) {
            if (!arrData[x].id || !arrData[x].name) {
              // don't do anything...
            } else if (hierOrder && hierOrder.indexOf(arrData[x].id) > -1) {
              groupA.push(arrData[x]);
            } else {
              groupB.push(arrData[x]);
            }
          }

          // sort group A
          groupA.sort(function(a, b){
            return hierOrder.indexOf(a.id) - hierOrder.indexOf(b.id);
          });

          // sort group B
          groupB.sort(function(a, b){
            if(a.name && b.name && a.name < b.name) return -1;
            if(a.name && b.name && a.name > b.name) return 1;
            return 0;
          });

          return groupA.concat(groupB);
        }

        // create the hierarchy object for jsTree
        var sortedHierNodes = sortHierNodes(arrData, hierarchyMetadata);
        return buildHierarchy(sortedHierNodes, hierarchyMetadata);
      }

    }

    function _getHierarchyMetadata(config) {
      var cfg = {
        iobjMappingFrom: "SH100534",
        iobjMappingTo: "SH100535",
        iobjBusinessElement: "SH100242",
        iobjBusinessElementParent: "SH100438",
        iobjBusinessElementParent2: "SH100439",
        iobjBusinessElementType: "SH100277",
        iobjSector: "SH000470",
        iobjMiSector: "SH100098",
        iobjSectorParent: "XX000304",
        iobjColorCode: "SH100546",
        iobjHierarchyNodeId: "SHXXXXX0",
        iobjHierarchyOrder: "SHXXXXX1"
      };

      var metadata = {
        mappingTable: null,
        nodeMetadata: null,
        nodeOrder: config["node_order"],
        topNodes: config["top_nodes"]
      };

      var sectorNodeMetadata;
      var businessElementMetadata;

      var customData = $("body").data("customData");
      if (customData) {
        for (var property in customData) {
          if (customData.hasOwnProperty(property)) {
            var data = customData[property];
            if (!data || !data.length) {
              continue;
            }

            // is mapping table query?
            if (data[0][cfg.iobjMappingFrom + "_KEY"] !== undefined
             && data[0][cfg.iobjMappingTo + "_KEY"] !== undefined) {
              metadata.mappingTable = getMappingtable(cfg, data);
            }

            // is sector metadata?
            if (data[0][cfg.iobjSector + "_KEY"] !== undefined
             && data[0][cfg.iobjSectorParent + "_KEY"] !== undefined) {
              sectorNodeMetadata = getSectorNodeMeta(cfg, data, config);
            }

            // is business element metadata?
            if (
              data[0][cfg.iobjBusinessElement + "_KEY"] !== undefined
              && (data[0][cfg.iobjBusinessElementParent + "_KEY"] !== undefined
                || data[0][cfg.iobjBusinessElementParent2 + "_KEY"] !== undefined)
              ) {
              businessElementMetadata = getBusinessElementNodeMeta(cfg, data, config);
            }
          }
        }

        metadata.nodeMetadata = $.extend(true, sectorNodeMetadata, businessElementMetadata);
      }
      return metadata;


      function getMappingtable(cfg, data) {
        var mappingTable = {
          from: [],
          to: []
        };
        for (var i=0; i<data.length; i++) {
          mappingTable.from.push(data[i][cfg.iobjMappingFrom + "_TEXT"]);
          mappingTable.to.push(data[i][cfg.iobjMappingTo + "_TEXT"]);
        }
        return  mappingTable;
      }


      function getSectorNodeMeta(cfg, data, userConfig) {
        var nodeMeta = {};

        for (var i=0; i<data.length; i++) {
          var parentNodeId = data[i][cfg.iobjSectorParent + "_KEY"];
          var hierNode = "SE-" + data[i][cfg.iobjSector + "_KEY"];
          var parentNode = data[i][cfg.iobjSectorParent + "_KEY"] ? "SE-" + data[i][cfg.iobjSectorParent + "_KEY"] : null;
          var color = (data[i][cfg.iobjColorCode + "_KEY"] !== "#") ? data[i][cfg.iobjColorCode + "_KEY"] : null;
          var name = data[i][cfg.iobjSector + "_TEXT"];

          // check if the name needs to be overwritten due to the configuration
          if (userConfig && userConfig.renaming && userConfig.renaming[hierNode]) {
            name = userConfig.renaming[hierNode];
          }

          nodeMeta[hierNode] = {
            parentNode: (parentNode !== hierNode && parentNodeId !== '#') ? parentNode : null,
            color: color,
            name: name
          }
        }
        return nodeMeta;
      }

      function getBusinessElementNodeMeta(cfg, data, userConfig) {
        var nodeMeta = {};
        for (var i=0; i<data.length; i++) {
          var hierNode = "BE-" + data[i][cfg.iobjBusinessElement + "_KEY"];
          var parentNode = null;
          var color = (data[i][cfg.iobjColorCode + "_KEY"] !== "#") ? data[i][cfg.iobjColorCode + "_KEY"] : null;
          var name = data[i][cfg.iobjBusinessElement + "_TEXT"];

          // determine the parent node
          if (data[i][cfg.iobjBusinessElementParent + "_KEY"]) {
            parentNode = "BE-" + data[i][cfg.iobjBusinessElementParent + "_KEY"];
          } else if (data[i][cfg.iobjBusinessElementParent2 + "_KEY"]) {
            parentNode = "BE-" + data[i][cfg.iobjBusinessElementParent2 + "_KEY"];
          }

          // check if the name needs to be overwritten due to the configuration
          if (userConfig && userConfig.renaming && userConfig.renaming[hierNode]) {
            name = userConfig.renaming[hierNode];
          }

          nodeMeta[hierNode] = {
            parentNode: parentNode,
            color: color,
            name: name
          };

          // if a business element type is provided, add it to the metadata
          if (data[i][cfg.iobjBusinessElementType + '_KEY']) {
            nodeMeta[hierNode].nodetype = data[i][cfg.iobjBusinessElementType + '_KEY'];
          }
        }
        return nodeMeta;
      }

    }
  };

  return my;

}(shell.app.execdblp.dataparser));

//####src/execdblpig/readers/offline/app.js
var shell = shell || {};
shell.app = shell.app || {};
shell.app.execdblp = shell.app.execdblp || {};
shell.app.execdblp.offlinereader = (function (my) {

  my.handleDeviceReady = function () {

    //   window.plugins.touchid.isAvailable(
    //     //Success callback
    //     function (type) {
    //         //navigator.notification.alert(type, null, 'Touch ID', 'OK')
    //         window.plugins.touchid.verifyFingerprint(
    //             'Scan your fingerprint please', // this will be shown in the native scanner popup
    //              function(msg) {
    //                  navigator.notification.alert('Finger print accepted', null, 'Touch ID', 'OK');
    //                 }, // success handler: fingerprint accepted
    //              function(msg) {
    //                  navigator.notification.alert('Fingerprint not accepted', null, 'Touch ID', 'OK');
    //                 } // error handler with errorcode and localised reason
    //           );
    //     }, // type returned to success callback: 'face' on iPhone X, 'touch' on other devices
    //     function (msg) {
    //         navigator.notification.alert('Fingerprint feature not available', null, 'Touch ID', 'OK')
    //     } // error handler: no TouchID available
    // );


    /** Helper functions **/
    //Callback function to read the file contents and extract the data
    var readFileSuccess = function (entry) {
      entry.file(function (file) {
        var fileReader = new FileReader();
        fileReader.onloadend = function () {
          //Store JSON in offline_data property under body
          var parsedData = JSON.parse(this.result);
          $("body").data("offline_data", parsedData);
          shell.app.execdblp.offlinereader.build(null, false);
        };
        //Read the file contents
        if (file) {
          fileReader.readAsText(file);
        }
        else {
          //Show 'No data' message
          my.showMessage("No Data", "No data available.");
        }
      }, readFileError);
    };

    var getFileError = function (err) {
      console.log("Error in getting file from dataDirectory: " + err);
    };

    var readFileError = function (err) {
      console.log("Error in reading file contents: " + err);
    };

    var readFileFromDataDirectory = function () {
      var newPath = cordova.file.dataDirectory + "/copyData.abc";
      window.resolveLocalFileSystemURI(newPath, readFileSuccess, getFileError);
    };
    /** Helper functions (end) */

    //Move file(s) from temp directory to data directory (if available)
    var tmpDirPath = cordova.file.tempDirectory + BuildInfo.packageName + "-Inbox";
    //Get access to tempDirectory
    window.resolveLocalFileSystemURI(tmpDirPath,
      function (tmpDir) {
        //Read the contents/files within tempDirectory 
        var reader = tmpDir.createReader();
        reader.readEntries(
          function (entries) {
            if (entries && entries.length > 0) {
              for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                //Promise object which is resolved once file is moved from temp to data directory
                var fileMoved = new Promise(function (resolve, reject) {
                  window.resolveLocalFileSystemURI(cordova.file.dataDirectory, function (destination) {
                    entry.moveTo(destination, "copyData.abc");
                    resolve(entry);
                  }, function (err) {
                    var errorMsg = "Error in moving the files from temp to dataDirectory: " + err;
                    console.log(errorMsg);
                    reject(errorMsg);
                  })
                });

                //Read file contents from Data directory
                var readFile = function () {
                  fileMoved.then(function () {
                      //Once the file is in data directory, extract the contents of the file to store in body tag
                      readFileFromDataDirectory();
                    })
                    .catch(function (promiseError) {
                      console.log(promiseError);
                    });
                };

                //Read file contents to get data
                readFile();
              }
            } else {
              //Check if file is available in dataDirectory
              readFileFromDataDirectory();
            }

          },
          function (err) {
            console.log("Cannot read tempDirectory files: " + err);
          }
        );
      },
      function (err) {
        console.log("Cannot get Temp directory: " + err);
        readFileFromDataDirectory();
      }
    );
  };

  my.handleDevicePause = function () {
    my.clearAppDisplay();
  };


  my.clearAppDisplay = function () {
    var $body = $("body"),
      $jbi_app_lp = $("#jbi_app_lp"),
      $jbi_app_report = $("#jbi_app_report"),
      $jbi_dev_buttons = $("#devButtons"),
      $jbi_zoom_container = $("#zoomContainer"),
      $jbi_loading_container = $("#loadingContainer");


    // Clean up entire report
    $jbi_app_lp.hide();
    $jbi_app_report.hide();
    $jbi_dev_buttons.hide();
    $jbi_zoom_container.hide();
    $jbi_loading_container.hide();
    $jbi_app_lp.html("");
    $jbi_app_report.html("");
    $jbi_dev_buttons.remove();
    $jbi_zoom_container.remove();
    $jbi_loading_container.remove();

    // remove the styles related to the current dashboard
    $("[data-repstyle='execdb']").remove();
    $("[data-repstyle='execdblp']").remove();

    // remove the data related to the current dashboard
    $body.removeData();

    $body.html('<div id="jbi_app_lp" style="display:none;"></div><div id="jbi_app_report" style="display:none;"></div>');

  };


  my.build = function (selectedPeriodId, businessId) {
    var dashboard;
    addEventListeners();
    createMILaunchPadPeriods(selectedPeriodId);

    $("body").data('initialBusiness', businessId);

    /**
     * Add the event listeners for the MI LaunchPad
     */
    function addEventListeners() {
      var $body = $("body");
      $body.unbind("periodUpdate");
      $body.on("periodUpdate", function (evt, period) {
        getDashboard(dashboard, period);
        shell.app.execdblp.openreport_offline.activateAvailableReports(period);
      });

      $body.unbind("openReport");
      $body.on("openReport", function (evt, params) {
        shell.app.execdblp.openreport_offline.openReport(params);
      });


      // Triggered each time the report section has been recreated. If the the report holding the
      // details is available, the report should get the 'active' class.
      $body.unbind("reportsUpdated");
      $body.on("reportsUpdated", function (evt) {
        var currentPeriod = shell.app.execdblp.dashboard.period_functions.getCurrentPeriod();
        var period = currentPeriod.periodNumber + "." + currentPeriod.year;
        shell.app.execdblp.openreport_offline.activateAvailableReports(period);
      });
    }


    /**
     * Create the header of the report. This part contains the
     * period selector which reads the available periods from a
     * JSON file.
     */
    function createMILaunchPadPeriods(selectedPeriodId) {

      // get the data
      //var data = shell.app.execdblp.dataprovider.getData(),//@CHECK_HACK: Taking from offline data
      var data = $("body").data("offline_data"),
        i, period,
        periodIds = [],
        periods = [];

      if (!data || !data.length) {
        my.showMessage("No Data", "No data available.");
        return;
      }


      // loop over the data and find the launchpad report name
      for (i = 0; i < data.length; i++) {
        if (data[i]["isLaunchpad"] && data[i]["isLaunchpad"] === 'X') {
          dashboard = data[i]["dashboard"];

          // set the dashboard id, sector and business element from the data
          $("body").data("customAppFilters", {
            dashboard: data[i].dashboard,
            sector: data[i].sector,
            businessElement: data[i].be
          });

          break;
        }
      }
      if (!dashboard) {
        my.showMessage("No Data", "No data available.");
        return;
      }

      // get the available periods for the launchpad
      for (i = 0; i < data.length; i++) {
        if (data[i]["dashboard"] === dashboard) {
          period = data[i]["period"];

          // the format of the periods is yyyy.mmm which should be converted to mmm.yyyy
          if (period && period !== "") {
            var periodSplit = period.toString().split(".");
            var newPeriod = periodSplit[1] + "." + periodSplit[0];

            if (periodIds.indexOf(newPeriod) === -1) {
              periodIds.push(newPeriod);
            }
          }
        }
      }


      if (!periodIds.length) {
        my.showMessage("No Data", "No data available.");
        return;
      }

      // get the names of the periods
      for (i = 0; i < periodIds.length; i++) {
        periods.push({
          id: periodIds[i],
          name: shell.app.execdblp.offlinereader.getPeriodName(periodIds[i])
        })
      }

      // assume that the period are from old to new
      periods.reverse();

      // now build the skeleton of the app
      shell.app.execdblp.dashboard.buildSkeleton("jbi_app_lp", periods, selectedPeriodId);


      // add the glossary action
      shell.app.execdblp.offlinereader.addGlossary();

      // add the download mobile file button
      if (shell && shell.app && shell.app.execdblp && shell.app.execdblp.encryption && shell.app.execdblp.encryption.getRSAPublicKey) {
        var rsaPublicKey = shell.app.execdblp.encryption.getRSAPublicKey();
        if (rsaPublicKey) {
          shell.app.execdblp.offlinereader.addDownloadMobileFileButton();
        }
      }


      $("#jbi_app_lp").show();
    }


    /**
     *
     * @param dashboard
     * @param period
     */
    function getDashboard(dashboard, period) {
      var data, offlineData, currentSnapshot, currentVersion, currentStatus, i,
        $loadingContainer = $("#loadingContainer"),
        $jbiSummary = $("#jbi_summary"),
        $jbiTrend = $("#jbi_trend"),
        $jbiReports = $("#jbi_reports");

      // clear the current dashboard
      $loadingContainer.remove();
      $jbiReports.empty();
      $jbiReports.hide();
      $jbiTrend.empty();
      $jbiTrend.hide();
      $jbiSummary.empty();
      $jbiSummary.hide();



      if (!dashboard || dashboard === "") {
        my.showMessage("No Data", "No data available.");
        return;
      }

      // get the snapshot
      //offlineData = shell.app.execdblp.dataprovider.getData();//@CHECK_HACK: Get from offline_data
      offlineData = $("body").data("offline_data");
      for (i = 0; i < offlineData.length; i++) {

        // convert the period to internal format
        var periodArray = period.split("."),
          intPeriodId = periodArray[1] + "." + periodArray[0];

        if (offlineData[i]["dashboard"] === dashboard && offlineData[i]["period"] === intPeriodId.toString()) {
          currentVersion = offlineData[i]["version"];
          currentStatus = offlineData[i]["status"];
          try {
            currentSnapshot = JSON.parse(offlineData[i]["snapshot"]);
          } catch (e) {

          }
          break;
        }
      }
      if (!currentSnapshot) {
        my.showMessage("No Data", "No data available.");
        return;
      }

      // make the report parts visible again
      $jbiSummary.show();
      $jbiTrend.show();
      $jbiReports.show();

      // extract the config and the data and build the report
      shell.app.execdblp.dashboard.updatePeriod(
        JSON.parse(LZString.decompressFromEncodedURIComponent(currentSnapshot.config)),
        JSON.parse(LZString.decompressFromEncodedURIComponent(currentSnapshot.data))
      );

      // set the version
      my._addVersion(currentVersion, currentStatus);
    }
  };


  return my;
}(shell.app.execdblp.offlinereader || {}));
//####src/execdblpig/readers/offline/mod_addmobiledownload.js
shell.app.execdblp.offlinereader = ( function (my) {

  my.addDownloadMobileFileButton = function () {
    _addHTML();
    _addEventHandlers();

    function _addHTML() {
      var svg = '<svg style="width:20px;height:20px;padding-top:7px;" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1344 928q0-14-9-23t-23-9h-224v-352q0-13-9.5-22.5t-22.5-9.5h-192q-13 0-22.5 9.5t-9.5 22.5v352h-224q-13 0-22.5 9.5t-9.5 22.5q0 14 9 23l352 352q9 9 23 9t23-9l351-351q10-12 10-24zm640 224q0 159-112.5 271.5t-271.5 112.5h-1088q-185 0-316.5-131.5t-131.5-316.5q0-130 70-240t188-165q-2-30-2-43 0-212 150-362t362-150q156 0 285.5 87t188.5 231q71-62 166-62 106 0 181 75t75 181q0 76-41 138 130 31 213.5 135.5t83.5 238.5z"/></svg>';
      $("#jbi_header_reports").before("<div id='jbi_button_mobiledownload' style='float:right;' class='jbi_header_report active' title='Download Mobile File'>" + svg + "</div>");
    }

    function _addEventHandlers() {
      var $settings = $("#jbi_button_mobiledownload");
      $settings.unbind(my.eventTrigger);
      $settings.on(my.eventTrigger, function () {

        // check if webcrypto is supported
       if (!window || !window.crypto || !window.crypto.subtle || !window.crypto.subtle.importKey) {
         alert("Web encryption is not supported by this browser. Please use Google Chrome in order to generate the mobile data file .");
         return;
       }

        // get the extension to be used
        var $customConfig = $("body").data("customConfig");
        var mobileFileExtension = ($customConfig.CONFIG.mobile && $customConfig.CONFIG.mobile.fileExtension) || "jbi";


        shell.app.execdblp.offlinereader.encryptText(
          JSON.stringify(shell.app.execdblp.dataprovider.getData()),
          shell.app.execdblp.encryption.getRSAPublicKey()
        ).then(
          function(encryptedText) {
            shell.app.execdblp.offlinereader.downloadText(generateFileName() + "." + mobileFileExtension, JSON.stringify(encryptedText));
          },
          function(err) {
            alert("An error occurred during the generation of the mobile file.");
            console.error(err);
          }
        )
      });
    }
  };

  function generateFileName() {
    var reportData = shell.app.execdblp.dataprovider.getData();
    if (!reportData || !reportData.length) {
      return "data";
    }

    var reportName,
        allPeriods = [];
    for (var i=0; i<reportData.length; i++) {
      if (!reportName && reportData[i].isLaunchpad === "X") {
        reportName = reportData[i].dashboard;
      }
      allPeriods.push( reportData[i].period.replace(".", "-") );
    }

    // set a default value for the report name
    if (!reportName) {
      reportName = "REPORT";
    }

    // get the first and last period
    if (!allPeriods.length) {
      return reportName + "_" + "DATA";
    } else if (allPeriods.length === 1) {
      return reportName + "_" + allPeriods[0];
    } else {
      allPeriods.sort();
      return reportName + "_" + allPeriods[0] + "_" + allPeriods[ allPeriods.length - 1 ];
    }
  }

  return my;
}(shell.app.execdblp.offlinereader || {}));

//####src/execdblpig/readers/offline/mod_addversion.js
shell.app.execdblp.offlinereader = ( function (my) {

  my._addVersion = function(versionNumber, statusNumber) {

    // first remove the div
    $("#jbi_version").remove();

    if (!versionNumber) {
      return;
    }

    var statusName = "";
    if (statusNumber && statusNumber.toString() === "10") {
      statusName = " - DRAFT";
    }

    // get the configuration for the styles
    var customConfig = $("body").data("customConfig"),
      headerConfig = (customConfig && customConfig["CONFIG"] && customConfig["CONFIG"]["header"]) ? customConfig["CONFIG"]["header"] : {},
      posX = headerConfig["VersionXPositionPixels"] || 10,
      posY = headerConfig["VersionYPositionPixels"] || 10,
      fontColor = headerConfig["VersionFontColor"] || "black",
      fontSize = headerConfig["VersionFontSizePixels"] || 12;

    var html = "";
//@formatter:off
    html += "<div id='jbi_version'";
    html += "   style='position:absolute;font-family:tahoma;left:" + posX + "px;top:" + posY + "px;color:" + fontColor + ";font-size:" + fontSize + "px;'>";
    html += "Version " + versionNumber + statusName;
    html += "</div>";
//@formatter:on

    $("#jbi_app").append(html);


  };


  return my;
}(shell.app.execdblp.offlinereader || {}));

//####src/execdblpig/readers/offline/mod_getperiods.js
shell.app.execdblp.offlinereader = ( function (my) {

  my.getPeriodName = function(period) {
    var periodArray = period.split("."),
      year = periodArray[1],
      periodNum = periodArray[0],
      periodName = "";

    switch (parseInt(periodNum)) {
      case 1:
        periodName = "January";
        break;
      case 2:
        periodName = "February";
        break;
      case 3:
        periodName = "March";
        break;
      case 4:
        periodName = "April";
        break;
      case 5:
        periodName = "May";
        break;
      case 6:
        periodName = "June";
        break;
      case 7:
        periodName = "July";
        break;
      case 8:
        periodName = "August";
        break;
      case 9:
        periodName = "September";
        break;
      case 10:
        periodName = "October";
        break;
      case 11:
        periodName = "November";
        break;
      case 12:
        periodName = "December";
        break;
    }
    return  year + " - " + periodName;
  };

  return my;
}(shell.app.execdblp.offlinereader || {}));

//####src/execdblpig/readers/offline/mod_glossary.js
shell.app.execdblp.offlinereader = ( function (my) {

  my.addGlossary = function () {

    _addCSS();
    _addEventHandlers();


    function _addCSS() {
      //@formatter:0ff
      var s = "";
      s += "<style type='text/css' id='CSS_GLOSSARY' data-repstyle='execdblp'>";
      s += "#jbi_glossary {";
      s += "  position: absolute;";
      s += "  top: 0;";
      s += "  bottom: 0;";
      s += "  left: 0;";
      s += "  right: 0;";
      s += "  background-color: white;";
      s += "  z-index: 100;";
      s += "}";
      s += "#jbi_glossary .jbi_header {";
      s += "  position: relative;";
      s += "  display: block;";
      s += "  height: 35px;";
      s += "}";
      s += "#jbi_glossary .jbi_header_logo {";
      s += "  width: 50px;";
      s += "  height: 50px;";
      s += "  position: absolute;";
      s += "  top: 0px;";
      s += "  left: 4px;";
      s += "}";
      s += "#jbi_glossary .jbi_header_title {";
      s += "  position: absolute;";
      s += "  display: inline-block;";
      s += "  line-height: 35px;";
      s += "  color: #dd1d21;";
      s += "  font-family: Futura, 'Trebuchet MS', Arial, sans-serif;";
      s += "  font-size: 14px;";
      s += "  font-weight: bold;";
      s += "  left: 70px;";
      s += "  top: 0px;";
      s += "  text-transform: uppercase;";
      s += "}";
      s += "#jbi_glossary .jbi_header_subtitle {";
      s += "  position: absolute;";
      s += "  font-family: tahoma;";
      s += "  left: 70px;";
      s += "  top: 24px;";
      s += "  color: #dd1d21;";
      s += "  font-size: 11px;";
      s += "}";
      s += "#jbi_glossary_close {";
      s += "  height: 50px;";
      s += "  width: 50px;";
      s += "  float: right;";
      s += "  cursor: pointer;";
      s += "  margin-top: 5px;";
      s += "  text-align: center;";
      s += "}";
      s += ".jbi_glossary_content {";
      s += "  position: absolute;";
      s += "  top: 60px;";
      s += "  left: 10px;";
      s += "  right: 10px;";
      s += "  bottom: 10px;";
      s += "  border: 1px solid lightgrey;";
      s += "  box-sizing: border-box;";
      s += "  font-family: Verdana, Geneva, sans-serif;";
      s += "  font-size: 12px;";
      s += "  text-align: justify;";
      s += "  color: #404040;";
      s += "  overflow: auto;";
      s += "  padding: 20px;";
      s += "  padding-top: 0px;";
      s += "}";

      s += "#jbi_glossary_content ul {";
      s += "  margin-top: -10px;";
      s += "}";

      s += "#jbi_glossary_content .title {";
      s += "  font-weight: bold;";
      s += "  margin-top: 30px;";
      s += "}";

      s += "#jbi_glossary_content .subtitle {";
      s += "  margin-top: 20px;";
      s += "  margin-bottom: 0px;";
      s += "  font-style: italic;";
      s += "}";


      s += "#jbi_glossary_content p {";
      s += "  margin-top: 5px;";
      s += "  text-align: justify;";
      s += "}";

//@formatter:on
      s += "</style>";
      $(s).appendTo("head");

    }


    function _addEventHandlers() {
      var $glossary = $("#jbi_header_glossary");
      $glossary.unbind(my.eventTrigger);
      $glossary.on(my.eventTrigger, function () {
        my.addGlossaryWindow();
      });
    }
  };

  my.addGlossaryWindow = function() {
    _addHTML();
    _addEventHandlers();


    function _addHTML() {
      var $jbi_app_lp = $("#jbi_app");

//@formatter:0ff
      var svgClose = '<svg style="width:40px;height:40px;" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1225 1079l-146 146q-10 10-23 10t-23-10l-137-137-137 137q-10 10-23 10t-23-10l-146-146q-10-10-10-23t10-23l137-137-137-137q-10-10-10-23t10-23l146-146q10-10 23-10t23 10l137 137 137-137q10-10 23-10t23 10l146 146q10 10 10 23t-10 23l-137 137 137 137q10 10 10 23t-10 23zm215-183q0-148-73-273t-198-198-273-73-273 73-198 198-73 273 73 273 198 198 273 73 273-73 198-198 73-273zm224 0q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"/></svg>'
      var s = "";
      s += "<div id='jbi_glossary'>";
      s += "<div class='jbi_header'>";
      s += '<img class="jbi_header_logo" src="' + my._getLogoBase64() + '">';
      s += '<div class="jbi_header_title">Executive Dashboarding - Glossary</div>';
      s += '<div id="jbi_glossary_close">' + svgClose + '</div>';
      s += "</div>";
      s += "<div class='jbi_glossary_content' id='jbi_glossary_content'>";

      s += "<div class='title'>A. Earnings on a current cost of supplies basis attributable to shareholders</div>";
      s += "<p>Segment earnings are presented on a current cost of supplies basis (CCS earnings), which is the earnings measure used";
      s += " by the Chief Executive Officer for the purposes of making decisions about allocating resources and assessing";
      s += " performance. On this basis, the purchase price of volumes sold during the period is based on the current cost of";
      s += " supplies during the same period after making allowance for the tax effect. CCS earnings therefore exclude the effect";
      s += " of changes in the oil price on inventory carrying amounts. Sales between segments are based on prices generally";
      s += " equivalent to commercially available prices.</p>";

      s += "<p>CCS earnings attributable to Royal Dutch Shell plc shareholders excludes the non-controlling interest share of CCS";
      s += " earnings.</p>";

      s += "<div class='title'>B. Identified items</div>";
      s += "<p>Identified items comprise: divestment gains and losses, impairments, fair value accounting of commodity derivatives";
      s += " and certain gas contracts, redundancy and restructuring, the impact of exchange rate movements on certain deferred tax";
      s += " balances, and other items. These items, either individually or collectively, can cause volatility to net income, in";
      s += " some cases driven by external factors, which may hinder the comparative understanding of Shell’s financial results";
      s += " from period to period.</p>";

      s += "<p>The categories above represent the nature of the items identified irrespective of whether the items relate to Shell";
      s += " subsidiaries or joint ventures and associates. The after-tax impact of identified items of joint ventures and";
      s += " associates is fully reported within “Share of profit and joint ventures and associates” on the Consolidated Statement";
      s += " of Income. Identified items related to subsidiaries are consolidated and reported across appropriate lines of the";
      s += " Consolidated Statement of Income. Only pre-tax identified items reported by subsidiaries are taken into account in the";
      s += " calculation of “underlying operating expenses” (Definition F).</p>";

      s += "<p>Fair value accounting of commodity derivatives and certain gas contracts: In the ordinary course of business, Shell";
      s += "enters into contracts to supply or purchase oil and gas products as well as power and environmental products.";
      s += " Derivative contracts are entered into for mitigation of resulting economic exposures (generally price exposure) and";
      s += " these derivative contracts are carried at period-end market price (fair value), with movements in fair value";
      s += " recognised in income for the period. Supply and purchase contracts entered into for operational purposes are, by";
      s += " contrast, recognised when the transaction occurs (see also below); furthermore, inventory is carried at historical";
      s += " cost or net realisable value, whichever is lower. As a consequence, accounting mismatches occur because: (a) the";
      s += " supply or purchase transaction is recognised in a different period; or (b) the inventory is measured on a different";
      s += " basis. In addition, certain UK gas contracts held by Upstream are, due to pricing or delivery conditions, deemed to";
      s += " contain embedded derivatives or written options and are also required to be carried at fair value even though they are";
      s += " entered into for operational purposes. The accounting impacts of the aforementioned are reported as identified";
      s += "items.</p>";

      s += "<p>Impacts of exchange rate movements on tax balances represent the impact on tax balances of exchange rate movements";
      s += " arising on (a) the conversion to dollars of the local currency tax base of non-monetary assets and liabilities, as";
      s += " well as losses (this primarily impacts the Integrated Gas and Upstream segments) and (b) the conversion of";
      s += " dollar-denominated inter-segment loans to local currency, leading to taxable exchange rate gains or losses (this";
      s += " primarily impacts the Corporate segment).</p>";

      s += "<p>Other identified items represent other credits or charges Shell’s management assesses should be excluded to provide";
      s += " additional insight, such as certain provisions for onerous contracts or litigation.</p>";

      s += "<div class='title'>C. Free cash flow</div>";
      s += "<p>Free cash flow is used to evaluate cash available for financing activities, including dividend payments, after";
      s += " investment in maintaining and growing our business. It is defined as the sum of “Cash flow from operating activities”";
      s += " and “Cash flow from investing activities”.</p>";

      s += "<div class='title'>D. Capital investment</div>";
      s += "<p>Capital investment is a measure used to make decisions about allocating resources and assessing performance. It";
      s += " comprises capital expenditure, exploration expense excluding well write-offs, new investments in joint ventures and";
      s += " associates, new finance leases and investments in Integrated Gas, Upstream and Downstream securities, all of which on";
      s += " an accruals basis. In 2016, it also included the capital investment related to the acquisition of BG Group plc.</p>";

      s += "<p>Organic capital investment includes capital expenditure and new finance leases of existing subsidiaries, investments";
      s += " in existing joint ventures and associates, and exploration expense (excluding well write-offs).</p>";

      s += "<p>Inorganic capital investment includes investments related to the acquisition of businesses, investments in new joint";
      s += " ventures and associates, and new acreage.</p>";

      s += "<div class='title'>E. Divestments</div>";
      s += " <p>Divestments is a measure used to monitor the progress of Shell’s divestment programme. This measure comprises";
      s += " proceeds from sale of property, plant and equipment and businesses, joint ventures and associates, and other";
      s += " Integrated Gas, Upstream and Downstream investments, reported in “Cash flow from investing activities”, adjusted onto";
      s += " an accruals basis and for any share consideration received or contingent consideration recognised upon divestment, as";
      s += " well as proceeds from the sale of interests in entities while retaining control (for example, proceeds from sale of";
      s += " interest in Shell Midstream Partners, L.P.), which are included in “Change in non-controlling interest” within “Cash";
      s += " flow from financing activities”.</p>";

      s += "<div class='title'>F. Operating expenses</div>";
      s += "<p>Operating expenses is a measure of Shell’s total operating expenses performance, comprising the following items from";
      s += " the Consolidated Statement of Income: production and manufacturing expenses; selling, distribution and administrative";
      s += " expenses; and research and development expenses.</p>";
      s += "<p>Underlying operating expenses measures Shell’s total operating expenses performance excluding identified items.</p>";

      s += "<div class='title'>G. Return on average capital employed</div>";
      s += "<p>Return on average capital employed (ROACE) measures the efficiency of Shell’s utilisation of the capital that it";
      s += " employs. In this calculation, ROACE on a CCS basis excluding identified items is defined as the sum of CCS earnings";
      s += " attributable to shareholders excluding identified items for the current and previous three quarters, as a percentage";
      s += " of the average capital employed for the same period. Capital employed consists of total equity, current debt and";
      s += " non-current debt.</p>";

      s += "<div class='title'>H. Downstream Availability Metric</div>";
      s += "<p class='subtitle'>(i) Utilisation</p>";
      s += "<p>The percentage of the annual business plan rated capacity actually used in a specified timeframe. Utilization";
      s += " incorporates the effects of all shutdown and slowdown incidents that affect throughput at a location, regardless of";
      s += " origin. As rated capacity does not define a hard limit on utilisation, there may be occasions in which utilisation";
      s += " exceeds 100% for a particular unit.</p>";
      s += "<p>Note: Utilization >100%: Normally, the summation of Utilization, Under Utilization, Unplanned Downtime Controllable,";
      s += "  Unplanned Downtime Uncontrollable and Planned Downtime, should equal the rated capacity each month. Under certain";
      s += " circumstances where a unit operates at optimum performance, the actual Utilization of a unit can exceed the rated";
      s += " capacity of that unit. This would cause the summation of these categories to exceed the total rated capacity of the";
      s += " site and therefore the sum may exceed 100%. This scenario is expected to occur only on few days during the month,";
      s += "  however if a unit appears to continually run above 100% it would lead to a review of the rated capacity for the next";
      s += " year’s business plan. The underlying business measure/objective is to maximize economic utilization of sites and hence";
      s += " in scenarios where it makes economic sense to run assets harder the site would run at greater than rated capacity to";
      s += " realize maximum benefit.</p>";

      s += "<p class='subtitle'>(ii) Uneconomic</p>";
      s += "<p>The percentage of rated capacity that a site does not use as a result of optimizing the utilization of the available";
      s += " capacity.</p>";
      s += "<p>Reasons for not utilizing the available capacity include (list not exhaustive):</p>";
      s += "<ul>";
      s += "<li>Economics (negative processing margin)</li>";
      s += "<li>Feed quality considerations</li>";
      s += "<li>Product demand (seasonality)</li>";
      s += "<li>Inherent design mismatch in the sizing of units</li>";
      s += "<li>Turnaround timing of upstream/downstream units, etc.</li>";
      s += "</ul>";

      s += "<p class='subtitle'>(iii) Unplanned Downtime Controllable</p>";
      s += "<p>The percentage of rated capacity that is lost due to controllable unplanned events.</p>";
      s += "<p>Controllable unplanned events are unexpected shutdowns or slowdowns:</p>";
      s += "<ul>";
      s += "<li>Not included in the current year business plan as planned downtime</li>";
      s += "<li>Not due to Under Utilization as defined above</li>";
      s += "<li>Not due to abnormal events outside the control of the location and/or the corporation (abnormal weather events,";
      s += " non-site/Shell related labor strikes, regional power outages, etc.)";
      s += "</li>";
      s += "</ul>";

      s += "<p class='subtitle'>(iv) Unplanned Downtime Uncontrollable</p>";
      s += "<p>The percentage of rated capacity that is lost due to uncontrollable unplanned events.</p>";
      s += "<p>Uncontrollable Unplanned events are unexpected shutdowns or slowdowns due to abnormal events that account for at";
      s += "  least 1% of the site’s monthly rated capacity. Approval is required before events are categorized as uncontrollable";
      s += " unplanned downtime and if not approved will be classified as controllable unplanned downtime.</p>";
      s += "<p>Common events that may be approved as uncontrollable include (list not exhaustive):</p>";
      s += "<ul>";
      s += "<li>Power outages to a region</li>";
      s += "<li>Unusual weather or acts of nature, only if truly unavoidable (hurricane/typhoon/earthquakes)</li>";
      s += "<li>Regional/national labor strife where the site and company have no influence</li>";
      s += "</ul>";

      s += "<p class='subtitle'>(v) Planned Downtime</p>";
      s += "<p>The percentage of rated capacity that is lost due to shutdown, turnaround, or slowdown activities that are included";
      s += " in the annual business plan.</p>";

      s += "<p class='subtitle'>(vi) Availability</p>";
      s += "<p>The availability of a site is defined as the portion of capacity that was not lost due to planned or unplanned";
      s += " events. This defines a site’s capability to run without any economic slowdowns or shutdowns. The underlying business";
      s += " measure/objective is to drive improvement in reliability of a site (i.e. reduce UPDT and PDT) hence availability being";
      s += " defined as fixed at 100% leaving only the PDT & UPDT as the variable/controllable elements.</p>";

      s += "<p>Availability Internal reporting = 100% - Planned Downtime% - UPDT Controllable%</p>";

      s += "<p>Availability External reporting = 100% - Planned Downtime% - UPDT Controllable% - UPDT Uncontrollable%</p>";

      s += "</div>";
      s += "</div>";
//@formatter:on

      $jbi_app_lp.append(s);
      $jbi_app_lp.show();
    }


    function _addEventHandlers() {

      // Close the settings window
      var $jbi_glossary_close = $("#jbi_glossary_close");
      $jbi_glossary_close.unbind(my.eventTrigger);
      $jbi_glossary_close.on(my.eventTrigger, function () {
        var $jbi_glossary = $("#jbi_glossary");
        $jbi_glossary.hide();
        $jbi_glossary.remove();
      });
    }
  };


  return my;
}(shell.app.execdblp.offlinereader || {}));

//####src/execdblpig/readers/offline/mod_logo.js
shell.app.execdblp.offlinereader = ( function (my) {

  /**
   * Handle the periods
   * @private
   */
  my._getLogoBase64 = function () {
    return "data:image/png;base64,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";
  };

  return my;

}(shell.app.execdblp.offlinereader));

//####src/execdblpig/readers/offline/mod_messagedisplayer.js
shell.app.execdblp.offlinereader = ( function (my) {

  /**
   * Show a message in the front-end
   * @param title {string} the title of the message
   * @param message {string} the contents of the message
     */
  my.showMessage = function (title, message) {
//@formatter:off
    var s = "";
    s += "<div id='loadingContainer' style='width:330px;padding:5px;position:fixed;top:50%;left:50%;margin:-70px 0 0 -170px;background-color:#EEEEEE;border-radius:5px;font-family: Verdana, Geneva, sans-serif;font-size: 16px;'>";
      s += "<div class=\"loadingTitle\" style='font-weight:bold;text-align:center;line-height:30px;border-bottom:1px solid white;'>" + title + "</div>";
      s += "<div class=\"loadingText\" style='padding:16px;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;font-size:14px;line-height: 20px;'>" + message + "</div>";
    s += "</div>";
//@formatter:on
    $("body").append(s);

  };

  return my;
}(shell.app.execdblp.offlinereader || {}));

//####src/execdblpig/readers/offline/mod_rsa_encryption.js
shell.app.execdblp.offlinereader = ( function (my) {

  /**
   * Encrypts a text using AES and RSA encryption
   * @param plainText     {String}  Text that will be encrypted
   * @param rsaPublicKey  {String}  RSA Public Key that will be used (PEM) as string
   * @returns {{
   *    key:  string      RSA encrypted aesKey and aesIV (both 16 characters long)
   *    text: string      AES encrypted text
   * }}
   */
  my.encryptText = function (plainText, rsaPublicKey) {
    var deferred = $.Deferred(),
      aesObject = aesEncryption(plainText);

    rsaEncryption(
      aesObject.secretKey + aesObject.initializationVector,
      rsaPublicKey
    ).then(
      function (rsaEncryptedText) {
        deferred.resolve({
          key: rsaEncryptedText,
          text: aesObject.encryptedTextAsBase64
        });
      },
      function () {
        deferred.reject("Unable to encrypt the message");
      }
    );

    return deferred.promise();
  };


  /**
   * RSA encryption
   * @param   plainText    {string} The text that needs to be encrypted using the RSA encryption
   * @param   rsaPublicKey {string} The RSA public key (PEM) which will be used to encrypt the text
   * @returns              {Promise} Resolved with the encrypted text as base64
   */
  function rsaEncryption(plainText, rsaPublicKey) {
    var deferred = $.Deferred();
    crypto.subtle.importKey(
      "spki",
      convertPemToBinary(rsaPublicKey),
      {
        name: "RSA-OAEP",
        hash: {
          name: "SHA-512"
        }
      },
      false,
      ["encrypt"]
    ).then(
      function (publicKey) {
        crypto.subtle.encrypt({
            name: 'RSA-OAEP'
          },
          publicKey,
          stringToArrayBuffer(plainText)
        ).then(
          function (encryptedArrayBuffer) {
            deferred.resolve(arrayBufferToBase64(encryptedArrayBuffer));
          },
          function () {
            deferred.reject("Error during the encryption.");
          }
        );
      },
      function () {
        deferred.reject("Error during the retrieval of the public key.");
      }
    );
    return deferred.promise();
  }


  /**
   * Converts a RSA public key (PEM) to a binary object
   * @param   pem {string}     The RSA public key (PEM) which will be used to encrypt the text
   * @returns     {Uint8Array} The RSA public key as binary object (Array Buffer)
   */
  function convertPemToBinary(pem) {
    var lines = pem.split('\n');
    var encoded = '';
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].trim().length > 0 &&
        lines[i].indexOf('-BEGIN RSA PRIVATE KEY-') < 0 &&
        lines[i].indexOf('-BEGIN RSA PUBLIC KEY-') < 0 &&
        lines[i].indexOf('-BEGIN PUBLIC KEY-') < 0 &&
        lines[i].indexOf('-END PUBLIC KEY-') < 0 &&
        lines[i].indexOf('-END RSA PRIVATE KEY-') < 0 &&
        lines[i].indexOf('-END RSA PUBLIC KEY-') < 0) {
        encoded += lines[i].trim();
      }
    }
    return base64StringToArrayBuffer(encoded);
  }


  /**
   * AES Encryption
   * Advanced Encryption Standard uses a symmetric-key algorithm, meaning the same key is used for both encrypting
   * and decrypting the data. AES encryption can be used for large amounts of data.
   * @param plainText {String}    Text to encrypt
   * @returns {{
     *      secretKey: string,
     *      initializationVector: string,
     *      encryptedTextAsBase64: string}
     * }
   */
  function aesEncryption(plainText) {

    // The AES encryption requires a secret key (key) and an initialization vector (IV). Important is that the
    // same IV may never be used for two messages. Below a random key and a random IV will be generated every time
    // the plain text is encrypted
    var secretKey = generateRandomKey(16),
      initializationVector = generateRandomKey(16);

    // Use the Crypto library for the encryption
    var mode = new Crypto.mode.CFB(Crypto.pad.pkcs7),
      input_bytes = Crypto.charenc.UTF8.stringToBytes(plainText),
      key = Crypto.charenc.UTF8.stringToBytes(secretKey),
      options = {
        iv: Crypto.charenc.UTF8.stringToBytes(initializationVector),
        asBytes: true,
        mode: mode
      },
      encrypted = Crypto.AES.encrypt(input_bytes, key, options);

    return {
      secretKey: secretKey,
      initializationVector: initializationVector,
      encryptedTextAsBase64: arrayBufferToBase64(encrypted)
    }
  }


  /**
   * Generate a random string
   * @param keyLength {Number}  The length of the random string
   * @returns {string}          The random string
   */
  function generateRandomKey(keyLength) {
    var _keyLength = keyLength || 10,
      text = "",
      possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < _keyLength; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }


  /**
   * Converts a base64 encoded string to binary object
   * @param   b64str {String}     Base64 encoded string
   * @returns        {Uint8Array} Binary object
   */
  function base64StringToArrayBuffer(b64str) {
    var byteStr = atob(b64str);
    var bytes = new Uint8Array(byteStr.length);
    for (var i = 0; i < byteStr.length; i++) {
      bytes[i] = byteStr.charCodeAt(i);
    }
    return bytes;
  }


  /**
   * Converts a string to an ArrayBuffer
   * @param    s {String}     String
   * @returns    {Uint8Array} Binary object
   */
  function stringToArrayBuffer(s) {
    var enc = new TextEncoder("utf-16");
    return enc.encode(s);
  }


  /**
   * Converts an array buffer to a base64 encoded string
   * @param   buffer {Uint8Array} Binary object
   * @returns        {string}     Base64 Encoded string
   */
  function arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }


  return my;

}(shell.app.execdblp.offlinereader));

//####src/execdblpig/readers/offline/mod_utilities.js
shell.app.execdblp.offlinereader = ( function (my) {

  // check for mobile thingies
  my.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  my.eventTrigger = (my.isMobile) ? "touchstart" : "click";
  my.hasCordova = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;



  my.downloadText = function(fileName, fileContents) {

    // only proceed if there is data
    if (fileContents === "") {
      alert("Nothing to download...");
      return;
    }

    // create the blob (file contents)
    var blob = new Blob([fileContents], {type: 'text/json'}),
      e = document.createEvent('MouseEvents'),
      a = document.createElement('a');

    // simulate a click;
    a.download = fileName;
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    a.dispatchEvent(e)
  };


  return my;


}(shell.app.execdblp.offlinereader));

//####src/execdblpig/openreport/offline/app.js
var shell = shell || {};
shell.app = shell.app || {};
shell.app.execdblp = shell.app.execdblp || {};
shell.app.execdblp.openreport_offline = (function (my) {

  /**
   * Make the available reports clickable. In the online variant
   * all the reports should be active.
   */
  my.activateAvailableReports = function (period) {
    //var offlineData = shell.app.execdblp.dataprovider.getData(),
    var offlineData = $("body").data("offline_data"),
      availableReports = [],
      i;

    // get all the reports that are available
    for (i = 0; i < offlineData.length; i++) {


      // convert the period into the internal format
      var periodArray = period.split("."),
        intPeriodId = periodArray[1] + "." + periodArray[0];

      if (offlineData[i].period === intPeriodId.toString() &&
        (!offlineData[i]["isLaunchpad"] || offlineData[i]["isLaunchpad"] !== "X") &&
        (!offlineData[i]["hasError"] || offlineData[i]["hasError"] !== "X")) {

        availableReports.push(offlineData[i]["dashboard"]);
      }
    }

    // add the active class to the available reports
    var reportTiles = $(".jbi_report");
    for (i = 0; i < reportTiles.length; i++) {
      var reportTileDashboard = $(reportTiles[i]).data("reportid");
      if (availableReports.indexOf(reportTileDashboard) !== -1) {
        $(reportTiles[i]).addClass("active");
      }
    }
  };


  /**
   * Opens a detail report
   * @param params
   */
  my.openReport = function (params) {
    var $body = $("body"),
      $customAppFilters = $body.data("customAppFilters"),
      reportId = (params && params.dashboardParams && params.dashboardParams.dashboard) ? params.dashboardParams.dashboard : $customAppFilters.dashboard,
      periodObj = shell.app.execdblp.dashboard.period_functions.getCurrentPeriod(),
      period = periodObj.periodNumber + "." + periodObj.year,
      initialView = {};

    // remove the styles related to the current dashboard
    $("[data-repstyle='execdblp']").remove();

    // build the report
    var $jbi_app_lp = $("#jbi_app_lp");
    $jbi_app_lp.hide();
    $jbi_app_lp.html("");
    $("#jbi_app_report").show();

    var  offlineData = $body.data("offline_data").slice(0);

    // remove the offline data
    $body.removeData();
     //add the generic data
     $body.data("offline_data",offlineData);

    // if provided, get the initialView parameters
    if (params && params.dashboardParams) {
      Object.keys(params.dashboardParams).forEach(function (item, index) {
        if (item === "menuItemId" || item === 'businessId') {
          initialView[item] = params.dashboardParams[item];
        } else if (item.indexOf('filter') !== -1) {
          initialView.filters = initialView.filters || [];
          initialView.filters.push({
            id: item.substr(6),
            value: params.dashboardParams[item]
          });
        }
      });
      $body.data('initialView', initialView);
      $body.data('initialBusiness', params.dashboardParams.businessId);
    }

    shell.app.execdb.offlinereader.build("jbi_app_report", reportId, $customAppFilters.sector, $customAppFilters.businessElement, period);
  };

  return my;
}(shell.app.execdblp.openreport_offline || {}));
//####src/execdb/dashboard/app.js
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

//####src/execdb/dashboard/mod_bulletchart.js
shell.app.execdb.dashboard = ( function (my) {

  /**
   * Generates table
   *
   * This is a generic function that is used to generate the HTML for a table
   *
   * @param containerDiv   the ID of the HTML div element in which the object
   *                       needs to be rendered
   * @param config         the configuration settings for the bullet chart
   * @param dataId         the ID of the data for the object
   * @param businessData   the data for the selected business
   */
  my._createBulletChart = function (containerDiv, config, dataId, businessData) {

    // get the data
    var $body = $("body"),
      customConfig = $body.data("customConfig"),
      dataset = [];
    if (customConfig && businessData && businessData.kpis && dataId) {

      // split the kpis
      var kpis = dataId.split(";");
      for (var i = 0; i < kpis.length; i++) {
        var kpi = kpis[i];

        // check for specific configuration settings
        // config string is build up like 100.01[{'text':'abc'}]
        // find the [ and the ] character in the string to see if a configuration setting exist
        var startConfigIndex = kpi.indexOf("[");
        var endConfigIndex = kpi.lastIndexOf("]");
        var kpiConfig = {};
        if ( (startConfigIndex > -1) && (endConfigIndex > -1)) {
          var cfgString = kpi.substring(startConfigIndex + 1, endConfigIndex);
          kpi = kpi.substring(0, startConfigIndex);
          try{
            kpiConfig = JSON.parse(cfgString)
          } catch(err) {
            console.error("Unable to parse configuration string for kpi " + kpi)
          }
        }

        // the ++ indicate the children which will be processed later
        if (kpi === "++") {
          continue;
        }

        // try to read the dataset
        if (kpi === "EMPTY") {
          dataset.push({
            Group: ''
          });

        } else if (businessData.kpis[kpi] && businessData.kpis[kpi].data) {
          dataset.push($.extend({_kpi: kpi}, businessData.kpis[kpi].data, true));

          // check if the children need to be displayed
          if (i < kpis.length && kpis[i + 1] === '++') {

            // check if the child needs to be hidden due to configuration settings
            var hideChildren = config["HideChildren"] ? config["HideChildren"].split(";") : [];

            dataset[dataset.length - 1].Group = businessData.text;

            // get the children
            var businessDatasets = $body.data("customDataApp").datasets;
            var nodeInfo = $("#jbi_businesses").jstree().get_node(businessData.id);
            if (nodeInfo && nodeInfo.children && nodeInfo.children.length) {
              for (var y = 0; y < nodeInfo.children.length; y++) {

                // check if child is in the 'to hide' table
                if (hideChildren.indexOf(nodeInfo.children[y]) > -1) {
                  continue;
                }

                // check if there is data for the child
                var childKpis = businessDatasets[nodeInfo.children[y]];
                if (childKpis.kpis && childKpis.kpis[kpi] && childKpis.kpis[kpi].data){
                  dataset.push($.extend({}, childKpis.kpis[kpi].data, true));
                } else {
                  dataset.push({})
                }

                dataset[dataset.length - 1].Group = "   " + childKpis.text;
              }
            }
          }
        }
      }
    }


    // fill an array with the column information
    var columnConfig = getColumnConfiguration(config, dataset);
    if (columnConfig.error) {
      $body.trigger("showContainerMessage", {
        container: containerDiv,
        message: columnConfig.message,
        type: columnConfig.message_type
      });
      return;
    }

    if (!columnConfig.error) {
      addCSS(containerDiv, config, columnConfig);
      addHTML(containerDiv, config, columnConfig, dataset);
      _buildBullets(containerDiv, config);

      addEventListeners();
    }



    function addEventListeners() {
      var $body = $("body");
      var editMode = ($body.data("comment_edit_mode"));

      if (editMode) {
        var $commentBox = $("[data-commentcol='x']");
        $commentBox.unbind("blur");
        $commentBox.on("blur", function (evt) {
          var commentText = evt.currentTarget.innerHTML;
          var containerId = $(this).data("commentid");
          my._writeComment(commentText, containerId)
        });
      }
    }

    function getColumnConfiguration(config, dataset) {
      if (!config || !config["DataPoints"]) {
        return {
          error: true,
          message: "No configuration for datapoints set.",
          message_type: "E"
        };
      }

      // make sure that data is available
      var dataAvailable = false;
      if (dataset && dataset.length) {
        for (var rowIndex=0; rowIndex<dataset.length; rowIndex++) {
          var rowObject = dataset[rowIndex];
          for (var columnName in rowObject) {
            if (rowObject.hasOwnProperty(columnName)) {
              if (columnName !== "Group") {
                dataAvailable = true;
                break;
              }
            }
          }
          if (dataAvailable) {
            break;
          }
        }
      }
      if (!dataAvailable) {
        return {
          error: true,
          message: "No data available.",
          message_type: "W"
        };
      }

      // determine which periods are valid for the current month
      var periodSettings = JSON.parse(config["DataPoints"]);
      var currentPeriod = my.period_functions.getCurrentPeriod().periodShortName;
      var columnConfig = {};
      for (i=0; i<periodSettings.length; i++) {
        if (periodSettings[i].months.indexOf(currentPeriod) > -1) {
          columnConfig = periodSettings[i];
          break;
        }
      }
      return columnConfig;
    }



    /**
     * Generates the CSS for table
     *
     * The CSS settings are provided via the configuration. CSS can be set for an
     * entire table, a table column, a table row or a specific table cell.
     * This function generates a CSS string which will then be added to the header
     * of the document.
     *
     * @param containerDiv   the ID of the HTML div element in which the object
     *                       needs to be rendered
     * @param config         the total configuration object
     * @param columnConfig   an object holding the configuration settings for the
     *                       columns
     */
    function addCSS(containerDiv, config, columnConfig) {

      // the CSS is provided in the settings
      if (!config || !config.settings || !config.settings.length) {
        return;
      }

      // create the CSS string
      var s = "";
      s += "<style type='text/css' id='CSS_TABLE_" + containerDiv + "' data-group='LAYOUT'  data-repstyle='execdb'>";

      for (var i = 0; i < config.settings.length; i++) {

        // check if a CSS setting is provided
        if (config.settings[i].css !== undefined && config.settings[i].css !== null) {

          // settings per row
          var className = "";

          if (config.settings[i].rowIndex !== undefined &&
            config.settings[i].colIndex === undefined) {
            if (config.settings[i].rowIndex === "*") {
              className += " tr";
            } else if (config.settings[i].rowIndex === "{odd}") {
              className += " tr:nth-child(odd)";
            } else if (config.settings[i].rowIndex === "{even}") {
              className += " tr:nth-child(even)";
            } else if (config.settings[i].rowIndex === "{hover}") {
              if (my.isMobile) {
                continue;
              }
              className += " tr:hover";
            } else if (config.settings[i].rowIndex === 0) {
              className += " th";
            } else if (("" + config.settings[i].rowIndex).indexOf(",") > -1) {
              var strIndices = config.settings[i].rowIndex.split(",");
              var strClasses = [];
              for (y = 0; y < strIndices.length; y++) {
                strClasses.push(className + " .tr" + strIndices[y]);
              }
              className = strClasses.join();
            } else {
              className += " .tr" + config.settings[i].rowIndex;
            }
          }

          // settings per column
          if (config.settings[i].colIndex !== undefined &&
            config.settings[i].rowIndex === undefined) {
            if (config.settings[i].colIndex === "*") {
              className += " td";
            } else if (config.settings[i].colIndex === "{odd}") {
              className += " td:nth-child(odd)";
            } else if (config.settings[i].colIndex === "{even}") {
              className += " td:nth-child(even)";
            } else if (config.settings[i].colIndex === "{hover}") {
              if (my.isMobile) {
                continue;
              }
              className += " tr:hover";
            } else if (config.settings[i].colIndex.length && config.settings[i].colIndex.indexOf("<") === 0 && config.settings[i].colIndex.indexOf(">") === config.settings[i].colIndex.length - 1) {

              // get the source column by name and find the index of this column
              var sourceColumn = config.settings[i].colIndex.substring(1, config.settings[i].colIndex.length - 1),
                sourceColumnIndex = -1;
              if (columnConfig && columnConfig.length) {
                for (var iColumnConfig = 0; iColumnConfig < columnConfig.length; iColumnConfig++) {
                  if (columnConfig[iColumnConfig]["SourceColumn"] === sourceColumn) {
                    sourceColumnIndex = iColumnConfig + 1;
                    break;
                  }
                }
                if (sourceColumnIndex > -1) {
                  className += " .td" + sourceColumnIndex;
                }
              }

            } else if (("" + config.settings[i].colIndex).indexOf(",") > -1) {
              strIndices = config.settings[i].colIndex.split(",");
              strClasses = [];
              for (y = 0; y < strIndices.length; y++) {
                strClasses.push(className + " .td" + strIndices[y]);
              }
              className = strClasses.join();
            } else {
              className += " .td" + config.settings[i].colIndex;
            }
          }

          // setting per cell
          if (config.settings[i].colIndex !== undefined &&
            config.settings[i].rowIndex !== undefined) {

            var arrCols = [],
              arrRows = [],
              arrCells = [];

            // get the columns
            if (config.settings[i].colIndex === "*") {
              arrCols.push(" td");
            } else if (config.settings[i].colIndex === "{odd}") {
              arrCols.push(" td:nth-child(odd)");
            } else if (config.settings[i].colIndex === "{even}") {
              arrCols.push(" td:nth-child(even)");
            } else if (("" + config.settings[i].colIndex).indexOf(",") > -1) {
              strIndices = config.settings[i].colIndex.split(",");
              for (y = 0; y < strIndices.length; y++) {
                arrCols.push(" .td" + strIndices[y]);
              }
            } else {
              arrCols.push(" .td" + config.settings[i].colIndex);
            }

            // get the rows
            if (config.settings[i].rowIndex === "*") {
              arrRows.push(" tr");
            } else if (config.settings[i].rowIndex === "{odd}") {
              arrRows.push(" tr:nth-child(odd)");
            } else if (config.settings[i].rowIndex === "{even}") {
              arrRows.push(" tr:nth-child(even)");
            } else if (("" + config.settings[i].rowIndex).indexOf(",") > -1) {
              strIndices = config.settings[i].rowIndex.split(",");
              for (y = 0; y < strIndices.length; y++) {
                arrRows.push(" .tr" + strIndices[y]);
              }
            } else {
              arrRows.push(" .tr" + config.settings[i].rowIndex);
            }

            // generate the css per cell
            for (var c = 0; c < arrCols.length; c++) {
              for (var r = 0; r < arrRows.length; r++) {
                arrCells.push(className + arrRows[r] + arrCols[c]);
              }
            }

            className = arrCells.join();
          }


          // setting for entire table
          if (( config.settings[i].colIndex === undefined )
            && ( config.settings[i].rowIndex === undefined )) {
            //className += " .customtable";
          }

          // add the style
          s += "#" + containerDiv + " .customtable " + className + "{" + config.settings[i].css + "}";
        }
      }
      s += "</style>";
      $(s).appendTo("head");
    }

    /**
     * Generates the HTML for the table header
     *
     * The labels used in the header are provided either via the configuration settings
     * or (if not provided via the configuration) via the BEx query. The BEx query is
     * using text-variables in order to set the correct month names.
     *
     * @param columnConfig      an object holding the configuration settings for the
     *                          columns
     * @param config            the configuration for the entire object
     * @return {String}         a HTML string holding the table header
     */
    function getHTMLTableHeaderRow(columnConfig, config) {

      var columnHeaderLabels = [],
        i,
        html = "";

      if (!columnConfig || !columnConfig["displayColumns"]) {
        return "";
      }

      // get the column header labels
      for (i = 0; i < columnConfig["displayColumns"].length; i++) {

        // if a predefined headerLabel is defined in the configuration, use this
        if (columnConfig["HeaderText"] && columnConfig["HeaderText"][i]) {
          columnHeaderLabels.push(columnConfig["HeaderText"][i]);
          continue;
        }

        // if a SourceColumn is defined in the configuration, get the header label from the
        // BEx query (via the headerLabels)
        if (columnConfig["displayColumns"][i]) {

          // lookup the label for the source column
          var bexHeaderLabel = my.period_functions.getPeriodIdentifierLabel(columnConfig["displayColumns"][i]);
          if (bexHeaderLabel === columnConfig["displayColumns"][i]) {
            bexHeaderLabel = "";
          }

          // because the lack of space, trim the header line before the year
          if (bexHeaderLabel !== "") {
            if (isNaN(parseInt(bexHeaderLabel.substr(( bexHeaderLabel.length - 4 ))))) {
              columnHeaderLabels.push(bexHeaderLabel);
            } else {
              columnHeaderLabels.push(bexHeaderLabel.substr(0, bexHeaderLabel.length - 5).trim() + "<br>" + bexHeaderLabel.substr(bexHeaderLabel.length - 5).trim());
            }
            continue;
          }
        }

        // in case the headerlabel is not provided in the configuration and not as SourceColumn, add an empty line
        columnHeaderLabels.push("");
      }

      // generate the HTML
      // check if the configuration has a header row prior to the standard header
      if (config["CustomHeaderBefore"]) {
        html += config["CustomHeaderBefore"];
      }

      html += "<tr class='tr0'>";
      for (i = 0; i < columnHeaderLabels.length; i++) {
        html += "<th class='td" + (i + 1 ) + "'>" + columnHeaderLabels[i] + "</th>";
      }
      html += "</tr>";

      return html;
    }


    /**
     * Generates the HTML for the table contents
     *
     * The labels used in the header are provided either via the configuration settings
     * or (if not provided via the configuration) via the BEx query. The BEx query is
     * using text-variables in order to set the correct month names.
     *
     * @param config            the configuration for the entire object
     * @param columnConfig      an object holding the configuration settings for the
     *                          columns
     * @param dataset           the resultset of the BEx query
     * @param divId             the identifier of the div
     * @return {String}         a HTML string holding the table contents
     */
    function getHTMLTableContent(config, columnConfig, dataset, divId) {
      var containerId = divId.substring(9),
        rows = [],
        row,
        col,
        html = "",
        cell,
        i;

      if (!dataset || !dataset.length) {
        return html;
      }

      // get the metadata for the cells
      for (row = 0; row < dataset.length; row++) {
        var cols = [];

        for (col = 0; col < columnConfig["displayColumns"].length; col++) {
          cell = {
            label: "",
            raw: null,
            classes: ["tr" + (row + 1), "td" + (col + 1)],
            attr: []
          };

          if ((columnConfig["displayColumns"][col]
            && dataset[row][columnConfig["displayColumns"][col]] !== undefined
            && dataset[row][columnConfig["displayColumns"][col]] !== null) ||
            (("" + columnConfig["displayColumns"][col]).substring(0, 1) === "%"
            && ("" + columnConfig["displayColumns"][col]).substring(("" + columnConfig["displayColumns"][col]).length - 1, ("" + columnConfig["displayColumns"][col]).length) === "%"
            && dataset[row].Group !== "")
          ) {

            cell.label = dataset[row][columnConfig["displayColumns"][col]];
            cell.raw = dataset[row][columnConfig["displayColumns"][col]];

            // determine the column type based on the name of the 'displayColumn'
            //cell.type = "standard";
            if (columnConfig["displayColumns"][col] === "%BULLET%") {
              cell.classes.push("bulletchart");
              cell.label = "";
              cell.raw = "";


              // get the data for the bulletchart and store it in the cell attribute
              var data = [];

              // columnNames
              var actualColumn = columnConfig["bulletColumns"] && columnConfig["bulletColumns"]["actual"] && columnConfig["bulletColumns"]["actual"] !== "" ? columnConfig["bulletColumns"]["actual"] : null;
              var planColumn = columnConfig["bulletColumns"] && columnConfig["bulletColumns"]["plan"] && columnConfig["bulletColumns"]["plan"] !== "" ? columnConfig["bulletColumns"]["plan"] : null;
              var leColumn = columnConfig["bulletColumns"] && columnConfig["bulletColumns"]["le"] && columnConfig["bulletColumns"]["le"] !== "" ? columnConfig["bulletColumns"]["le"] : null;

              // get the values
              var actualValue = actualColumn
                ? dataset[row][actualColumn]
                : null;
              var planValue = planColumn
                ? dataset[row][planColumn]
                : null;
              var leValue = leColumn
                ? dataset[row][leColumn]
                : null;

              data.push(actualValue);
              data.push(planValue);
              data.push(leValue);

              cell.attr.push({
                name: "data-chartdata",
                value: data.join(",")
              });


              var chartDecimals = 0;
              if (config && config.settings && config.settings.length) {
                for (i = 0; i < config.settings.length; i++) {
                  if (config.settings[i].rowIndex && config.settings[i].rowIndex === (row + 1) && config.settings[i].chartDecimals !== undefined) {
                    chartDecimals = config.settings[i].chartDecimals;
                  } else if (!config.settings[i].rowIndex && !config.settings[i].colIndex && config.settings[i].chartDecimals !== undefined) {
                    chartDecimals = config.settings[i].chartDecimals;
                  }
                }
              }

              cell.attr.push({
                name: "data-decimals",
                value: chartDecimals
              });

              // Add the chart labels
              var headerLabelIds = [actualColumn, planColumn, leColumn];
              var dataLabels = [];
              for (var x = 0; x < headerLabelIds.length; x++) {
                if (headerLabelIds[x]) {
                  dataLabels.push(my.period_functions.getPeriodIdentifierLabel(headerLabelIds[x]));
                } else {
                  dataLabels.push("");
                }
              }
              cell.attr.push({
                name: "data-chartdatalabels",
                value: dataLabels.join(",")
              })

            } else if (columnConfig["displayColumns"][col] === "%KPI_COMMENT%") {

              // if the page is in 'full-screen' mode, the container id needs to be searched for
              var contId = containerId,
                $zoomContainerBackButton = $("#zoomContainerBackButton"),
                $zoomContainer = $("#zoomContainer"),
                backId;
              if ($zoomContainer.length) {
                if ($zoomContainerBackButton.data("currentContainer")) {
                  var fullIdentifier = $zoomContainerBackButton.data("currentContainer");
                  backId = fullIdentifier.substring( fullIdentifier.indexOf("container") + 15);
                  if (backId > 1) {
                    contId = parseInt(backId) - 1;
                  } else {
                    contId = $zoomContainer.length;
                  }
                } else {
                  contId = 1;
                }
              }


              // get the comment text
              var commentContainerId = contId + ";" + dataset[row]["_kpi"];

              // check if currently in comment edit mode
              var $body = $("body");
              var editMode = ($body.data("comment_edit_mode"));

              // decode the text
              var decodedText = "";
              try {
                decodedText = decodeURIComponent(my._getCommentText(commentContainerId));
              }catch(e){
              }

              if (editMode) {
                cell.label = "<div style='background-color:#f8ef9f;' contenteditable='true' data-commentcol='x' data-commentid='" + commentContainerId + "'>" + decodedText + "</div>"
              } else {
                cell.label = decodedText;
              }
            }

          } else {
            cell.classes.push("emptycell");

            /** SHELL LOGIC --> SHOW N/A in case label is empty, but group is populated **/
            if (dataset[row].Group !== "") {
              cell.label = "N/A";
            }
          }


          cols.push(cell);
        }
        rows.push(cols);
      }

      // apply the formatters
      rows = applyFormatters(config, rows, columnConfig);


      // generate the HTML
      for (row = 0; row < rows.length; row++) {
        html += "<tr class='tr" + (row + 1 ) + "'>";
        for (col = 0; col < rows[row].length; col++) {
          cell = rows[row][col];

          // add the classes
          html += "<td class='";
          for (i = 0; i < cell.classes.length; i++) {
            if (i > 0)
              html += " ";

            html += cell.classes[i];
          }
          html += "'";

          // add the attributes
          for (i = 0; i < cell.attr.length; i++) {
            html += " " + cell.attr[i].name + "='" + cell.attr[i].value + "'";
          }

          // add the text
          html += ">" + cell.label + "</td>";
        }
        html += "</tr>";
      }

      return html;
    }


    /**
     * Apply the correct format on the values in the tables
     *
     * Sets the correct format of the values in the table. The required formats are provided
     * via the configuration. Via a format function (see data handler) the values are
     * formatted.
     *
     * @param config            the configuration for the entire object
     * @param dataset           the cell meta data with the raw value
     * @param columnConfig      an object holding the configuration settings for the
     *                          columns
     * @return                  the cell meta data with the formatted value
     */
    function applyFormatters(config, dataset, columnConfig) {

      var i,
        row,
        col,
        columnIndex,
        sourceColumn,
        iColumnConfig;

      if (!config || !config.settings || !config.settings.length) {
        return dataset;
      }

      for (i = 0; i < config.settings.length; i++) {
        if (config.settings[i].format !== undefined) {

          var cellValue;

          // apply the formatter on a specific cell
          if (config.settings[i].rowIndex !== undefined
            && config.settings[i].rowIndex !== null
            && config.settings[i].colIndex !== undefined
            && config.settings[i].colIndex !== null) {


            // check if the columnIndex should be retrieved based on the sourceColumn name
            columnIndex = -1;
            if (config.settings[i].colIndex.length && config.settings[i].colIndex.indexOf("<") === 0 && config.settings[i].colIndex.indexOf(">") === config.settings[i].colIndex.length - 1) {

              // get the source column by name and find the index of this column
              sourceColumn = config.settings[i].colIndex.substring(1, config.settings[i].colIndex.length - 1);
              if (columnConfig && columnConfig.length) {
                for (iColumnConfig = 0; iColumnConfig < columnConfig.length; iColumnConfig++) {
                  if (columnConfig[iColumnConfig]["SourceColumn"] === sourceColumn) {
                    columnIndex = iColumnConfig;
                    break;
                  }
                }
              }
            } else {
              columnIndex = config.settings[i].colIndex - 1;
            }

            // check if the cell exists
            cellValue = dataset[config.settings[i].rowIndex - 1][columnIndex];
            if (cellValue !== undefined
              && cellValue !== null
              && cellValue.raw !== undefined
              && cellValue.raw !== null
              && cellValue.raw !== "") {
              dataset[config.settings[i].rowIndex - 1][columnIndex].label = my._formatNumber(config.settings[i].format, cellValue.raw);
            }
          }

          // apply the formatter on a specific row
          if (config.settings[i].rowIndex !== undefined
            && config.settings[i].rowIndex !== null
            && ( config.settings[i].colIndex === undefined
            || config.settings[i].colIndex === null )
            && dataset[config.settings[i].rowIndex - 1]
            && dataset[config.settings[i].rowIndex - 1].length) {

            for (col = 0; col < dataset[config.settings[i].rowIndex - 1].length; col++) {
              cellValue = dataset[config.settings[i].rowIndex - 1][col];
              if (cellValue !== undefined
                && cellValue !== null
                && cellValue.raw !== undefined
                && cellValue.raw !== null
                && cellValue.raw !== "") {
                dataset[config.settings[i].rowIndex - 1][col].label = my._formatNumber(config.settings[i].format, cellValue.raw);
              }
            }
          }

          // apply the formatter on a specific column
          if (( config.settings[i].rowIndex === undefined
            || config.settings[i].rowIndex === null )
            && config.settings[i].colIndex !== undefined
            && config.settings[i].colIndex !== null
            && dataset.length) {

            // check if the columnIndex should be retrieved based on the sourceColumn name
            columnIndex = -1;
            if (config.settings[i].colIndex.length && config.settings[i].colIndex.indexOf("<") === 0 && config.settings[i].colIndex.indexOf(">") === config.settings[i].colIndex.length - 1) {

              // get the source column by name and find the index of this column
              sourceColumn = config.settings[i].colIndex.substring(1, config.settings[i].colIndex.length - 1);
              if (columnConfig && columnConfig.length) {
                for (iColumnConfig = 0; iColumnConfig < columnConfig.length; iColumnConfig++) {
                  if (columnConfig[iColumnConfig]["SourceColumn"] === sourceColumn) {
                    columnIndex = iColumnConfig;
                    break;
                  }
                }
              }
            } else {
              columnIndex = config.settings[i].colIndex - 1;
            }

            // apply the formatters for every column cell
            if (columnIndex > -1) {
              for (row = 0; row < dataset.length; row++) {
                if (dataset[row][columnIndex]) {
                  cellValue = dataset[row][columnIndex];
                  if (cellValue !== undefined
                    && cellValue !== null
                    && cellValue.raw !== undefined
                    && cellValue.raw !== null
                    && cellValue.raw !== "") {
                    dataset[row][columnIndex].label = my._formatNumber(config.settings[i].format, cellValue.raw);
                  }
                }
              }
            }
          }

          // apply the formatter on a whole table
          if (( config.settings[i].rowIndex === undefined
            || config.settings[i].rowIndex === null )
            && ( config.settings[i].colIndex === undefined
            || config.settings[i].colIndex === null )
            && dataset.length) {

            for (row = 0; row < dataset.length; row++) {
              for (col = 0; col < dataset[row].length; col++) {
                cellValue = dataset[row][col];
                if (cellValue !== undefined
                  && cellValue !== null
                  && cellValue.raw !== undefined
                  && cellValue.raw !== null
                  && cellValue.raw !== "") {
                  dataset[row][col].label = my._formatNumber(config.settings[i].format, cellValue.raw);
                }
              }
            }
          }
        }
      }
      return dataset;
    }


    /**
     * Create the HTML table
     *
     * Build up a HTML string based on the configuration settings and the results of
     * the dataset. Add the table to the containerDiv
     *
     * @param containerDiv      the ID of the HTML div element in which the object
     *                          needs to be rendered
     * @param config            the configuration for the entire object
     * @param columnConfig      an object holding the configuration settings for the
     *                          columns
     * @param dataset           the cell meta data with the raw value
     */
    function addHTML(containerDiv, config, columnConfig, dataset) {
      var s = "";
      if (dataset && dataset.length) {
        s += "<table class=\"customtable\">";
        s += getHTMLTableHeaderRow(columnConfig, config);
        s += getHTMLTableContent(config, columnConfig, dataset, containerDiv);
        s += "</table>";
      }

      // Add the HTML to the container
      $("#" + containerDiv + "Content").html(s);

      // If necessary, overwrite specific columns based on the settings
      if (config && config.settings && config.settings.length) {
        for (var i=0; i<config.settings.length; i++) {
          if (config.settings[i].text
            && config.settings[i].colIndex !== undefined
            && config.settings[i].rowIndex !== undefined) {
            $("#" + containerDiv + " .tr" + config.settings[i].rowIndex + ".td" + config.settings[i].colIndex).html(config.settings[i].text);
          }
        }
      }
    }
  };




  /*****************************************************************************
   *                                                                            *
   *                          BULLET CHART SPECIFIC                             *
   *                                                                            *
   *****************************************************************************/

  /**
   * Create the bullet charts
   *
   * The bullet charts are created inside a HTML table. The TD element in which
   * the bullet charts should be created have a classname 'bulletchart' and hold
   * an array of data in the TD attribute 'data-chartdata'. The names of the
   * values are stored in TD attribute 'td-chartdatalabels'.
   * Highcharts is used to generate the bullet charts
   *
   * @param containerDiv      the ID of the HTML div element in which the object
   *                          needs to be rendered
   * @param config            Configuration object for the container
   * @private
   */
  function _buildBullets(containerDiv, config) {

    var bulletWidth = (config && config["BulletWidth"]) ? config["BulletWidth"] : 200;

    // Prepend a notification about the chart scales and the legend
//@formatter:off
            var s = "<div style='font-size:11px;font-family:Verdana,Geneva,sans-serif;color:#333;text-align:center;margin-top:5px;'>Bullet charts are using different scales.</div>";
                s += "<div style='width:100%;margin-top: 10px;height:10px;margin-bottom:20px;'>";
                  s += "<table style='font-size:11px;font-family:Verdana,Geneva,sans-serif;margin:0 auto;border-collapse:separate;border-spacing:10px 0;'>";
                    s += "<tr style='height: 20px;'>";
                      s += "<td class='bulletLegendActualColumn' style='display:none;width:150px;'><div style='width: 15px;float: left;height: 6px;margin-top: 7px;background-color: #000;'></div><span class='bulletLegendTitle' style='position: relative;left: 5px;line-height: 22px;'></span></td>";
                      s += "<td class='bulletLegendPlanColumn' style='display:none;width:150px;'><div style='width: 15px;float: left;height: 15px;margin-top: 2px;background-color: #D8D8D8;'></div><span class='bulletLegendTitle' style='position: relative;left: 5px;line-height: 22px;'></span></td>";
                      s += "<td class='bulletLegendLEColumn' style='display:none;width:150px;'><div style='width: 3px;float: left;height: 15px;margin-top: 2px;background-color: #000;'></div><span class='bulletLegendTitle' style='position: relative;left: 5px;line-height: 22px;'></span></td>";
                    s += "</tr>";
                  s += "</table>";
                s += "</div>";
//@formatter:on
    $("#" + containerDiv + " .customtable").before(s);


    // Highcharts Configuration for Bullet Charts
    Highcharts.Renderer.prototype.symbols.line = function (x, y, width, height) {
      return ['M',
        x - 3,
        y + (height / 2),
        'L',
        x + width + 3,
        y + ( height / 2 )
      ];
    };

    Highcharts.BulletChart = function (a, b, c) {
      var hasRenderToArg = typeof a === 'string' || a.nodeName,
        options = arguments[hasRenderToArg ? 1 : 0],
        defaultOptions = {
          chart: {
            renderTo: (options.chart && options.chart.renderTo) || this,
            type: 'bar',
            margin: [5, 15, 10, 5],
            width: b.custom.bulletWidth,
            height: 35,
            plotBorderWidth: 1,
            plotBorderColor: "#979797",
            backgroundColor: 'transparent',
            skipClone: true
          },
          credits: {enabled: false},
          exporting: {enabled: false},
          legend: {enabled: false},
          title: {text: ''},
          xAxis: {
            tickLength: 0,
            lineColor: '#999',
            lineWidth: 0,
            labels: {
              enabled: false,
              style: {
                fontWeight: 'bold'
              }
            }
          },
          yAxis: {
            gridLineWidth: 0,
            title: {text: ''},
            labels: {
              y: 10,
              style: {
                fontSize: '8px'
              },
              useHTML: true,
              formatter: function () {
                if (this.value < 0) {
                  return "<font style=\"color:red;\">" + Highcharts.numberFormat(this.value, options.custom.decimals) + "</font>";
                } else if (this.value === 0) {
                  return "<font style=\"font-weight:bold;\">0</font>";
                } else {
                  return Highcharts.numberFormat(this.value, options.custom.decimals);
                }
              }
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgb(255, 255, 255)',
            borderWidth: 0,
            shadow: true,
            style: {fontSize: '10px', padding: 2},
            formatter: function () {
              if (this.series.tooltipOptions["valueSuffix"]) {
                return this.series.name + ": <strong>" + Highcharts.numberFormat(this.y, options.custom.decimals) + this.series.tooltipOptions.valueSuffix + "</strong>";
              }
              return this.series.name + ": <strong>" + Highcharts.numberFormat(this.y, options.custom.decimals) + "</strong>";

            }
          },
          plotOptions: {
            bar: {
              color: '#000',
              shadow: false,
              borderWidth: 0
            },
            scatter: {
              marker: {
                symbol: 'line',
                lineWidth: 3,
                radius: 8,
                lineColor: '#000'
              }
            },
            series: {
              //enableMouseTracking: !(my.isMobile),
              states: {
                hover: {
                  enabled: !(my.isMobile)
                }
              }
            }
          }
        };

      options = Highcharts.merge(defaultOptions, options);

      return hasRenderToArg ?
        new Highcharts.Chart(a, options, c) :
        new Highcharts.Chart(options, b);
    };


    // get the cells in which the bullet chart needs to be created
    $("#" + containerDiv + " .bulletchart").each(function (index) {

      // create an object for the individual bullet chart
      var chartConfig = {
        custom: {
          decimals: $(this).data("decimals") ? parseInt($(this).data("decimals")) : 0,
          bulletWidth: bulletWidth
        },
        series: [],
        plotOptions: {
          bar: {
            tooltip: {}
          },
          scatter: {
            tooltip: {}
          }
        }
      };

      // extract the data from the td and convert to values
      var chartDataString = $(this).data("chartdata"),
        chartDataLabelString = $(this).data("chartdatalabels"),
        chartData = chartDataString.split(",").map(function (x) {
          if (!x || x === "") {
            return null;
          } else {
            return parseFloat(x);
          }
        }),
        chartDataLabels = chartDataLabelString.split(","),
        actualValue = chartData[0],
        actualLabel = chartDataLabels[0],
        planValue = chartData[1],
        planLabel = chartDataLabels[1],
        leValue = chartData[2],
        leLabel = chartDataLabels[2];

      if (actualValue !== undefined && actualValue !== null) {
        chartConfig.series.push({
          name: actualLabel,
          pointWidth: 8,
          data: [actualValue],
          zIndex: 2
        });
      }

      if (planValue !== undefined && planValue !== null) {
        chartConfig.series.push({
          name: planLabel,
          pointWidth: 30,
          type: "column",
          color: '#D8D8D8',
          data: [planValue],
          zIndex: 1
        });
      }

      if (leValue !== undefined && leValue !== null) {
        chartConfig.series.push({
          name: leLabel,
          type: 'scatter',
          data: [leValue], zIndex: 3
        });
      }


      $(this).highcharts('BulletChart', chartConfig);


      // Set the legend labels
      if (index === 0) {

        // set the legend titles
        if (actualLabel && actualLabel !== "") {
          $("#" + containerDiv + " .bulletLegendActualColumn .bulletLegendTitle").html(actualLabel);
          $("#" + containerDiv + " .bulletLegendActualColumn").show();
        } else {
          $("#" + containerDiv + " .bulletLegendActualColumn").hide();
        }

        if (planLabel && planLabel !== "") {
          $("#" + containerDiv + " .bulletLegendPlanColumn .bulletLegendTitle").html(planLabel);
          $("#" + containerDiv + " .bulletLegendPlanColumn").show();
        } else {
          $("#" + containerDiv + " .bulletLegendPlanColumn").hide();
        }

        if (leLabel && leLabel !== "") {
          $("#" + containerDiv + " .bulletLegendLEColumn .bulletLegendTitle").html(leLabel);
          $("#" + containerDiv + " .bulletLegendLEColumn").show();
        } else {
          $("#" + containerDiv + " .bulletLegendLEColumn").hide();
        }

      }
    });
  }


  return my;
}(shell.app.execdb.dashboard));

//####src/execdb/dashboard/mod_businessfilter.js
shell.app.execdb.dashboard = ( function (my) {

  my._updateBusinessFilter = function (menuId) {

    var currentMenu,
      $body = $("body"),
      customConfig = $body.data("customConfig"),
      customData = $body.data("customDataApp"),
      datasets = customData.datasets,
      menuItems = customConfig["MENU_ITEMS"],
      $businessTree = $('#jbi_businesses'),
      property,
      i,
      nodesToHide,
      newSelection,
      allNodes;

    for (i = 0; i < menuItems.length; i++) {
      if (menuItems[i].id === menuId) {
        currentMenu = menuItems[i];
        break;
      }
    }

    // check if there are children from a certain node that need to be hidden
    nodesToHide = [];
    if (currentMenu && currentMenu.businessChildrenToHide && currentMenu.businessChildrenToHide.length) {
      for (property in datasets) {
        if (datasets.hasOwnProperty(property) && currentMenu.businessChildrenToHide.indexOf(datasets[property].parentNode) > -1) {
          nodesToHide.push(property);
        }
      }
    }

    if (!currentMenu || !currentMenu.businesses || !currentMenu.businesses.length) {
      allNodes = $businessTree.jstree(true).get_json('#', {flat:true});
      for (i=0; i<allNodes.length; i++) {
        if (nodesToHide.indexOf(allNodes[i].id) > -1) {
          $businessTree.jstree(true).hide_node(allNodes[i].id);
        } else {
          $businessTree.jstree(true).show_node(allNodes[i].id);
        }
      }

      //if ($businessTree.jstree(true)._cnt > 0) {
      //  $businessTree.jstree(true).show_all();
      //  setTimeout(function () {
      //    $businessTree.jstree(true).hide_node(nodesToHide);
      //  }, 200);
      //
      //}
    } else if (currentMenu.businesses[0] === "NO_BUSINESS") {

    } else {
      var selectedNode = $businessTree.jstree(true).get_selected('full', true);
      if (currentMenu.businesses.length == 1 && currentMenu.businesses[0].toUpperCase() === 'SECTOR') {
        for (property in datasets) {
          if (datasets.hasOwnProperty(property) && property.substring(0, 3) !== "SE-") {
            nodesToHide.push(property);
          }
        }

        // check if the selected node will be hidden
        if (selectedNode && selectedNode.length && selectedNode[0].id.substring(0, 3) !== "SE-") {
          for (i = 0; i < selectedNode[0].parents.length; i++) {
            if (selectedNode[0].parents[i].substring(0, 3) === "SE-") {
              newSelection = selectedNode[0].parents[i];
              break;
            }
          }
          if (newSelection) {
            $businessTree.jstree(true).deselect_all();
            $businessTree.jstree(true).select_node(newSelection);
          }
        }
      } else {
        for (property in datasets) {
          if (datasets.hasOwnProperty(property) && currentMenu.businesses.indexOf(property) === -1) {
            nodesToHide.push(property);
          }
        }

        // check if the selected node will be hidden
        if (selectedNode && selectedNode.length) {
          if (nodesToHide.indexOf(selectedNode[0].id) > -1) {
            for (i = 0; i < selectedNode[0].parents.length; i++) {
              if (nodesToHide.indexOf(selectedNode[0].parents[i]) === -1) {
                newSelection = selectedNode[0].parents[i];
                break;
              }
            }
          }
          if (newSelection) {
            $businessTree.jstree(true).deselect_all();
            $businessTree.jstree(true).select_node(newSelection);
          }
        }
      }

      // get all the nodes
      allNodes = $businessTree.jstree(true).get_json('#', {flat:true});
      for (i=0; i<allNodes.length; i++) {
        if (nodesToHide.indexOf(allNodes[i].id) > -1) {
          $businessTree.jstree(true).hide_node(allNodes[i].id);
        } else {
          $businessTree.jstree(true).show_node(allNodes[i].id);
        }
      }

      // hide the nodes which should not be shown
      //$businessTree.jstree(true).show_all();
      //setTimeout(function () {
      //  $businessTree.jstree(true).hide_node(nodesToHide);
      //}, 200);

    }
  };


  my._buildBusinessFilter = function () {
    addCSS();
    buildTree();


    function addCSS() {

      var customConfig = $("body").data("customConfig"),
        filterConfig = (customConfig && customConfig["CONFIG"]) ? customConfig["CONFIG"]["filter"] : {},
        selectedBackground = (filterConfig && filterConfig["FilterLeftPaneItemSelectedBackgroundColor"])
          ? filterConfig["FilterLeftPaneItemSelectedBackgroundColor"]
          : "#fbce07",
        selectedFontColor = (filterConfig && filterConfig["FilterLeftPaneItemSelectedFontColor"])
          ? filterConfig["FilterLeftPaneItemSelectedFontColor"]
          : "white",
        unselectedBackground = (filterConfig && filterConfig["FilterLeftPaneItemBackgroundColor"])
          ? filterConfig["FilterLeftPaneItemBackgroundColor"]
          : "#fbce07",
        unselectedFontColor = (filterConfig && filterConfig["FilterLeftPaneItemFontColor"])
          ? filterConfig["FilterLeftPaneItemFontColor"]
          : "white",
        hoverBackground = (filterConfig && filterConfig["FilterLeftPaneItemHoverBackgroundColor"])
          ? filterConfig["FilterLeftPaneItemHoverBackgroundColor"]
          : selectedBackground,
        hoverFontColor = (filterConfig && filterConfig["FilterLeftPaneItemHoverFontColor"])
          ? filterConfig["FilterLeftPaneItemHoverFontColor"]
          : selectedFontColor;
      


//@formatter:off
      var s = "";
      s += "<style type='text/css' id='CSS_JSTREE_CUSTOM' data-repstyle='execdb'>";
        s += ".jstree-default .jstree-wholerow-clicked{";
          s += " background: " + selectedBackground + " !important;";
        s += "}";
        s += ".jstree-default .jstree-wholerow {";
          s += " line-height: 40px !important;";
          s += " background: " + unselectedBackground + ";";
          s += " color: " + unselectedFontColor + ";";
        s += "}";
        s += ".jstree-anchor.jstree-clicked {";
          s += " color: " + selectedFontColor + " !important;";
        s += "}";
      s += "</style>";
//@formatter:on
      $(s).appendTo("head");
    }

    function buildTree() {
      var $body = $("body"),
        $customDataApp = $body.data("customDataApp"),
        hierarchy = ($customDataApp && $customDataApp.businessHierarchy) ? $customDataApp.businessHierarchy : null;

      // make sure the first item is selected (root node)
      if (!hierarchy || !hierarchy.length) {
        return;
      }

      hierarchy[0].state.selected = true;
      var $businessTree = $('#jbi_businesses');
      $businessTree.unbind("changed.jstree");
      $businessTree.on('changed.jstree', function (e, data) {
        if (!data || !data.selected || !data.selected.length) {
          return;
        }

        var i, j, r = [];
        for (i = 0, j = data.selected.length; i < j; i++) {
          r.push(data.instance.get_node(data.selected[i]).id);
        }
        my._buildView();
      });

      $businessTree.jstree({
        'plugins': ["wholerow", "nohover"],
        'core': {
          'multiple': false,
          'data': hierarchy,
          'themes': {
            'dots': false,
            'icons': false
          }
        }
      });
    }
  };

  return my;


}(shell.app.execdb.dashboard));

//####src/execdb/dashboard/mod_chart.js
shell.app.execdb.dashboard = ( function (my) {

  /**
   * Generates chart
   *
   * This is a generic function that is used to generate the chart
   *
   * @param containerDiv   the ID of the HTML div element in which the object
   *                       needs to be rendered
   * @param config         the configuration settings for the bullet chart
   * @param dataId         the ID of the data for the object
   * @param businessData   the data for the selected business
   */

  my._createChart = function (containerDiv, config, dataId, businessData) {
    addCSS(containerDiv);
    addHTML(containerDiv, config);
    buildChart(containerDiv, config, dataId, businessData);

    /**
     * Add CSS for chart object
     *
     * This function adds the CSS for the chart object to the head of the document.
     *
     * @param containerDiv   the ID of the HTML div element in which the object
     *                       needs to be rendered
     */
    function addCSS(containerDiv) {
      var s = "";
      s += "<style type='text/css' id='CSS_CHART_" + containerDiv + "' data-group='LAYOUT'  data-repstyle='execdb'>";
      s += "#" + containerDiv + "Chart{";
      s += "    position: absolute;";
      s += "    left : 0;";
      s += "    right : 0;";
      s += "    top : 0;";
      s += "    bottom : 5px;";
      s += "    overflow: hidden;";
      s += "}";
      s += "#" + containerDiv + "ToggleSeriesButton.ToggleSeriesButton{";
      s += "    right: 2px;";
      s += "    bottom: 2px;";
      s += "    width: 100px;";
      s += "    height: 20px;";
      s += "    line-height: 20px;";
      s += "    position: absolute;";
      s += "    float: right;";
      s += "    font-size: 10px;";
      s += "    cursor: pointer;";
      s += "    text-align: center;";
      s += "    background-color: #EEE;";
      s += "    color: #666;";
      s += "}";
      if (!my.isMobile) {
        s += "#" + containerDiv + "ToggleSeriesButton.ToggleSeriesButton:hover{";
        s += "    background-color: #D8D8D8;";
        s += "}";
      }
      s += "</style>";
      $(s).appendTo("head");
    }


    /**
     * Add HTML for chart object
     *
     * This function adds the HTML for the chart object inside the Content container.
     *
     * @param containerDiv   the ID of the HTML div element in which the object
     *                       needs to be rendered
     * @param config {object} configuration of the container
     */
    function addHTML(containerDiv, config) {
      var enableToggleSeriesButton = (!config || !config["DisableHideAll"] || config["DisableHideAll"].toUpperCase() !== "TRUE");

      var s = "";
      s += "<div id=\"" + containerDiv + "Chart\"></div>";
      if (enableToggleSeriesButton) {
        s += "<div id=\"" + containerDiv + "ToggleSeriesButton\" class=\"ToggleSeriesButton\">Hide All</div>";
      }

      // Add the HTML to the container
      $("#" + containerDiv + "Content").html(s);

      // add an event listener for the toggle series button
      if (enableToggleSeriesButton) {
        var $toggleSeriesButton = $("#" + containerDiv + "ToggleSeriesButton");
        $toggleSeriesButton.unbind(my.eventTrigger);
        $toggleSeriesButton.on(my.eventTrigger, function () {
          var chart = $('#' + containerDiv + "Chart").highcharts();
          var series = chart.series[0];
          if (series.visible) {
            $(chart.series).each(function () {
              this.setVisible(false, false);
              $toggleSeriesButton.html("Show All");
            });
            chart.redraw();
          } else {
            $(chart.series).each(function () {
              this.setVisible(true, false);
              $toggleSeriesButton.html("Hide All");
            });
            chart.redraw();
          }
        });
      }
    }


    /**
     * Build Chart
     *
     * Build the chart in the container based on the provided configuration and the
     * data.
     *
     * @param containerDiv   the ID of the HTML div element in which the object
     *                       needs to be rendered
     * @param config         the configuration settings for the bullet chart
     * @param dataId         the ID of the data for the object
     * @param businessData   the data for the selected business
     */
    function buildChart(containerDiv, config, dataId, businessData) {
      checkChartDivRendered(containerDiv, config, dataId, businessData, 0);
    }


    function checkChartDivRendered(containerDiv, config, dataId, businessData, time) {
      var $containerDiv = $('#' + containerDiv + "Chart");

      if ($containerDiv.outerWidth() === 0 && time < 100) {
        setTimeout(function () {
          checkChartDivRendered(containerDiv, config, dataId, businessData, ++time);
        }, 100);
        return;
      }

      // get the chart configuration
      var chartConfig = getChartConfiguration(
        config,
        dataId,
        businessData
      );

      // check if there is data to be displayed
      if (!chartConfig || !chartConfig.series || !chartConfig.series.length) {
        $("body").trigger("showContainerMessage", {
          container: containerDiv,
          message: "No data available.",
          type: "W"
        });
        return;
      }

      // build the chart if the DIV is available
      $containerDiv.highcharts(chartConfig);
    }


    /**
     * Get Chart Configuration Object
     *
     * Generate the chart configuration object that is required for the Highchats
     * library. The generation is done based on the provided configuration object
     * and the dataId.
     *
     * @param config         the configuration settings for the bullet chart
     * @param dataId         the ID of the data for the object
     * @return               an object holding chart configuration
     * @param businessData   the data for the selected business
     */
    function getChartConfiguration(config, dataId, businessData) {
      var chartConfig = null;

      // based on the chartType, get the correct configuration
      if (!config || !config.Type) {
        return chartConfig;
      }
      switch (config.Type.toUpperCase()) {
        case 'PERIODS':
          chartConfig = getConfigPeriodChart(config, dataId, businessData);
          break;

        case 'BUSINESS':
          chartConfig = getConfigBusinessChart(config, dataId, businessData);
          break;

        case 'KPIS':
          chartConfig = getConfigKpiChart(config, dataId, businessData);
          break;

        default:
          break;
      }


      if (chartConfig) {

        // change the 'undefined' in the chart data to null
        if (chartConfig.series && chartConfig.series.length) {
          for (var i = 0; i < chartConfig.series.length; i++) {
            if (chartConfig.series[i].data && chartConfig.series[i].data.length) {
              for (var y = 0; y < chartConfig.series[i].data.length; y++) {
                if (chartConfig.series[i].data[y] === undefined) {
                  chartConfig.series[i].data[y] = null;
                }
              }
            } else {
              chartConfig.series[i].data = [];
            }
          }
        }


        // check if missing data in the beginning of the series should be hidden
        if (chartConfig.chart && chartConfig.chart.custom && chartConfig.chart.custom.hideMissingDataStart) {
          if (chartConfig.series && chartConfig.series.length
            && chartConfig.xAxis && chartConfig.xAxis.categories && chartConfig.xAxis.categories.length
          ) {
            for (var i=0; i<chartConfig.series.length; i++) {
              var firstPopulatedValueIndex;
              if (chartConfig.series[i].data && chartConfig.series[i].data.length) {
                for (var y=0; y<chartConfig.series[i].data.length; y++) {
                  if (chartConfig.series[i].data[y] !== null) {
                    if (!firstPopulatedValueIndex || firstPopulatedValueIndex > y) {
                      firstPopulatedValueIndex = y;
                    }
                    break;
                  }
                }
              }
            }

            for (var i=0; i<chartConfig.series.length; i++) {
              if (chartConfig.series[i].data && chartConfig.series[i].data.length) {
                chartConfig.series[i].data.splice(0,  firstPopulatedValueIndex);
              }
            }
            chartConfig.xAxis.categories.splice(0,  firstPopulatedValueIndex);
          }
        }



        // change the thousand separators
        var yAxisDecimals = (chartConfig.chart && chartConfig.chart.custom && chartConfig.chart.custom["yAxisDecimals"])
          ? chartConfig.custom["yAxisDecimals"]
          : 0;

        chartConfig.yAxis = chartConfig.yAxis || [{}];
        if (Object.prototype.toString.call(chartConfig.yAxis) === '[object Array]') {
          chartConfig.yAxis[0].labels = chartConfig.yAxis[0].labels || {};
          chartConfig.yAxis[0].labels.formatter = function () {
            return Highcharts.numberFormat(this.value, yAxisDecimals, '.', ',');
          };
        } else {
          chartConfig.yAxis.labels = chartConfig.yAxis.labels || {};
          chartConfig.yAxis.labels.formatter = function () {
            return Highcharts.numberFormat(this.value, yAxisDecimals, '.', ',');
          };
        }


        // Display 'Show all' or 'Hide all' when changing the legend items visibility
        chartConfig.plotOptions = chartConfig.plotOptions || {};
        chartConfig.plotOptions.series = chartConfig.plotOptions.series || {};
        chartConfig.plotOptions.series.events = chartConfig.plotOptions.series.events || {};
        chartConfig.plotOptions.series.events.legendItemClick = function (e) {
          var series = e.target.chart.series,
            noOfVisibleSeries = 0;

          // get the number of visible series
          for (var i = 0; i < series.length; i++) {
            if ((e.target.name === series[i].name && !series[i].visible)
              || (e.target.name !== series[i].name && series[i].visible)) {
              noOfVisibleSeries += 1;
            }
          }

          // only change the text in case either all items are selected or none
          if (noOfVisibleSeries === 0 || noOfVisibleSeries === series.length) {
            $("#" + containerDiv + "ToggleSeriesButton").html(( (noOfVisibleSeries === 0) ? "Show All" : "Hide All" ));
          }
        };


        // Special logic
        if (chartConfig
          && chartConfig.chart
          && chartConfig.chart.custom
          && chartConfig.chart.custom.config
          && my._specific.charts[chartConfig.chart.custom.config]) {
          chartConfig = my._specific.charts[chartConfig.chart.custom.config].apply(null, [chartConfig]);
        }
      }


      // return the chart configuration
      return chartConfig;
    }


    /**
     * Generic Highcharts Options
     *
     * This function sets some generic highcharts options which are taken over
     * in all highcarts created objects.
     */
    //function setGenericHighchartsOptions() {
    //  Highcharts.setOptions({
    //    lang: {
    //      numericSymbols: null, //[' k', ' M', ' Bn', ' T', ' P', ' E']
    //      thousandsSep: ','
    //    },
    //    chart: {
    //      style: {
    //        fontFamily: 'Verdana'
    //      }
    //    }
    //  });
    //}

    /**
     * Get the configuration for the period chart
     * @param config
     * @param dataId
     * @param businessData
     * @returns {*}
     */
    function getConfigPeriodChart(config, dataId, businessData) {

      // parse the configuration strings
      var chartConfig = parseConfigString(config, "Config"),
        seriesConfig = parseConfigString(config, "SeriesConfig"),
        periodsConfig = parseConfigString(config, "DataPoints");

      // the periods configuration is mandatory
      if (!periodsConfig || !periodsConfig.length) {
        return null;
      }

      // add the series and the categories
      if (businessData && dataId) {
        var chartData = filterDataByPeriod(periodsConfig, businessData, dataId, seriesConfig);
        if (chartData) {
          chartConfig.xAxis.categories = chartData.categories;
          chartConfig.series = chartData.series;
          chartConfig.custom = chartConfig.custom || {};
          chartConfig.custom.period = chartData.currentPeriod;
        }
      }

      // check for specific logic
      if (chartConfig.custom
        && chartConfig.custom.config
        && my._specific.charts[chartConfig.custom.config]) {

        chartConfig = my._specific.charts[chartConfig.custom.config].apply(this, [chartConfig])
      }
      return chartConfig;
    }


    /**
     * Parse the provided chart configuration JSON object
     * @param config {object} Configuration object holding the strings
     * @param configName {string} Name of the configuration string
     * @returns {object} The parsed object
     */
    function parseConfigString(config, configName) {
      var parsedConfig;
      if (!config || !config[configName])
        return null;
      try {
        parsedConfig = JSON.parse(config[configName]);
      } catch (error) {
        console.log(error);
      }
      return parsedConfig;
    }


    /**
     * Get the configuration for the business chart
     * @param config
     * @param dataId
     * @param businessData
     * @returns {*}
     */
    function getConfigBusinessChart(config, dataId, businessData) {

      // parse the configuration strings
      var chartConfig = parseConfigString(config, "Config"),
        seriesConfig = parseConfigString(config, "SeriesConfig"),
        periodsConfig = parseConfigString(config, "DataPoints");

      // the periods configuration is mandatory
      if (!periodsConfig || !periodsConfig.length) {
        return null;
      }

      // add the series and the categories
      if (businessData && dataId) {
        var kpis = dataId.split(";"),
          i, y,
          arrayOfBusinessData = [],
          currentPeriod,
          displayPeriod;

        // the business data can either be delivered as single item or as array
        if (Object.prototype.toString.call(businessData) === '[object Array]') {
          arrayOfBusinessData = businessData;
        } else {
          arrayOfBusinessData.push(businessData);
        }

        // determine the period that the chart need to display
        currentPeriod = my.period_functions.getCurrentPeriod();
        for (i = 0; i < periodsConfig.length; i++) {
          if (periodsConfig[i].months.indexOf(currentPeriod.periodShortName) > -1
            && periodsConfig[i].displayPeriods && periodsConfig[i].displayPeriods.length) {
            displayPeriod = periodsConfig[i].displayPeriods[0];
            break;
          }
        }
        if (!displayPeriod) {
          return null;
        }

        // get the text for the current period
        chartConfig.custom = chartConfig.custom || [];
        chartConfig.custom.periodText = currentPeriod.periodFullName + " " + currentPeriod.year;

        // add the categories
        chartConfig.xAxis = chartConfig.xAxis || {};
        chartConfig.xAxis.categories = [];
        for (i = 0; i < arrayOfBusinessData.length; i++) {
          chartConfig.xAxis.categories.push(arrayOfBusinessData[i].text);
        }

        // add the series
        chartConfig.series = [];
        for (i = 0; i < kpis.length; i++) {
          var kpiSeriesConfig = {};
          if (seriesConfig && seriesConfig["kpiSpecificConfig"] && seriesConfig["kpiSpecificConfig"][kpis[i]]) {
            kpiSeriesConfig = seriesConfig["kpiSpecificConfig"][kpis[i]];
          }

          kpiSeriesConfig.data = [];
          for (y = 0; y < arrayOfBusinessData.length; y++) {
            if (arrayOfBusinessData[y].kpis
              && arrayOfBusinessData[y].kpis[kpis[i]]
              && arrayOfBusinessData[y].kpis[kpis[i]].data
              && arrayOfBusinessData[y].kpis[kpis[i]].data[displayPeriod]
            ) {
              kpiSeriesConfig.data.push(arrayOfBusinessData[y].kpis[kpis[i]].data[displayPeriod]);
            } else {
              kpiSeriesConfig.data.push(null);
            }
          }
          chartConfig.series.push(kpiSeriesConfig);
        }
      }

      // add specific logic
      if (chartConfig.custom
        && chartConfig.custom.config
        && my._specific.charts[chartConfig.custom.config]) {

        my._specific.charts[chartConfig.custom.config].apply(this, [chartConfig])
      }

      return chartConfig;
    }


    function getConfigKpiChart(config, dataId, businessData) {

      // parse the configuration strings
      var chartConfig = parseConfigString(config, "Config"),
        periodsConfig = parseConfigString(config, "DataPoints");

      // the periods configuration is mandatory
      if (!periodsConfig || !periodsConfig.length) {
        return null;
      }

      // add the series and the categories
      if (businessData && dataId) {
        var chartData = filterDataByKpi(periodsConfig, businessData, dataId);
        if (chartData) {
          chartConfig.xAxis.categories = chartData.categories;
          chartConfig.series = chartData.series;
        }
      }

      // add specific logic
      if (chartConfig.custom
        && chartConfig.custom.config
        && my._specific.charts[chartConfig.custom.config]) {

        my._specific.charts[chartConfig.custom.config].apply(this, [chartConfig])
      }

      return chartConfig;
    }


    function filterDataByKpi(periodSettings, businessData, dataId) {
      var chartData = {
          categories: [],
          series: []
        },
        kpiData,
        currentPeriod,
        currentMonth,
        i, y;

      // get the kpis to be displayed
      var kpis = dataId.split(";");

      // determine the current period
      currentPeriod = my.period_functions.getCurrentPeriod();
      if (!currentPeriod) {
        return null;
      }

      // determine which periods are valid for the current month
      var displayPeriods = [];
      for (i = 0; i < periodSettings.length; i++) {
        if (periodSettings[i].months.indexOf(currentPeriod.periodShortName) > -1) {
          displayPeriods = periodSettings[i].displayPeriods;
          break;
        }
      }
      if (!displayPeriods.length) {
        return chartData;
      }

      // categories ==> kpis
      for (i = 0; i < kpis.length; i++) {
        kpiData = businessData.kpis[kpis[i]];
        if (!kpiData || !kpiData.text) {
          continue;
        }

        chartData.categories.push(kpiData.text);
      }

      // data ==> periods
      for (i = 0; i < displayPeriods.length; i++) {
        var seriesObject = {
          data: [],
          name: my.period_functions.getPeriodIdentifierLabel(displayPeriods[i].id)
        };
        for (y = 0; y < kpis.length; y++) {
          if (!businessData.kpis[kpis[y]] || !businessData.kpis[kpis[y]].data) {
            continue;
          }

          seriesObject.data.push(businessData.kpis[kpis[y]].data[displayPeriods[i].id]);
        }

        // series configuration
        var seriesConfiguration = displayPeriods[i].config;
        if (seriesConfiguration.color === "%selectedBusiness%") {
          seriesConfiguration.color = businessData.color;
        }

        seriesObject = $.extend(true, seriesObject, displayPeriods[i].config);
        chartData.series.push(seriesObject);
      }
      return chartData;
    }


    function filterDataByPeriod(periodSettings, businessData, dataId, seriesConfig) {
      var chartData = {
          categories: [],
          series: [],
          currentPeriod: {}
        },
        i, y,
        kpiData,
        defaultSeriesConfig = (seriesConfig && seriesConfig["default"]) ? seriesConfig["default"] : null,
        childrenSeriesConfig = (seriesConfig && seriesConfig.children) ? seriesConfig.children : null;

      // split the kpis
      var kpis = dataId.split(";");

      // determine the current period
      for (i=0; i<kpis.length; i++) {
        kpiData = businessData.kpis[kpis[i]];
        if (kpiData) {
          break;
        }
      }
      if (!kpiData) {
        return null;
      }

      var currentPeriod = my.period_functions.getCurrentPeriod();
      chartData.currentPeriod = {
        id: currentPeriod.periodIdentifier,
        label: currentPeriod.currentPeriod
      };

      // determine which periods are valid for the current month
      var displayPeriods = [];
      for (i = 0; i < periodSettings.length; i++) {
        if (periodSettings[i].months.indexOf(currentPeriod.periodShortName) > -1) {
          displayPeriods = periodSettings[i].displayPeriods;
          break;
        }
      }
      if (!displayPeriods.length) {
        return chartData;
      }

      // categories
      chartData.categories = my.period_functions.getPeriodIdentifierLabel(displayPeriods);


      // data
      var showChildren,
        kpi = null,
        customConfig;

      for (i = 0; i < kpis.length; i++) {
        showChildren = (kpis[i] === "++");
        kpiData = businessData.kpis[kpis[i]];

        // add the KPI for the selected business
        if (!showChildren) {
          var defConfig = defaultSeriesConfig;
          if ((Object.prototype.toString.call(defaultSeriesConfig) === '[object Array]') && defaultSeriesConfig.length > i) {
            defConfig = defaultSeriesConfig[i];
          }

          // check if there is a specific configuration for this kpi
          customConfig = $.extend(true, {}, defConfig);
          if (seriesConfig
            && seriesConfig["kpiSpecificConfig"]
            && seriesConfig["kpiSpecificConfig"][kpis[i]]) {
            customConfig = $.extend(true, customConfig, seriesConfig["kpiSpecificConfig"][kpis[i]]);
          }


          // if next item is ++, show business name, else kpi name
          var displayText = (kpiData && kpiData.text) ? kpiData.text : "";
          if (i < kpis.length - 1 && kpis[i + 1] === "++") {
            displayText = businessData.text;
          }
          kpi = getKPIChartSeries(businessData, kpis[i], displayPeriods, displayText, customConfig);
          if (kpi) {
            chartData.series.push(kpi);
          }
        }

        // add the children if required
        if (showChildren) {
          var businessDatasets = $("body").data("customDataApp").datasets;

          if (businessData && businessData.children && businessData.children.length) {
            for (y = 0; y < businessData.children.length; y++) {
              var childKpis = businessDatasets[businessData.children[y]];

              // check if this child needs to be hidden
              if (seriesConfig
                && seriesConfig["hideChildren"]
                && seriesConfig["hideChildren"].length
                && seriesConfig["hideChildren"].indexOf(childKpis.id) > -1) {
                continue;
              }

              // get the id of the previous entry
              var kpiId = -1;
              if (i > 0) {
                kpiId = kpis[i - 1];
              }

              // check if there is a specific configuration for this kpi
              customConfig = $.extend(true, {}, childrenSeriesConfig);
              if (seriesConfig
                && seriesConfig["kpiSpecificConfig"]
                && seriesConfig["kpiSpecificConfig"][kpiId]) {
                customConfig = $.extend(true, customConfig, seriesConfig["kpiSpecificConfig"][kpiId]);
              }

              kpi = getKPIChartSeries(childKpis, kpiId, displayPeriods, childKpis.text, customConfig);
              if (kpi) {
                chartData.series.push(kpi);
              }
            }
          }
        }
      }
      return chartData;
    }


    function getKPIChartSeries(businessData, kpiId, displayPeriods, displayText, seriesConfig) {
      var kpiData = businessData.kpis[kpiId];

      if (!kpiData) {
        return null;
      }

      var kpiText = displayText ? displayText : kpiData.text;
      var kpi = {
        name: kpiText,
        data: [],
        color: businessData.color ? businessData.color : null
      };
      for (var y = 0; y < displayPeriods.length; y++) {
        kpi.data.push(kpiData.data[displayPeriods[y]])
      }

      return $.extend(true, kpi, seriesConfig);
    }

  };

  return my;

}(shell.app.execdb.dashboard));

//####src/execdb/dashboard/mod_commentary.js
shell.app.execdb.dashboard = ( function (my) {

  my._addViewCommentary = function () {

    // check if the comment editing mode is activated
    var editMode = ($("body").data("comment_edit_mode"));

    // set the CSS
    addCSS(editMode);
    addComment(editMode);


    function addCSS() {

      // only add the CSS if this is not already available
      if ($("#CSS_COMMENTARY").length > 0) {
        return;
      }

      // general CSS for the comment on the VIEW level
      var s = "";
      s += "<style type='text/css' id='CSS_COMMENTARY' data-repstyle='execdb'>";
      s += "#jbi_comment_wrapper{";
      s += " display: table;";
      s += " height: 100%;";
      s += " width: 100%;";
      s += "}";
      s += "#jbi_comment_text{";
      s += " vertical-align: middle;";
      s += " display: table-cell;";
      s += " z-index: 2;";
      s += "}";
      s += "</style>";
      $(s).appendTo("head");
    }


    function addComment(editMode) {

      var contentEditable = "";
      if (editMode) {
        contentEditable = " contenteditable='true' style='background-color:#f8ef9f' ";
      }

      // get the comment
      var commentText = my._getCommentText();
      var decodedText = "";
      try {
        decodedText = decodeURIComponent(commentText);
      }catch(err) {
      }


      var s = "";
//@formatter:off
            s += "<div id=\"jbi_comment_wrapper\">";
              s += "<div id=\"jbi_comment_text\"" + contentEditable + "title=\"" + decodedText + "\">" + decodedText + "</div>";
            s += "</div>";
//@formatter:on
      $("#jbi_comment").html(s);


      // event listener for editing the comment
      if (editMode) {
        var $commentBox = $("#jbi_comment_text");
        $commentBox.unbind("blur");
        $commentBox.on("blur", function (evt) {
          var commentText = evt.currentTarget.innerHTML;
          my._writeComment(commentText)
        });
      }
    }
  };

  my._getCommentKeys = function () {
    var $bodyData = $("body").data(),
      currentView = JSON.parse($bodyData["currentView"]),
      currentFilters = currentView["filterItems"],
      currentPeriod = my.period_functions.getCurrentPeriod(),
      currentMenu = currentView["menuId"].toUpperCase(),
      dashboardId = "CONCEPT";

    if ($bodyData["customConfig"]["CONFIG"] && $bodyData["customConfig"]["CONFIG"]["bw"] && $bodyData["customConfig"]["CONFIG"]["bw"]["Dashboard"]) {
      dashboardId = $bodyData["customConfig"]["CONFIG"]["bw"]["Dashboard"].toUpperCase();
    }


    function convertFilterValue(filterValue) {
      if (filterValue === "*") {
        filterValue = "-";
      }
      return ("" + filterValue).toUpperCase()
    }

    // TODO: Take another look at dynamically generating filters.
    return {
      dashboardId: dashboardId,
      businessId: $bodyData["currentBusiness"].toUpperCase(),
      period: currentPeriod.periodNumber + "." + currentPeriod.year,
      menuId: currentMenu,
      filter1: (currentFilters && currentFilters.length > 0) ? convertFilterValue(currentFilters[0].filterValue) : "-",
      filter2: (currentFilters && currentFilters.length > 1) ? convertFilterValue(currentFilters[1].filterValue) : "-",
      filter3: (currentFilters && currentFilters.length > 2) ? convertFilterValue(currentFilters[2].filterValue) : "-",
      filter4: (currentFilters && currentFilters.length > 3) ? convertFilterValue(currentFilters[3].filterValue) : "-",
      filter5: (currentFilters && currentFilters.length > 4) ? convertFilterValue(currentFilters[4].filterValue) : "-"
    };
  };


  my._getCommentText = function (containerId) {
    var commentText = "";
    var container = containerId || "-";
    var commentKeys = my._getCommentKeys();
    var customData = $("body").data("customDataApp");
    var comments = (customData && customData["comments"]) ? customData["comments"] : [];


    // check if there is a comment for the current selection
    for (var i = 0; i < comments.length; i++) {
      if (comments[i].Menu === commentKeys.menuId
        && comments[i].Business === commentKeys.businessId
        && comments[i].Container === container
        && comments[i].Filter1 === commentKeys.filter1
        && comments[i].Filter2 === commentKeys.filter2
        && comments[i].Filter3 === commentKeys.filter3
        && comments[i].Filter4 === commentKeys.filter4
        && comments[i].Filter5 === commentKeys.filter5
      ) {
        commentText = comments[i].Comment;
        break;
      }
    }

    return commentText;
  };


  my._addContainerCommentary = function (divId) {
    addCSS();
    addContainerComment(divId);


    function addCSS() {

      // only add the CSS if this is not already available
      if ($("#CSS_COMMENTARY_CONTAINER").length > 0) {
        return;
      }

      var $customConfig = $("body").data("customConfig");
      var containerDisplay = ($customConfig && $customConfig["CONFIG"] && $customConfig["CONFIG"]["container"]["EnableComment"] && $customConfig["CONFIG"]["container"]["EnableComment"] === "False") ? "none" : "block";


      // general CSS for the comment on the VIEW level
      var s = "";
      s += "<style type='text/css' id='CSS_COMMENTARY_CONTAINER' data-repstyle='execdb'>";
      s += "  .containerComment {";
      s += "      margin: 1px 2px 1px;";
      s += "      line-height: 24px;";
      s += "      position: relative;";
      s += "      overflow: auto;";
      s += "      font-family: Verdana;";
      s += "      border: 1px solid #D8D8D8;";
      s += "      padding-left: 6px;";
      s += "      font-style: italic;";
      s += "      display: " + containerDisplay + ";";
      s += "      background-color: #F0F0F0;";
      s += "      color: #564A4A;";
      s += "      font-size: 12px;";
      s += "}";
      s += "</style>";
      $(s).appendTo("head");
    }


    function addContainerComment(divId) {

      // check if currently in comment edit mode
      var $body = $("body");
      var editMode = ($body.data("comment_edit_mode"));

      // get the comment text
      var containerId = divId.substring(9);
      var commentText = my._getCommentText(containerId);
      if (commentText === "" && !editMode) {
        return;
      }

      // generate the HTML
      var contentEditable = "";
      if (editMode) {
        contentEditable = " contenteditable='true' style='background-color:#f8ef9f' ";
      }

      var decodedText = "";
      try {
        decodedText = decodeURIComponent(commentText);
      }catch(err){
      }

      var s = "";
      s += "<div " + contentEditable + " class=\"containerComment\">" + decodedText + "</div>";
      $("#" + divId + "ContentBox").append(s);

      // event listener for editing the comment
      if (editMode) {
        var $commentBox = $("#" + divId + "ContentBox .containerComment");
        $commentBox.unbind("blur");
        $commentBox.on("blur", function (evt) {
          var commentText = evt.currentTarget.innerHTML;
          var containerId = evt.target.parentElement.id.substring(9, evt.target.parentElement.id.indexOf("ContentBox"));
          my._writeComment(commentText, containerId)
        });
      }
    }
  };


  my._updateStoredText = function (commentText, containerId) {
    var container = containerId || "-";
    var commentKeys = my._getCommentKeys();
    var customData = $("body").data("customDataApp");
    var comments = (customData && customData["comments"]) ? customData["comments"] : [];

    // check if there is a comment for the current selection
    var newComment = true;
    for (var i = 0; i < comments.length; i++) {
      if (comments[i].Menu === commentKeys.menuId
        && comments[i].Business === commentKeys.businessId
        && comments[i].Container === container
        && comments[i].Filter1 === commentKeys.filter1
        && comments[i].Filter2 === commentKeys.filter2
        && comments[i].Filter3 === commentKeys.filter3
        && comments[i].Filter4 === commentKeys.filter4
        && comments[i].Filter5 === commentKeys.filter5
      ) {
        newComment = false;
        comments[i].Comment = commentText;
        break;
      }
    }

    if (newComment) {
      comments.push({
        Menu: commentKeys.menuId,
        Business: commentKeys.businessId,
        Container: container,
        Filter1: commentKeys.filter1,
        Filter2: commentKeys.filter2,
        Filter3: commentKeys.filter3,
        Filter4: commentKeys.filter4,
        Filter5: commentKeys.filter5,
        Comment: commentText
      })
    }

    customData["comments"] = comments;
  };


  my._writeComment = function (commentText, containerId) {

    // remove the paragraph tags
    var cleanedCommentText = commentText.replace(/<p>/g, "").replace(/<\/p>/g, "");

    // compare the current text with the text stored in BW
    var storedText = my._getCommentText(containerId);
    if (storedText === cleanedCommentText) {
      return;
    }

    var encodedComment = encodeURIComponent(cleanedCommentText);
    if (encodedComment && encodedComment.toString().length > 1000) {
      alert("The entered comment is too long and cannot be saved.");
      return;
    }

    // update the stored text with the new text
    my._updateStoredText(cleanedCommentText, containerId);

    // update the text in the database
    var commentKeys = my._getCommentKeys();
    var inputParams = {
      "I_COMMENT": encodedComment,
      "I_MENU": commentKeys.menuId,
      "I_BUSINESS": commentKeys.businessId,
      "I_CONTAINER": containerId || "",
      "I_FILTER01": commentKeys.filter1,
      "I_FILTER02": commentKeys.filter2,
      "I_FILTER03": commentKeys.filter3,
      "I_FILTER04": commentKeys.filter4,
      "I_FILTER05": commentKeys.filter5,
      "I_PERIOD": commentKeys.period,
      "I_REPORT": commentKeys.dashboardId
    };


    // use an AJAX call in order to retrieve the configuration
    $.ajax({
      type: "POST",
      url: "./../../../shell_json//SHELL/SET_COMMENT_BEX?$format=json",
      xhrFields: {
        withCredentials: true
      },
      async: true,
      dataType: "json",
      data: JSON.stringify(inputParams),
      contentType: "text/plain",
      success: function () {
      },
      error: function (e) {
      }
    });
  };


  return my;


}(shell.app.execdb.dashboard));

//####src/execdb/dashboard/mod_container.js
shell.app.execdb.dashboard = ( function (my) {

  my._buildContainers = function (containersConfig, containersData) {

    // add event listeners
    addContainerEventListeners();

    // Create the containers one by one
    for (var container in containersConfig) {
      if (containersConfig.hasOwnProperty(container)) {
        // Get the data
        var dataId = "";
        for (var i = 0; i < containersData.length; i++) {
          if ("container" + containersData[i].containerId === container) {
            dataId = containersData[i].containerData;
            break;
          }
        }

        // Create the container itself
        createContainerDiv(container, containersConfig[container], dataId);

        // Set the comment
        my._addContainerCommentary(container);


        // Add the content
        addContainerContent(container, containersConfig[container], dataId);
      }
    }

    function addContainerEventListeners() {
      var $body = $("body");
      $body.unbind("showContainerMessage");
      $body.on("showContainerMessage", function(evt, message) {
        var msgType = "";
        switch (message.type) {
          case "E" :
            msgType = "error";
            break;
          case "W" :
            msgType = "warning";
            break;
        }

        var html = "<div class='message-placeholder'><div class='message " + msgType + "'>" + message.message + "</div></div>";
        $("#" + message.container + "Content").append(html);
      })
    }


    /**
     * Create the HTML elements and the CSS
     *
     * Add the CSS for the specific container and the HTML
     *
     * @param containerDiv      the DIV element in which the container needs to be rendered
     * @param cfg               the configuration settings for the DIV
     * @param containerDataIds  the dataId for the container
     */
    function createContainerDiv(containerDiv, cfg, containerDataIds) {

      var titleEnabled = (cfg.config["TitleEnabled"] === "True"),
        footerEnabled = (cfg.config["FooterEnabled"] === "True"),
        $body = $("body"),
        businessData,
        kpiName, businessName, dataIds, dataId;

      // get the CSS values based on the parameters
      var titleDisplay = titleEnabled ? "block" : "none",
        titleHeightPixels = (titleEnabled && cfg.config["TitleHeightPixels"]) ? cfg.config["TitleHeightPixels"] : 0,
        titleLabel = (titleEnabled && cfg.config["TitleLabel"]) ? cfg.config["TitleLabel"] : "",
        titleMarginTop = (titleEnabled && cfg.config["TitleMarginTop"]) ? cfg.config["TitleMarginTop"] : "0",
        footerLabel = (footerEnabled && cfg.config["FooterLabel"]) ? cfg.config["FooterLabel"] : "",
        footerDisplay = footerLabel !== "" ? "block" : "none";

      // replace placeholders in the title
      try {
        if (titleLabel) {
          // business name
          businessData = $body.data("customDataApp").datasets[$body.data("currentBusiness")];
          businessName = (businessData && businessData.text) ? businessData.text : "Business";
          titleLabel = titleLabel.replace(/<=business=>/g, businessName);

          // KPI name (first)
          dataIds = (containerDataIds) ? containerDataIds.split(";") : null;
          dataId = (dataIds && dataIds.length) ? dataIds[0] : null;
          kpiName = (dataId && businessData && businessData.kpis && businessData.kpis[dataId] )
            ? businessData.kpis[dataId].text
            : "KPI";
          titleLabel = titleLabel.replace(/<=kpi=>/g, kpiName);
        }
      } catch(err) {}

      // CSS
      var s = "";
      s += "<style type='text/css' id='CSS_Layout_1_" + containerDiv + "' data-group='LAYOUT'  data-repstyle='execdb'>";
      s += "#" + containerDiv + "ContentBox{";
      if (cfg.config["BorderEnabled"] && cfg.config["BorderEnabled"] === 'False') {
        s += "    border-style:none;";
      }
      if (cfg.config["MaxContentWidth"] !== undefined && cfg.config["MaxContentWidth"] !== null && cfg.config["MaxContentWidth"] !== "") {
        s += "    max-width:" + cfg.config["MaxContentWidth"] + "px;";
        //s += "    margin: 0 auto;"
      }
      s += "}";
      s += "#" + containerDiv + "Title{";
      s += "    display: " + titleDisplay + ";";
      s += "    margin-top:" + titleMarginTop + "px;";
      s += "}";
      s += "#" + containerDiv + "ZoomButton{";
      s += "    float: right;";
      s += "    position: absolute;";
      s += "    font-size: 14px;";
      s += "    text-align : center;";
      s += "    height: " + titleHeightPixels + "px;";
      s += "    width : 25px;";
      s += "    right: 0;";
      s += "    top: 0;";
      s += "    color: #333;";
      s += "    line-height: " + titleHeightPixels + "px;";
      s += "}";
      if (!my.isMobile) {
        s += "#" + containerDiv + "ZoomButton:hover{";
        s += "    background-color: #D8D8D8;";
        s += "    cursor: pointer;";
        s += "}";
      }
      s += "#" + containerDiv + "Content{";
      s += "    background-color: white;";
      s += "    position: relative;";
      s += "    overflow: auto;";
      if (cfg.config["MinContentHeight"])
        s += "    min-height : " + cfg.config["MinContentHeight"] + ";";
      if (cfg.config["MaxContentHeight"])
        s += "    max-height : " + cfg.config["MaxContentHeight"] + ";";
      if (cfg.config["Height"])
        s += "    height : " + cfg.config["Height"] + ";";
      s += "}";
      s += "#" + containerDiv + "Titlebar{";
      if (titleEnabled) {
        s += "    display: " + titleDisplay + ";";
      } else {
        s += "    display: none;";
      }
      s += "}";
      s += "#" + containerDiv + "Footer{";
      s += "    display: " + footerDisplay + ";";
      s += "}";
      s += "</style>";
      $(s).appendTo("head");

      // HTML
      var strHTML = "";
      strHTML += "<div id=\"" + containerDiv + "ContentBox\" class='container-content-box'>";
      strHTML += "   <div id=\"" + containerDiv + "Titlebar\" class='container-titlebar'>";
      strHTML += "      <div id=\"" + containerDiv + "Title\" class='container-title'>" + titleLabel + "</div>";

      if (!cfg.config["ShowExpandButton"] || cfg.config["ShowExpandButton"] !== "False") {
        strHTML += "      <div id=\"" + containerDiv + "ZoomButton\" class='zoomButton'><svg style='margin-top:3px;' width=\"16px\" height=\"16px\" viewBox=\"0 0 1792 1792\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M883 1056q0 13-10 23l-332 332 144 144q19 19 19 45t-19 45-45 19h-448q-26 0-45-19t-19-45v-448q0-26 19-45t45-19 45 19l144 144 332-332q10-10 23-10t23 10l114 114q10 10 10 23zm781-864v448q0 26-19 45t-45 19-45-19l-144-144-332 332q-10 10-23 10t-23-10l-114-114q-10-10-10-23t10-23l332-332-144-144q-19-19-19-45t19-45 45-19h448q26 0 45 19t19 45z\"/></svg></div>";
      }
      strHTML += "   <\/div>";
      strHTML += "   <div id=\"" + containerDiv + "Content\" class=\"containerContent\"></div>";
      strHTML += "   <div id=\"" + containerDiv + "Footer\" class='container-footer'>" + footerLabel + "</div>";
      strHTML += "<\/div>";
      $("#" + containerDiv).html(strHTML);


      // Event handlers
      var $zoomButton = $("#" + containerDiv + "ZoomButton");
      $zoomButton.unbind(my.eventTrigger);
      $zoomButton.on(my.eventTrigger, function (e) {
        e.preventDefault();

        var currentViewObject = JSON.parse($("body").data("currentView"));

        $("#jbi_content").fadeOut("fast", function () {
          $("#jbi_content").empty();
          $("#jbi_application").hide();

          my._buildContainersFullscreen(currentViewObject.viewId + containerDiv);
        });
      });
    }


    /**
     * Add the container content
     *
     * Based on the settings add the content (is FN_OBJECT_*) to the
     * container.
     *
     * @param containerDiv  the DIV element in which the container needs to
     *                      be rendered
     * @param cfg           the configuration settings for the DIV
     * @param dataId        the dataId for the container
     */
    function addContainerContent(containerDiv, cfg, dataId) {

      // check if the containerDiv is existing
      if ($("#" + containerDiv).length === 0) {
        return;
      }

      // check if a configuration is avaible
      if (!cfg || !cfg.config["ContainerObject"]) {
        return;
      }

      // get the dataset for the selected business
      var businessData = null;
      var $jbi_businesses = $('#jbi_businesses');
      if ($jbi_businesses.jstree) {
        var businessId = $jbi_businesses.jstree('get_selected')[0];
        var customData = $("body").data("customDataApp");
        if (customData.datasets && customData.datasets[businessId]) {
          businessData = customData.datasets[businessId];
        }
      }

      // check which object needs to be displayed
      var contentCfg;
      switch (cfg.config["ContainerObject"]) {
        case 'FreeFormat' :
          contentCfg = cfg.free;
          my._createFreeformat(containerDiv, contentCfg, dataId, businessData);
          break;

        case 'Grid' :
          contentCfg = cfg.grid;
          my._createGrid(containerDiv, contentCfg, dataId, businessData);
          break;

        case 'Table' :
          contentCfg = cfg.table;
          my._createTable(containerDiv, contentCfg, dataId, businessData);
          break;

        case 'Chart' :
          contentCfg = cfg.chart;
          my._createChart(containerDiv, contentCfg, dataId, businessData);
          break;

        case 'BulletChart':
          contentCfg = cfg.bullet;
          my._createBulletChart(containerDiv, contentCfg, dataId, businessData);
          break;

        case 'TrendChart':
          contentCfg = cfg.trendchart;
          my._createTrendChart(containerDiv, contentCfg, dataId, businessData);
          break;

        case 'HTMLCommentary':
          contentCfg = cfg.htmlcommentary;
          my._createHTMLCommentary(containerDiv, contentCfg, dataId, businessData);
      }

      // check if there is a content configuration available
      if (!contentCfg) {
        $("body").trigger("showContainerMessage", {
          container: containerDiv,
          message: "No configuration found for the current selection.",
          type: "E"
        });
      }
    }

  };


  return my;


}(shell.app.execdb.dashboard));

//####src/execdb/dashboard/mod_containerfullscreen.js
shell.app.execdb.dashboard = ( function (my) {

  my._buildContainersFullscreen = function (currentContainer) {

    // add the CSS and HTML
    addCSS();
    buildHTML();

    // get the container information
    getViewContainers();
    setNavigation(currentContainer);


    function setNavigation(currentContainer) {
      var $zoomContainerViewContent = $("#zoomContainerViewContent"),
        $zoomContainerViewTitle = $("#zoomContainerViewTitle"),
        $zoomContainerBackButton = $("#zoomContainerBackButton"),
        $zoomContainerForwardButton = $("#zoomContainerForwardButton");


      $zoomContainerViewContent.fadeOut("slow", function () {

        $("[data-group='LAYOUT']").remove();
        $zoomContainerViewContent.html("");

        // get the configuration of all containers for this view
        var containersConfig = $("#zoomContainer").data("containers");

        // get the configuration of the current container
        var idxCurrentContainer = -1;
        for (var i = 0; i < containersConfig.length; i++) {
          if (containersConfig[i].containerId === currentContainer) {
            idxCurrentContainer = i;
            break;
          }
        }
        if (idxCurrentContainer === -1) {
          return;
        }

        // set the view title
        var viewTitle = ( containersConfig[idxCurrentContainer].name === undefined) ? "" : containersConfig[idxCurrentContainer].name;
        $zoomContainerViewTitle.find("span").html(viewTitle);


        // if there is only one container, let the navigation buttons hidden
        if (containersConfig.length > 1) {

          // previous config
          var previousContainerConfig, nextContainerConfig;
          if (idxCurrentContainer === 0) {
            previousContainerConfig = containersConfig[containersConfig.length - 1];
          } else {
            previousContainerConfig = containersConfig[idxCurrentContainer - 1];
          }
          $zoomContainerBackButton.find("span").html(previousContainerConfig.name);
          $zoomContainerBackButton.data("currentContainer", previousContainerConfig.containerId);

          // next config
          if (idxCurrentContainer === containersConfig.length - 1) {
            nextContainerConfig = containersConfig[0];
          } else {
            nextContainerConfig = containersConfig[idxCurrentContainer + 1];
          }
          $zoomContainerForwardButton.find("span").html(nextContainerConfig.name);
          $zoomContainerForwardButton.data("currentContainer", nextContainerConfig.containerId);

          // show the buttons
          $zoomContainerBackButton.show();
          $zoomContainerForwardButton.show();
        }

        // get the dataset for the selected business
        var businessData = null,
          $jbiBusiness = $("#jbi_businesses");
        if ($jbiBusiness.jstree) {
          var businessId = $jbiBusiness.jstree('get_selected')[0];
          var customData = $("body").data("customDataApp");
          if (customData.datasets && customData.datasets[businessId]) {
            businessData = customData.datasets[businessId];
          }
        }

        // populate the container
        var contentCfg;
        var currentConfig = containersConfig[idxCurrentContainer];
        switch (currentConfig.config.config.ContainerObject) {
          case 'FreeFormat' :
            contentCfg = currentConfig.config.free;
            my._createFreeformat("zoomContainerView", contentCfg, currentConfig.dataId, businessData);
            break;

          case 'Grid' :
            contentCfg = currentConfig.config.grid;
            my._createGrid("zoomContainerView", contentCfg, currentConfig.dataId, businessData);
            break;

          case 'Table' :
            contentCfg = currentConfig.config.table;
            my._createTable("zoomContainerView", contentCfg, currentConfig.dataId, businessData);
            break;

          case 'Chart' :
            contentCfg = currentConfig.config.chart;
            my._createChart("zoomContainerView", contentCfg, currentConfig.dataId, businessData);
            break;

          //case 'HTML' :
          //  contentCfg = currentConfig.config.html;
          //  break;

          case 'BulletChart':
            contentCfg = currentConfig.config.bullet;
            my._createBulletChart("zoomContainerView", contentCfg, currentConfig.dataId, businessData);
            break;

          case 'BulletChartContainer':
            contentCfg = currentConfig.config.bullet;
            my._createBulletChartContainer("zoomContainerView", contentCfg, currentConfig.dataId, currentContainer);
            break;

          case 'TrendChart':
            contentCfg = currentConfig.config.trendchart;
            my._createTrendChart("zoomContainerView", contentCfg, currentConfig.dataId, businessData);
            break;

          case 'HTMLCommentary':
            contentCfg = currentConfig.config.htmlcommentary;
            my._createHTMLCommentary("zoomContainerView", contentCfg, currentConfig.dataId, businessData);
            break;
        }

        $("#zoomContainerViewContent").fadeIn("slow");

      });
    }


    function getViewContainers() {
      var currentView = JSON.parse($("body").data("currentView")),
        containers = getContainersForMenuAndFilters(currentView.menuId),
        $zoomContainer = $("#zoomContainer");

      // store the container information in the DIV
      $zoomContainer.data("containers", containers);
    }


    function addCSS() {

      var cfg = $("body").data("customConfig")["CONFIG"].zoomContainer || {};
      var titleHeaderColor = (cfg.TitleBackgroundColor && cfg.TitleBackgroundColor !== "") ? cfg.TitleBackgroundColor  : "#F0F0F0";

      // make sure that the CSS is loaded once only
      var cssCheck = $("#CSS_ZOOMCONTAINER");
      if (cssCheck.length && cssCheck.length > 0) {
        return;
      }

      // create the CSS
      var s = "";
      s += "<style type='text/css' id='CSS_ZOOMCONTAINER' data-repstyle='execdb'>";
      s += "#zoomContainer{";
      s += " position:fixed;";
      s += " z-index: 99999999;";
      s += " left: 0;";
      s += " right: 0;";
      s += " top: 0;";
      s += " bottom: 0;";
      s += " background-color: white;";
      s += " font-family: Tahoma,Arial,Helvetica,sans-serif;";
      s += "}";
      s += "#zoomContainerClose{";
      s += " position:absolute;";
      s += " display:inline-block;";
      s += " float:right;";
      s += " right:20px;";
      s += " width:40px;";
      s += " text-align:center;";
      s += " font-size: 40px;";
      s += " cursor:pointer;";
      s += "}";
      s += "#zoomContainerReportName{";
      s += " position:absolute;";
      s += " top:10px;";
      s += " left:20px;";
      s += " font-size:20px;";
      s += " color: #333;";
      s += "}";
      s += "#zoomContainerFilters{";
      s += " position:absolute;";
      s += " top:40px;";
      s += " right:20px;";
      s += " left:20px;";
      s += " font-size:16px;";
      s += " color: #333;";
      s += "}";
      s += "#zoomContainerFilters i:not(:first-of-type) {";
      s += " margin-left:30px;";
      s += "}";
      s += "#zoomContainerView{";
      s += " position:absolute;";
      s += " top:70px;";
      s += " right:20px;";
      s += " left:20px;";
      s += " bottom:20px;";
      s += " border:1px solid lightgrey;";
      s += "}";
      s += "#zoomContainerBackButton{";
      s += " position:absolute;";
      s += " top:7px;";
      s += " left:5px;";
      s += " font-size:12px;";
      s += " color: darkgrey;";
      s += " display:inline-block;";
      s += "}";
      if (!my.isMobile) {
        s += "#zoomContainerBackButton:hover{";
        s += " color: #333;";
        s += " cursor: pointer;";
        s += "}";
      }
      s += "#zoomContainerForwardButton{";
      s += " position:absolute;";
      s += " top:7px;";
      s += " right:5px;";
      s += " color: darkgrey;";
      s += " font-size:12px;";
      s += " display:inline-block;";
      s += "}";
      if (!my.isMobile) {
        s += "#zoomContainerForwardButton:hover{";
        s += " color: #333;";
        s += " cursor: pointer;";
        s += "}";
      }
      s += "#zoomContainerViewTitle{";
      s += " position:absolute;";
      s += " top:0;";
      s += " text-align:center;";
      s += " font-size:16px;";
      s += " display:inline-block;";
      s += " color:#333;";
      s += " width: 100%;";
      s += " line-height: 30px;";
      s += " height: 30px;";
      s += " background-color: " + titleHeaderColor + ";";
      s += "}";
      s += "#zoomContainerViewContent{";
      s += " position:absolute;";
      s += " top:30px;";
      s += " left:0;";
      s += " right:0;";
      s += " bottom:0;";
      s += " display:block;";
      s += " background-color: white;";
      s += " overflow: auto;";
      s += "}";
      s += "</style>";
      $(s).appendTo("head");
    }


    function buildHTML() {

      // get the report title, menu title and the selected filters
      var $body = $("body"),
        cfg = $body.data("customConfig"),
        i, y,
        currentView = JSON.parse($body.data("currentView")),
        reportTitle = "",
        menuTitle = "",
        filtersText = $('#jbi_businesses').jstree().get_selected(true)[0].text;

      // report title
      if (cfg && cfg["CONFIG"] && cfg["CONFIG"].header && cfg["CONFIG"].header["Title"]) {
        reportTitle = cfg["CONFIG"].header["Title"];
      }

      // menu title
      if (currentView && currentView.menuId && cfg && cfg["MENU_ITEMS"] && cfg["MENU_ITEMS"].length) {
        for (i = 0; i < cfg["MENU_ITEMS"].length; i++) {
          if (cfg["MENU_ITEMS"][i].id === currentView.menuId) {
            menuTitle = cfg["MENU_ITEMS"][i].text;
            break;
          }
        }


        // filters
        var filters = my._getValidMenuFilters(currentView.menuId);
        if (filters && filters.length && cfg["FILTER_ITEMS"] && cfg["FILTER_ITEMS"].length) {

          // loop over the filters for the current menu item
          for (i = 0; i < filters.length; i++) {
            var filterName = "",
              filterValues = [];

            // get the text of the filter and the selected filter value
            for (y = 0; y < cfg["FILTER_ITEMS"].length; y++) {
              if (filters[i].filter === "FILTER_" + cfg["FILTER_ITEMS"][y].id) {
                filterName = cfg["FILTER_ITEMS"][y].name;

                if (cfg["FILTER_ITEMS"][y].type === "IconFilter") {
                  break;
                }

                // get the filter values
                if (!filters[i].selectedValues || !filters[i].selectedValues.length || filters[i].selectedValues.length === 0) {
                  filterValues.push("-");
                } else {
                  for (var x = 0; x < filters[i].selectedValues.length; x++) {
                    for (var z = 0; z < cfg["FILTER_ITEMS"][y].filterValues.length; z++) {
                      if (filters[i].selectedValues[x] === cfg["FILTER_ITEMS"][y].filterValues[z].key) {
                        filterValues.push(cfg["FILTER_ITEMS"][y].filterValues[z].text);
                      }
                    }
                  }
                }
                break;
              }
            }

            // add the filter text
            if (filtersText !== "") {
              filtersText += "; ";
            }
            if (filterName !== "") {
              filtersText += "<i class=\"fa fa-filter\"></i> " + filterName.toUpperCase() + " : " + filterValues.join();
            }

          }
        }
      }

//@formatter:off
      var s = "";
      s += "<div style='display:none;' id='zoomContainer'>";
        s += "<div id='zoomContainerClose'>";
          s += "<svg width='42px' height='42px' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'><path d='M1225 1079l-146 146q-10 10-23 10t-23-10l-137-137-137 137q-10 10-23 10t-23-10l-146-146q-10-10-10-23t10-23l137-137-137-137q-10-10-10-23t10-23l146-146q10-10 23-10t23 10l137 137 137-137q10-10 23-10t23 10l146 146q10 10 10 23t-10 23l-137 137 137 137q10 10 10 23t-10 23zm215-183q0-148-73-273t-198-198-273-73-273 73-198 198-73 273 73 273 198 198 273 73 273-73 198-198 73-273zm224 0q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z'/></svg>";
        s += "</div>";
        s += "<div id='zoomContainerReportName'>";
          s += "<span>" + reportTitle + " - " + menuTitle.toUpperCase() + "</span>";
        s += "</div>";
        s += "<div id='zoomContainerFilters'>";
          s += "<span>" + filtersText + "</span>";
        s += "</div>";
        s += "<div id='zoomContainerView'>";
          s += "<div id='zoomContainerViewTitle'>";
            s += "<span></span>";
          s += "</div>";
          s += "<div style='display:none;' id='zoomContainerBackButton' class='zoomNavButton'>";
            s += "<svg style='margin-top:0px;' width='16px' height='16px' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'><path d='M1363 141q19-19 32-13t13 32v1472q0 26-13 32t-32-13l-710-710q-9-9-13-19v678q0 26-19 45t-45 19h-128q-26 0-45-19t-19-45v-1408q0-26 19-45t45-19h128q26 0 45 19t19 45v678q4-11 13-19z' fill='darkgrey'/></svg>";
            s += "<span style='vertical-align:top;'></span>";
          s += "</div>";
          s += "<div style='display:none;' id='zoomContainerForwardButton' class='zoomNavButton'>";
            s += "<span style='vertical-align:top;'></span>";
            s += "<svg style='margin-top:0px;' width='16px' height='16px' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'><path d='M429 1651q-19 19-32 13t-13-32v-1472q0-26 13-32t32 13l710 710q8 8 13 19v-678q0-26 19-45t45-19h128q26 0 45 19t19 45v1408q0 26-19 45t-45 19h-128q-26 0-45-19t-19-45v-678q-5 10-13 19z' fill='darkgrey'/></svg>";
          s += "</div>";
          s += "<div id='zoomContainerViewContent'></div>";
        s += "</div>";
      s += "</div>";
//@formatter:on

      $body.append(s);

      $("#zoomContainer").fadeIn('slow', function () {
        addEventHandlers();
      });

    }


    function addEventHandlers() {
      var $zoomContainerClose = $("#zoomContainerClose");
      $zoomContainerClose.unbind(my.eventTrigger);
      $zoomContainerClose.on(my.eventTrigger, function (e) {
        e.preventDefault();

        $("#zoomContainer").fadeOut('fast', function () {

          // show the menu
          $("#jbi_application").show();

          // reload the view
          $("#zoomContainer").hide("fast", function () {
            var viewConfig = JSON.parse($("body").data("currentView"));
            my._updateView(viewConfig);

            $("#zoomContainer").remove();

            $("#jbi_content").children().fadeIn("slow");
          });

        });
      });


      var $zoomNavButton = $(".zoomNavButton");
      $zoomNavButton.unbind(my.eventTrigger);
      $zoomNavButton.on(my.eventTrigger, function (e) {
        e.preventDefault();
        var currentContainer = $(this).data("currentContainer");

        setNavigation(currentContainer);
      });
    }


    function getContainersForMenuAndFilters(menuId) {
      var validViews = [],
        $body = $("body"),
        customData = $body.data("customConfig"),
        viewsConfig = customData["VIEWS"],
        filters,
        filtersConfig = customData["FILTER_ITEMS"],
        businessData,
        kpiName, businessName, dataIds, dataId,
        i, y;

      if (!viewsConfig) {
        return null;
      }

      // extract the relevant filters for the current menu
      filters = my._getValidMenuFilters(menuId);


      // check per views config if there is one that meets all conditions
      for (i = 0; i < viewsConfig.length; i++) {
        var validView = true;

        // at least the menuId must be right
        if (viewsConfig[i].menuId !== menuId || viewsConfig[i].filterItems.length === 0) {
          continue;
        }

        // then all the valid filters for the menuId must be right
        for (y = 0; y < filters.length; y++) {
          var filterPassed = false;

          // if no selection is made, no filters can be met
          if (filters[y].selectedValues.length === 0) {
            break;
          }

          // check for each filtervalue in the views if that is correct
          for (var idxViewsFilter = 0; idxViewsFilter < viewsConfig[i].filterItems.length; idxViewsFilter++) {
            if (viewsConfig[i].filterItems[idxViewsFilter].filterId === filters[y].filter) {

              // check if the value is correct
              if (viewsConfig[i].filterItems[idxViewsFilter].filterValue === "*") {
                filterPassed = true;
                break;
              }

              // skip the filters of type IconFilter
              for (var z = 0; z < filtersConfig.length; z++) {
                if (filters[y].filter === "FILTER_" + filtersConfig[z].id) {
                  if (filtersConfig[z].type === "IconFilter") {
                    filterPassed = true;
                  }
                  break;
                }
              }


              if (viewsConfig[i].filterItems[idxViewsFilter].filterValue.substring(0, 1) === "!" &&
                viewsConfig[i].filterItems[idxViewsFilter].filterValue.substring(1) !== filters[y].selectedValues[0]) {
                filterPassed = true;
                break;
              }

              if (viewsConfig[i].filterItems[idxViewsFilter].filterValue === filters[y].selectedValues[0]) {
                filterPassed = true;
                break;
              }
            }
          }

          // if the filter did not pass, proceed to the next viewConfig
          if (!filterPassed) {
            validView = false;
            break;
          }
        }

        if (validView) {
          validViews.push(viewsConfig[i]);
        }
      }

      // filter by business
      var selectedBusinessId = $('#jbi_businesses').jstree().get_selected(true)[0].id;

      // extract the reports (based on the filters)
      var business_reports = {};
      for (i = 0; i < validViews.length; i++) {
        var filterItems = validViews[i].filterItems;
        var reportId = "";
        var reportFilters = [];
        for (y = 0; y < filterItems.length; y++) {
          if (filterItems[y].filterValue !== "*") {
            reportId += filterItems[y].filterId + filterItems[y].filterValue;
            reportFilters.push(filterItems[y]);
          }
        }
        business_reports[reportId] = business_reports[reportId] || {
            id: reportId,
            filters: reportFilters,
            views: [],
            viewIndices: []
          };
        business_reports[reportId]["views"].push(validViews[i]);
        //business_reports[reportId]["viewIndices"].push(viewIndicesForPrint[i]);
      }

      // determine which view to use for which report
      var businessViews = [];
      if (Object.keys(business_reports).length < (validViews.length + 1)) {

        // check if one of the reports is specifically for the business
        for (var report in business_reports) {
          if (business_reports.hasOwnProperty(report)) {
            var currentReport = business_reports[report];

            // if only one report is valid, don't look further
            if (currentReport["views"].length === 1) {
              businessViews.push(currentReport["views"][0]);
            } else {

              // check for a specific report
              var hasSpecificReport = false;
              for (i = 0; i < currentReport["views"].length; i++) {
                var businesses = currentReport["views"][i].businessId.split(";");
                if (businesses.indexOf(selectedBusinessId) > -1) {
                  hasSpecificReport = true;
                  businessViews.push(currentReport["views"][i]);
                  break;
                }
              }

              // get the 'general' report
              if (!hasSpecificReport) {
                for (i = 0; i < currentReport["views"].length; i++) {
                  if (currentReport["views"][i].businessId === "*") {
                    businessViews.push(currentReport["views"][i]);
                    break;
                  }
                }
              }
            }
          }
        }
      } else {
        businessViews = validViews;
      }

      var containers = [];
      for (i = 0; i < businessViews.length; i++) {
        if (!businessViews[i].viewId
          || !customData[businessViews[i].viewId]
          || !businessViews[i].containerData
          || !businessViews[i].containerData.length) {
          continue;
        }

        var viewConfig = customData[businessViews[i].viewId];
        for (y = 0; y < businessViews[i].containerData.length; y++) {

          // replace the placeholders in the titlelabel
          var containerConfig = (viewConfig.containers["container" + businessViews[i].containerData[y].containerId])
            ? viewConfig.containers["container" + businessViews[i].containerData[y].containerId].config
            : null;

          var titleLabel = (containerConfig) ? containerConfig.TitleLabel : "";
          try {
            if (titleLabel) {
              // business name
              businessData = $body.data("customDataApp").datasets[$body.data("currentBusiness")];
              businessName = (businessData && businessData.text) ? businessData.text : "Business";
              titleLabel = titleLabel.replace(/<=business=>/g, businessName);

              // KPI name (first)
              dataIds = (businessViews[i].containerData[y].containerData) ? businessViews[i].containerData[y].containerData.split(";") : null;
              dataId = (dataIds && dataIds.length) ? dataIds[0] : null;
              kpiName = (dataId && businessData && businessData.kpis && businessData.kpis[dataId] )
                ? businessData.kpis[dataId].text
                : "KPI";
              titleLabel = titleLabel.replace(/<=kpi=>/g, kpiName);
            }
          } catch(err) {}

          containers.push({
            containerId: businessViews[i].viewId + "container" + businessViews[i].containerData[y].containerId,
            name: titleLabel,
            dataId: businessViews[i].containerData[y].containerData,
            config: viewConfig.containers["container" + businessViews[i].containerData[y].containerId]
          });
        }
      }
      return containers;
    }
  };


  return my;


}(shell.app.execdb.dashboard));

//####src/execdb/dashboard/mod_filters.js
shell.app.execdb.dashboard = ( function (my) {


  my._setSelectedFilterValues = function (filters, simulate) {
    for (var i = 0; i < filters.length; i++) {
      var $filterItem = $("[data-filterid = " + filters[i].id + " ][data-filterkey = '" + filters[i].value + "']")[0];

      if (simulate) {
        $($filterItem).addClass("simulation");    // used for PDF printing
      }

      if (filters[i].type === "TopPane") {
        $($filterItem).trigger(my.eventTrigger);
        $($filterItem).trigger(my.eventTrigger);
      } else {
        $($filterItem).trigger(my.eventTrigger);
      }

    }
  };


  /**
   * APPLICATION FILTERS
   * This function is triggered from the config Handler and adds all the
   * filters. By default all filters are hidden
   **/
  my._buildFilters = function () {

    // get the config parameters
    var customData = $("body").data("customConfig"),
      filterItems = customData.FILTER_ITEMS,
      dashboardConfig = customData.CONFIG;

    // build the filters and set the event handlers
    createHTML(filterItems, dashboardConfig.dashboard.Layout);
    addEventListeners();
    updateSelectedFilters();


    /**
     * EVENT HANDLERS
     * Event listeners for the filter items
     **/
    function addEventListeners() {

      // Menu Item Click
      var $filterValue = $(".filterValue");

      $filterValue.unbind(my.eventTrigger);
      $filterValue.on(my.eventTrigger, function (evt) {
        evt.preventDefault();

        if ($(this).hasClass("filterDisabled")) {
          evt.stopPropagation();
          return;
        }

        var preventViewBuild = false;
        if ($(this).hasClass("simulation")) {
          preventViewBuild = true;
          $(this).removeClass("simulation")
        }

        // get the parameters of the clicked items
        var selectedFilterId = $(this).data("filterid"),
          selectedFilterKey = $(this).data("filterkey"),
          selectedFilterText = $(this).data("filtertext"),
          customData = $("body").data("customConfig"),
          filterItems = customData.FILTER_ITEMS,
          i,
          cfg = null;

        // get the configuration for the filter item
        for (i = 0; i < filterItems.length; i++) {
          if (filterItems[i].id == selectedFilterId) {
            cfg = filterItems[i];
            break;
          }
        }
        if (cfg === null) {
          return;
        }


        // check if the selected item is already selected
        if ($(this).hasClass("filterActive")) {
          return;
        } else {
          $("#jbi_filter_" + selectedFilterId + " .filterValue").removeClass("filterActive");
          $(this).addClass("filterActive");
        }


        // get the selection text
        if (cfg.type === "TopPane") {
          $("#jbi_filter_" + selectedFilterId + " > span").html(selectedFilterText + "<svg style='position:absolute;right:3px;top:9px;' class='filter_click_down_icon' width='12px' height='12px' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'><path d='M1408 704q0 26-19 45l-448 448q-19 19-45 19t-45-19l-448-448q-19-19-19-45t19-45 45-19h896q26 0 45 19t19 45z'/></svg>");
        }


        // check if the filter items need to be made visible
        displayFilterValuesParent(cfg, selectedFilterKey);

        // check if the changed filter was assigned to a filter group
        if (cfg.filterGroup) {

          // loop over each filter and change the selected value
          for (i = 0; i < filterItems.length; i++) {

            if (filterItems[i].filterGroup &&
              filterItems[i].id != selectedFilterId &&
              filterItems[i].filterGroup === cfg.filterGroup) {

              // remove the active filter
              $("#jbi_filter_" + filterItems[i].id + " .filterActive").removeClass("filterActive");

              // find the new filter
              var newActiveFilterFound = false,
                nothingFound = false,
                currentFilterValue = selectedFilterKey;
              while (!newActiveFilterFound && !nothingFound) {

                if ($(".filterValue[data-filterid='" + filterItems[i].id + "'][data-filterkey='" + currentFilterValue + "']").length > 0) {
                  $(".filterValue[data-filterid='" + filterItems[i].id + "'][data-filterkey='" + currentFilterValue + "']").addClass("filterActive");
                  newActiveFilterFound = true;
                  break;
                }

                // get the parent for the currentFilterValue
                nothingFound = true;
                for (var y = 0; y < cfg.filterValues.length; y++) {
                  if (cfg.filterValues[y].key === currentFilterValue && cfg.filterValues[y].parent) {
                    currentFilterValue = cfg.filterValues[y].parent;
                    nothingFound = false;
                    break;
                  }
                }

                // change the selection to the default selection if nothing was found
                if (nothingFound) {
                  for (var y = 0; y < filterItems[i].filterValues.length; y++) {
                    if (filterItems[i].filterValues[y].selected) {
                      currentFilterValue = filterItems[i].filterValues[y].key;
                      nothingFound = false;
                      break;
                    }
                  }
                }
              }

              if (newActiveFilterFound) {
                displayFilterValuesParent(filterItems[i], currentFilterValue);
              }

            }
          }
        }

        $('body').trigger('beforePageRender');

        // get the selected filters
        updateSelectedFilters(preventViewBuild);
      });
    }


    function displayFilterValuesParent(cfg, selectedFilterKey) {

      var i;

      if (cfg.filterValues
        && cfg.filterValues.length
        && cfg.filterValues.length > 0) {

        // fill an array with items that should be displayed
        var displayItems = [];

        // add the selected item
        displayItems.push(selectedFilterKey);

        // add the parents of the selected item
        var selectedItemObject;
        for (i = 0; i < cfg.filterValues.length; i++) {
          if (cfg.filterValues[i].key === selectedFilterKey) {
            selectedItemObject = cfg.filterValues[i];
            break;
          }
        }
        if (selectedItemObject.parent) {
          displayItems.push(selectedItemObject.parent);

          // loop over the parents until all parents are found (limit to max 6 levels)
          var parentItemKey = selectedItemObject.parent,
            safetyLimit = 0,
            allParentsFound = false;

          while (!allParentsFound && safetyLimit < 6) {

            for (i = 0; i < cfg.filterValues.length; i++) {
              if (cfg.filterValues[i].key === parentItemKey) {
                if (cfg.filterValues[i].parent) {
                  displayItems.push(cfg.filterValues[i].parent);
                  parentItemKey = cfg.filterValues[i].parent;

                  // add the siblings of the parent
                  for (var y = 0; y < cfg.filterValues.length; y++) {
                    if (cfg.filterValues[y].parent === parentItemKey) {
                      displayItems.push(cfg.filterValues[y].key);
                    }
                  }

                } else {
                  allParentsFound = true;
                }
                break;
              }
            }
            safetyLimit++;
          }
        }

        // add all the siblings
        for (i = 0; i < cfg.filterValues.length; i++) {
          if ((cfg.filterValues[i].parent && cfg.filterValues[i].parent === selectedItemObject.parent ) || ( !selectedItemObject.parent && !cfg.filterValues[i].parent )) {
            displayItems.push(cfg.filterValues[i].key);
          }
        }


        // add all the children
        for (i = 0; i < cfg.filterValues.length; i++) {
          if (cfg.filterValues[i].parent && cfg.filterValues[i].parent === selectedItemObject.key) {
            displayItems.push(cfg.filterValues[i].key);
          }

        }

        // check for each filter item whether it should be shown or not
        for (i = 0; i < cfg.filterValues.length; i++) {
          if (displayItems.indexOf(cfg.filterValues[i].key) > -1) {
            $(".filterValue[data-filterid=\"" + cfg.id + "\"][data-filterkey=\"" + cfg.filterValues[i].key + "\"]").removeClass("filterHidden");
          } else {
            $(".filterValue[data-filterid=\"" + cfg.id + "\"][data-filterkey=\"" + cfg.filterValues[i].key + "\"]").addClass("filterHidden");
          }
        }

      }
    }


    function updateSelectedFilters(preventViewBuild) {

      var $body = $("body"),
        filters = [],
        filterItems = $body.data("customConfig").FILTER_ITEMS;

      // get all the filters
      if (filterItems && filterItems.length) {
        for (var i = 0; i < filterItems.length; i++) {
          var filterObj = {
            filter: "FILTER_" + filterItems[i].id,
            selectedValues: []
          };
          var selectedFilters = $("#jbi_filter_" + filterItems[i].id + " .filterActive");
          for (var y = 0; y < selectedFilters.length; y++) {
            filterObj.selectedValues.push($(selectedFilters[y]).data("filterkey"));
          }
          filters.push(filterObj);
        }
      }

      // update the filters
      $body.data("filters", filters);

      if (!preventViewBuild) {
        my._buildView();
      }
    }


    function createHTML(cfg, layout) {
      getTopPaneFilters(cfg);
      getIconFilters(cfg);
    }


    // Handlers for filter toppane
    $('#jbi_filter_toppane .click-nav > ul').toggleClass('no-js js');
    $('#jbi_filter_toppane .click-nav .js ul').hide();

    $('#jbi_filter_toppane .click-nav .js > li').unbind(my.eventTrigger);
    $('#jbi_filter_toppane .click-nav .js > li').on(my.eventTrigger, function (e) {
      e.preventDefault();

      var currentId = $(this)[0].id;
      $('#' + currentId + ' ul').toggle();
      $('#' + currentId + '.clicker').toggleClass('active');
      e.stopPropagation();
    });


    //function getLeftPaneFilters(cfg) {
    //
    //  var s = "";
    //  s += "<div id='jbi_filter_items' class='filterContainer'>";
    //  s += "<ul class='filterList'>";
    //
    //
    //  if (cfg && cfg.length) {
    //    for (var i = 0; i < cfg.length; i++) {
    //
    //      // only valid for left pane filters
    //      if (cfg[i].type !== "LeftPane") {
    //        continue;
    //      }
    //
    //
    //      // get the default selection
    //      var defaultDisplay = cfg[i].textNoSelection;
    //      if (cfg[i].filterValues && cfg[i].filterValues && cfg[i].filterValues.length > 0) {
    //
    //        // check if a value is selected
    //        var selectionFound = false;
    //        for (y = 0; y < cfg[i].filterValues.length; y++) {
    //          if (selectionFound === true) {
    //            cfg[i].filterValues[y].selected = false;
    //          }
    //          if (cfg[i].filterValues[y].selected) {
    //            defaultDisplay = cfg[i].filterValues[y].text;
    //            selectionFound = true;
    //          }
    //        }
    //        if (!selectionFound) {
    //          // get the first enabled filter
    //          for (y = 0; y < cfg[i].filterValues.length; y++) {
    //            if (cfg[i].filterValues[y].enabled) {
    //              defaultDisplay = cfg[i].filterValues[y].text;
    //              cfg[i].filterValues[y].selected = true;
    //              break;
    //            }
    //          }
    //        }
    //      }
    //
    //
    //      // build the HTML
    //      s += "<li id='jbi_filter_" + cfg[i].id + "' class='filterListItemFixed noselect' style='display:none;'>";
    //
    //      if (cfg[i].filterValues && cfg[i].filterValues.length) {
    //        var selectedItemKey = "";
    //
    //        s += "<ul class='filterValueListFixed'>";
    //
    //        // filter items
    //        for (var y = 0; y < cfg[i].filterValues.length; y++) {
    //
    //          var classSelected = "";
    //          if (cfg[i].filterValues[y].selected) {
    //            classSelected = " filterActive";
    //            selectedItemKey = cfg[i].filterValues[y].key;
    //          }
    //
    //          var classDisabled = "";
    //          if (!cfg[i].filterValues[y].enabled) {
    //            classDisabled = " filterDisabled";
    //          }
    //
    //          // skip the values that do not have a selected parent
    //          var classHidden = "";
    //          if (cfg[i].filterValues[y].parent && cfg[i].filterValues[y].parent !== selectedItemKey) {
    //            classHidden = " filterHidden";
    //          }
    //
    //          // check if the item has children
    //          var htmlChildren = "";
    //          for (var z = 0; z < cfg[i].filterValues.length; z++) {
    //            if (cfg[i].filterValues[z].parent && cfg[i].filterValues[z].parent === cfg[i].filterValues[y].key) {
    //              htmlChildren = " <i class=\"fa fa-caret-down\"></i>";
    //              break;
    //            }
    //          }
    //
    //          s += "<li data-filterid='" + cfg[i].id + "' data-filterkey='" + cfg[i].filterValues[y].key + "' data-filtertext='" + cfg[i].filterValues[y].text + "' class='filterValue filterValueListItemFixed" + classSelected + classDisabled + classHidden + "'>";
    //          s += "   <span class='filterValueListItemNameFixed' title='" + cfg[i].filterValues[y].text + "'>" + cfg[i].filterValues[y].text + htmlChildren + "</span>";
    //          s += "</li>";
    //        }
    //
    //        s += "</ul>";
    //      }
    //      s += "</li>";
    //    }
    //  }
    //
    //  s += "</ul>";
    //  s += "</div>";
    //
    //  // set the HMTL
    //  $("#jbi_filter_leftpane").html(s);
    //  $('#jbi_filter_100').jstree();
    //}


    function getTopPaneFilters(cfg) {

      var s = "";
      if (cfg && cfg.length) {
        for (var i = 0; i < cfg.length; i++) {
          if (cfg[i].type !== "TopPane") {
            continue;
          }

          if (cfg[i].filterValues && cfg[i].filterValues.length) {

            // check which item should be selected
            var selectedItemText = "";
            for (y = 0; y < cfg[i].filterValues.length; y++) {
              if (cfg[i].filterValues[y].selected) {
                selectedItemText = cfg[i].filterValues[y].text;
                break;
              }
            }

            // create the HTML part
//@formatter:off
                        s += "<div class='click-nav'>";
                          s += "<ul class='no-js'>";
                            s += "<li id='jbi_filter_" + cfg[i].id + "' class='noselect' style='display:none;width:" + cfg[i].width + "px;'>";
                              s += "<span class='clicker'>" + selectedItemText;
                                s += "<svg style='position:absolute;right:3px;top:9px;' class='filter_click_down_icon' width='12px' height='12px' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'><path d='M1408 704q0 26-19 45l-448 448q-19 19-45 19t-45-19l-448-448q-19-19-19-45t19-45 45-19h896q26 0 45 19t19 45z'/></svg>"
                              s += "</span>";
                              s += "<ul>";
//@formatter:on

            // add the items
            for (var y = 0; y < cfg[i].filterValues.length; y++) {

              var classSelected = "";
              if (cfg[i].filterValues[y].selected) {
                classSelected = " filterActive";
              }

              var classDisabled = "";
              if (!cfg[i].filterValues[y].enabled) {
                classDisabled = " filterDisabled";
              }

//@formatter:off
                            s += "<li data-filterid='" + cfg[i].id + "' data-filterkey='" + cfg[i].filterValues[y].key + "' data-filtertext='" + cfg[i].filterValues[y].text + "' class='filterValue " + classSelected + classDisabled + "' style='width:" + cfg[i].width + "px;'>";
                              s += "<span title='" + cfg[i].filterValues[y].text + "'>" + cfg[i].filterValues[y].text + "</span>";
                            s += "</li>";
//@formatter:on
            }

            // add the remaining HTML part
//@formatter:off
                              s += "</ul>";
                            s += "</li>";
                          s += "</ul>";
                        s += "</div>";
//@formatter:on
          }
        }
      }
      $("#jbi_filter_toppane").html(s);

    }


    function getIconFilters(cfg) {
      var s = "";
      if (cfg && cfg.length) {
        for (var i = 0; i < cfg.length; i++) {
          if (cfg[i].type !== "IconFilter") {
            continue;
          }

          if (cfg[i].filterValues && cfg[i].filterValues.length) {
            s += "<ul id='jbi_filter_" + cfg[i].id + "' class='noselect' style='display:none;'>";
            for (y = 0; y < cfg[i].filterValues.length; y++) {

              // check if the active class need to be set
              var classSelected = "";
              if (cfg[i].filterValues[y].selected) {
                classSelected = " filterActive";
              }
//@formatter:off
                s += "<li data-filterid='" + cfg[i].id + "' data-filterkey='" + cfg[i].filterValues[y].key + "' data-filtertext='" + cfg[i].filterValues[y].text + "' class='filterValue " + classSelected + "'>";
                  s += "<span>" + cfg[i].filterValues[y].icon + "</span>";
                s += "</li>";
              }
//@formatter:on
            s += "</ul>";
          }
        }
      }
      $("#jbi_filter_iconsitems").html(s);

    }

  };


  /**
   * GET FILTERS
   * Not all the filters apply to the selected menu-item. This function
   * retrieves all valid filters and its selected values
   **/
  my._getValidMenuFilters = function (menuId) {
    var menuConfig = $("body").data("customConfig")["MENU_ITEMS"],
      allFilters = $("body").data("filters"),
      filters = [];

    for (var i = 0; i < menuConfig.length; i++) {
      if (menuConfig[i].id === menuId) {
        for (var y = 0; y < menuConfig[i].filters.length; y++) {

          for (var z = 0; z < allFilters.length; z++) {
            if (allFilters[z].filter === menuConfig[i].filters[y]) {
              var obj = {
                filter: allFilters[z].filter,
                selectedValues: allFilters[z].selectedValues
              };
              filters.push(obj);
              break;
            }
          }
        }
        break;
      }
    }
    return filters;
  };


  return my;


}(shell.app.execdb.dashboard));

//####src/execdb/dashboard/mod_freeformat.js
shell.app.execdb.dashboard = ( function (my) {

  /**
   * Free Format component
   *
   * This is a generic function that is used to generate the HTML for a table
   *
   * @param containerDiv   the ID of the HTML div element in which the object
   *                       needs to be rendered
   * @param config         the configuration settings for the grid
   * @param dataId         the ID of the data for the object
   * @param businessData   the data for the selected business
   */
  my._createFreeformat = function (containerDiv, config, dataId, businessData) {
    if (config.Code) {
      eval(config.Code);
    }
  };

  return my;
}(shell.app.execdb.dashboard));

//####src/execdb/dashboard/mod_grid.js
shell.app.execdb.dashboard = (function (my) {

  /**
   * Generates grid
   *
   * This is a generic function that is used to generate the HTML for a table
   *
   * @param containerDiv   the ID of the HTML div element in which the object
   *                       needs to be rendered
   * @param config         the configuration settings for the grid
   * @param dataId         the ID of the data for the object
   * @param businessData   the data for the selected business
   */
  my._createGrid = function (containerDiv, config, dataId, businessData) {
    config = $.extend(true, {}, config);

    addCSS(containerDiv, config);
    addHTML(containerDiv);
    checkGridDivRendered(containerDiv, config, dataId, businessData, 0);

    function checkGridDivRendered(containerDiv, config, dataId, businessData, time) {
      var $containerDiv = $('#' + containerDiv + 'Content');

      if ($containerDiv.outerWidth() === 0 && time < 100) {
        setTimeout(function () {
          checkGridDivRendered(containerDiv, config, dataId, businessData, ++time);
        }, 100);
        return;
      }

      setTimeout(function () {
        createGrid(config, dataId, businessData);
      }, 200);
    }


    /**
     * Add the CSS for the container to the page
     * @param containerDiv  The DIV Id in which the grid needs to be rendered
     * @param config        The configuration object as defined in the MS Excel
     */
    function addCSS(containerDiv, config) {

      if (!config.css) {
        return;
      }
      var s = "";
      s += "<style type='text/css' id='CSS_GRID_" + containerDiv + "' data-group='LAYOUT' data-repstyle='execdb'>";
      for (var i = 0; i < config.css.length; i++) {
        s += "#" + containerDiv + "Content ." + config.css[i].className + "{" + config.css[i].classValue + "}";
      }
      s += "</style>";
      $(s).appendTo("head");
    }


    /**
     * Add a placeholder for the grid
     */
    function addHTML(containerDiv) {
      $("#" + containerDiv + "Content").html("<table class='grid'></table>");
    }


    /**
     * Create the grid
     * @param config
     * @param dataId
     * @param businessData
     */
    function createGrid(config, dataId, businessData) {
      var $grid = $("#" + containerDiv + "Content .grid"),
        $body = $("body"),
        appData = $body.data("customDataApp"),
        periods = appData.periods,
        gridConfig = {};

      // get the configuration for the entire grid
      if (config["Config"]) {
        $.extend(gridConfig, eval("(" + config["Config"] + ")"));
      }

      //START: @MobileDBFix
      //For mobile devices space out the table columns
      if (my.isMobile && (gridConfig.mobileSettings != undefined)) {
        gridConfig.shrinkToFit = (gridConfig.mobileSettings.shrinkToFit != undefined) ? gridConfig.mobileSettings.shrinkToFit : true;
        gridConfig.forceFit = (gridConfig.mobileSettings.forceFit != undefined) ? gridConfig.mobileSettings.forceFit : false;
      }
      //END: @MobileDBFix

      // add the colModel (if provided)
      if (config && config.columns && config.columns.length) {
        gridConfig.colModel = getColModel(config, periods);
      }

      // add the data (if provided)
      if (config && config["GridData"]) {
        gridConfig.data = eval(config["GridData"]);
      } else {
        gridConfig.data = getGridData(dataId, businessData);
      }

      // show no data in case no data is available
      if (!gridConfig.data || !gridConfig.data.length) {
        $body.trigger("showContainerMessage", {
          container: containerDiv,
          message: "No data available.",
          type: "W"
        });
        return;
      }

      $grid.jqGrid(gridConfig);
      //Added to resolve JQGrid column issue in mobile dashboard
      //if (my.isMobile) {
      $grid.jqGrid('setFrozenColumns'); //@MobileDBFix
      //}
      addGroupHeaders($grid, config, periods, dataId, businessData);


      function firstToUpperCase(str) {
        str = str.toLowerCase();
        return str.substr(0, 1).toUpperCase() + str.substr(1);
      }


      /**
       * Generate the colModel based on the configuration
       * @param config    The configuration as defined in the MS Excel
       * @param periods   The periods and its texts
       * @returns {Array} An array holding the column configuration (so called, colModel)
       */
      function getColModel(config, periods) {
        var colModel = [],
          colModelObject,
          currentPeriod = my.period_functions.getCurrentPeriod(),
          i, replaceBy;

        for (i = 0; i < config.columns.length; i++) {
          colModelObject = config.columns[i];

          //START: @MobileDBFix
          //Adjust the table columns to have horizontal scrolling
          if (my.isMobile && config.columns[i].mobileSettings != undefined) {
            var gridMobileConfig = JSON.parse(config.columns[i].mobileSettings);
            if (gridMobileConfig) {
              colModelObject.frozen = (gridMobileConfig.frozen != undefined) ? gridMobileConfig.frozen : false;
              colModelObject.hidden = (gridMobileConfig.hidden != undefined) ? gridMobileConfig.hidden : false;
            }
          }
          //END: @MobileDBFix

          if (config.columns[i].displayPeriods.indexOf(currentPeriod.periodShortName) === -1) {
            colModelObject.hidden = true;
          }

          // convert function strings to actual functions
          for (var property in colModelObject) {
            if (colModelObject.hasOwnProperty(property) && property != "others" && property != "period") {
              if (typeof colModelObject[property] === "string" && /(\s*function\s*\(|^shell\.)/.test(colModelObject[property])) {
                colModelObject[property] = eval("(" + colModelObject[property] + ")")
              }

            }
          }

          // replace the placeholders
          if (colModelObject.label) {
            var placeholders = [
              [/<=CY=>/g, currentPeriod.year],
              [/<=CYShort=>/g, currentPeriod.year.substring(2)],
              [/<=PY=>/g, parseInt(currentPeriod.year) - 1],
              [/<=PYShort=>/g, (parseInt(currentPeriod.year) - 1).toString().substring(2)],
              [/<=CMShort=>/g, firstToUpperCase(currentPeriod.periodShortName)],
              [/<=CM-1Short=>/g, firstToUpperCase(getPreviousMonth())],
              [/<=CQ=>/g, getCurrentQuarter()],
              [/<=CQ-1=>/g, getPreviousQuarter()]
            ];

            placeholders.forEach(function (placeholderTuple) {
              var placeholderRegex = placeholderTuple[0];
              var replacementValue = placeholderTuple[1];

              colModelObject.label = colModelObject.label.replace(placeholderRegex, replacementValue);
            });
          }

          // set the column names of the data columns
          if (colModelObject.period && !colModelObject.label) {
            colModelObject.label = periods[colModelObject.period]
          }

          // add the 'others' configuration to the colModel
          if (config.columns[i].others) {
            $.extend(colModelObject, eval("(" + config.columns[i].others + ")"));
          }

          colModel.push(colModelObject);
        }

        return colModel;
      }


      /**
       * Get the data for the grid
       * Note: very specific format based on the requirements for IG and Upstream (Shell)
       * @param dataId        DataIds (semicolon separated)
       * @param businessData  The data for the selected business
       * @returns {Array}     Array holding the data for the grid.
       */
      function getGridData(dataId, businessData) {
        var gridData = [],
          kpis = dataId.split(";");

        if (businessData && businessData.kpis && dataId) {
          for (var i = 0; i < kpis.length; i++) {
            var kpi = kpis[i];

            // the ++ indicate the children which will be processed later
            if (kpi === "++") {
              alert("Display of children in a grid is not (yet) supported.");
              return [];
            }

            // try to read the dataset
            if (kpi === "EMPTY") {
              gridData.push({});

            } else if (businessData.kpis[kpi] && businessData.kpis[kpi].data && Object.keys(businessData.kpis[kpi].data).length > 1) {
              gridData.push($.extend({
                kpi: kpi
              }, businessData.kpis[kpi].data, true));
            }
          }
        }

        // check if the mandatory parameters are provided
        return gridData;
      }


      /**
       * Add grouping headers to the Grid
       * @param $grid         Reference to the grid object (jQuery)
       * @param config        The configuration object as provided in the MS Excel
       * @param periods       The periods and its texts
       * @param dataId        Data Identifier
       * @param businessData  Business Data
       */
      function addGroupHeaders($grid, config, periods, dataId, businessData) {
        var groupHeaders,
          headerConfig,
          groupHeaderConfig,
          periodId, periodIdPlaceholder, predefinedPlaceholder,
          uniqueRowNumbers = [],
          i, rowNumber, kpiName,
          cqShortName = getCurrentQuarter(),
          prevQuarterName = getPreviousQuarter(),
          currentPeriod = my.period_functions.getCurrentPeriod(),
          dataIds = dataId.split(";");

        kpiName = (dataIds.length && businessData.kpis[dataIds[0]]) ? businessData.kpis[dataIds[0]].text : "";

        if (config.groupHeaders && config.groupHeaders.length) {

          // get the unique rownumbers
          for (i = 0; i < config.groupHeaders.length; i++) {
            if (uniqueRowNumbers.indexOf(config.groupHeaders[i].row) === -1) {
              uniqueRowNumbers.push(config.groupHeaders[i].row);
            }
          }

          for (rowNumber = 0; rowNumber < uniqueRowNumbers.length; rowNumber++) {
            groupHeaders = [];
            groupHeaderConfig = {};

            for (i = 0; i < config.groupHeaders.length; i++) {
              headerConfig = config.groupHeaders[i];

              if (uniqueRowNumbers[rowNumber] !== headerConfig.row) {
                continue;
              }

              // replace texts based on period labels
              for (periodId in periods) {
                if (periods.hasOwnProperty(periodId)) {
                  periodIdPlaceholder = "<%" + periodId + "%>";
                  headerConfig.titleText = headerConfig.titleText.toString().replace(new RegExp(periodIdPlaceholder, "g"), periods[periodId]);
                }
              }

              // replace pre-defined placeholders
              predefinedPlaceholder = "<=CMShort=>";
              headerConfig.titleText = headerConfig.titleText.toString().replace(new RegExp(predefinedPlaceholder, "g"), firstToUpperCase(currentPeriod.periodShortName));

              predefinedPlaceholder = "<=CM-1Short=>";
              headerConfig.titleText = headerConfig.titleText.toString().replace(new RegExp(predefinedPlaceholder, "g"), firstToUpperCase(getPreviousMonth()));

              predefinedPlaceholder = "<=CQShort=>";
              headerConfig.titleText = headerConfig.titleText.toString().replace(new RegExp(predefinedPlaceholder, "g"), cqShortName);

              predefinedPlaceholder = "<=PQ=>";
              headerConfig.titleText = headerConfig.titleText.toString().replace(new RegExp(predefinedPlaceholder, "g"), prevQuarterName);

              predefinedPlaceholder = "<=CY=>";
              headerConfig.titleText = headerConfig.titleText.toString().replace(new RegExp(predefinedPlaceholder, "g"), (currentPeriod.year).toString());

              predefinedPlaceholder = "<=PY=>";
              headerConfig.titleText = headerConfig.titleText.toString().replace(new RegExp(predefinedPlaceholder, "g"), (currentPeriod.year - 1).toString());

              predefinedPlaceholder = "<=KPI=>";
              headerConfig.titleText = headerConfig.titleText.toString().replace(new RegExp(predefinedPlaceholder, "g"), kpiName);

              groupHeaders.push(headerConfig);
            }

            groupHeaderConfig.groupHeaders = groupHeaders;

            if (config["GroupHeaderConfig"]) {
              $.extend(groupHeaderConfig, eval("(" + config["GroupHeaderConfig"] + ")"));
            }

            $grid.jqGrid('setGroupHeaders', groupHeaderConfig);
          }
        }
      }
    }
  };

  function _getCurrentQuarterNumber() {
    var currentMonth = my.period_functions.getCurrentPeriod().periodShortName;

    switch (currentMonth) {
      case "JAN":
      case "FEB":
      case "MAR":
        return 1;

      case "APR":
      case "MAY":
      case "JUN":
        return 2;

      case "JUL":
      case "AUG":
      case "SEP":
        return 3;

      case "OCT":
      case "NOV":
      case "DEC":
        return 4;
    }
  }

  function getCurrentQuarter() {
    return 'Q' + _getCurrentQuarterNumber();
  }

  function getPreviousQuarter() {
    var currentQuarterNumber = _getCurrentQuarterNumber();
    if (currentQuarterNumber === 1) {
      return 'Q' + (currentQuarterNumber - 1 || 4) + "'" + (my.period_functions.getCurrentPeriod().year - 1);
    }
    return 'Q' + (currentQuarterNumber - 1 || 4);
  }


  function getPreviousMonth() {
    var currentMonth = my.period_functions.getCurrentPeriod().periodShortName;
    var months = ["JAN", "FEB", "MAR", "APR", "MAR", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    var currentMonthIndex = months.indexOf(currentMonth);

    // provide the year as well in case the previous month is DEC
    if (currentMonthIndex === 0) {
      return "DEC '" + ((my.period_functions.getCurrentPeriod().year - 1).toString()).substr(2)
    }

    return months[currentMonthIndex - 1];
  }



  /**
   * Some of the dashboards have very specific requirements which cannot be set in the Excel configuration without
   * coding. Instead of having the code in the MS Excel spreadsheet, these functions are described below and can be
   * called from the MS Excel configuration.
   */

  my.grid = my.grid || {};


  /**
   * Allows to configure styles for the last visible column of a groupingHeader
   *
   * Used to draw vertical lines below the grouping headers in order to better display the columns in the grid
   * that belong together.
   * @param config          The configuration of the grid
   * @param groupHeaderRow  The number of the groupHeader for which the last visible columns are found
   * @param cssStyle        The styling object that is set on the td-tags of the column
   */
  my.grid.setClassEndGroupColumn = function (config, groupHeaderRow, cssStyle) {
    var currentPeriod = shell.app.execdb.dashboard.period_functions.getCurrentPeriod().periodShortName;
    var column;

    config.groupHeaders
      .filter(function (item) {
        return item.row === groupHeaderRow;
      })
      .map(function (groupColumn) {
        var startColumnIndex = null;
        var lastColumnIndex = null;
        for (var i = 0; i < config.columns.length; i++) {
          column = config.columns[i];
          if (column.name === groupColumn.startColumnName) {
            startColumnIndex = i;
            break;
          }
        }

        for (
          var j = startColumnIndex; j < startColumnIndex + groupColumn.numberOfColumns; j++
        ) {
          column = config.columns[j];
          if (column.displayPeriods.indexOf(currentPeriod) !== -1) {
            lastColumnIndex = j;
          }
        }

        return lastColumnIndex;
      })
      .filter(function (item) {
        return item !== null;
      })
      .forEach(function (endColumnIndex) {
        $(".grid td:nth-child(" + (endColumnIndex + 1) + ")").css(cssStyle);
      });
  };


  /**
   * Gets the data for the Business Element Hierarchy.
   *
   * The upstream and the integrated gas dashboards requires the table to display the entire sector data
   * including the line of business data and the performance unit data. This function is used to generate
   * the data structure in the right format and uses the business hierarchy nodetype to determine the
   * levels of the hierarchy.
   *
   * @param dataId        The dataId that needs to be displayed
   * @param columnConfig  The configuration of the columns
   * @param appData       The data for all businesses
   * @param businessData  The data for the selected business
   * @returns {Array}   The array holding all data that needs to be displayed in the grid
   */
  my.grid.getBEHierarchyData = function (dataId, columnConfig, appData, businessData, showPUforBusiness) {
    var businessId = (businessData && businessData.nodetype && (businessData.nodetype === "B" || businessData.nodetype === "LOB" || businessData.nodetype === "PU")) ? businessData.id : null;
    var kpis = (dataId) ? dataId.split(";") : [];
    var kpi = kpis[0];
    var gridData = [];
    var flattenedHierarchy;

    showPUforBusiness = showPUforBusiness || false;

    // get a flattened hierarchy
    flattenedHierarchy = flattenBusinessHierarchy(appData, businessId);

    // Add the grid rows
    if (businessData.nodetype === "PU") {
      addGridRows(flattenedHierarchy.pu, "pu", appData, kpi, columnConfig, gridData);
    } else if (businessData.nodetype === "LOB") {
      addGridRows(flattenedHierarchy.pu, "pu", appData, kpi, columnConfig, gridData);
      addGridRows(flattenedHierarchy.total, "total", appData, kpi, columnConfig, gridData);
    } else if (businessData.nodetype === "B") {
      addGridRows(flattenedHierarchy.lob, "lob", appData, kpi, columnConfig, gridData);
      addGridRows(flattenedHierarchy.total, "total", appData, kpi, columnConfig, gridData);
      if (showPUforBusiness) {
        gridData.push({
          type: "empty"
        });
        addGridRows(flattenedHierarchy.pu, "pu", appData, kpi, columnConfig, gridData);
        addGridRows(flattenedHierarchy.total, "total", appData, kpi, columnConfig, gridData);
      }
    } else {
      addGridRows(flattenedHierarchy.lob, "lob", appData, kpi, columnConfig, gridData);
      addGridRows(flattenedHierarchy.total, "total", appData, kpi, columnConfig, gridData);
      gridData.push({
        type: "empty"
      });
      addGridRows(flattenedHierarchy.pu, "pu", appData, kpi, columnConfig, gridData);
      addGridRows(flattenedHierarchy.total, "total", appData, kpi, columnConfig, gridData);
    }

    return gridData;


    /**
     * Flatten the business hierarchy into three arrays
     * @param appData     All application data (not specific for the current business)
     * @param businessId  The identifier of the business that needs to be displayed
     * @returns {{
     *    total: Array,
     *    lob:   Array,
     *    pu:    Array
     * }}
     */
    function flattenBusinessHierarchy(appData, businessId) {
      var i,
        $datasets = $("body").data("customDataApp").datasets,
        flattenedHierarchy = {
          total: [], // node type S
          lob: [], // node type LOB
          pu: [] // node type PU
        };

      // return if no data
      if (!appData.businessHierarchy.length) {
        return flattenedHierarchy;
      }

      function flat(array) {
        var result = [];
        array.forEach(function (a) {
          result.push(a);
          if (Array.isArray(a.children)) {
            result = result.concat(flat(a.children));
          }
        });
        return result;
      }

      var flatHier = flat(appData.businessHierarchy);
      if (!flatHier.length) {
        return flattenedHierarchy;
      }

      // populate a list of LOBs that are related to the 'B'
      var filteredLOBs = [];
      if (businessData.nodetype === "B") {
        for (i = 0; i < flatHier.length; i++) {
          if (flatHier[i].parentNode === businessId) {
            filteredLOBs.push(flatHier[i].id)
          }
        }
      }

      for (i = 0; i < flatHier.length; i++) {
        switch (flatHier[i].nodetype.toUpperCase()) {
          case "S":
            if (businessData.nodetype === "LOB" || businessData.nodetype === "B") {
              continue;
            }

            flattenedHierarchy.total.push({
              rowDataBusinessId: flatHier[i].id,
              col1: {
                id: flatHier[i].id,
                text: "Total " + flatHier[i].text
              },
              col2: {
                id: null,
                text: null
              }
            });
            break;

          case "B":
            if (businessData.nodetype === "LOB") {
              continue;
            }

            if (businessData.nodetype === "B" && flatHier[i].id === businessId) {
              flattenedHierarchy.total.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].id,
                  text: "Total " + flatHier[i].text
                },
                col2: {
                  id: null,
                  text: null
                }
              });
              continue;
            }
            break;


          case "LOB":
            if (businessData.nodetype === "LOB" && flatHier[i].id === businessId) {
              flattenedHierarchy.total.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].id,
                  text: "Total " + flatHier[i].text
                },
                col2: {
                  id: null,
                  text: null
                }
              });
              continue;
            }

            if (!businessId || (businessData.nodetype === "B" && flatHier[i].parentNode === businessId)) {
              flattenedHierarchy.lob.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].id,
                  text: flatHier[i].text
                },
                col2: {
                  id: null,
                  text: null
                }
              });
            }
            break;

          case "PU":
            if (businessData.nodetype === "B" && filteredLOBs.indexOf(flatHier[i].parentNode) > -1) {
              flattenedHierarchy.pu.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].parentNode,
                  text: $datasets[flatHier[i].parentNode].text
                },
                col2: {
                  id: flatHier[i].id,
                  text: flatHier[i].text
                }
              });
            } else if (!businessId || flatHier[i].parentNode === businessId || flatHier[i].id === businessId) {
              flattenedHierarchy.pu.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].parentNode,
                  text: $datasets[flatHier[i].parentNode].text
                },
                col2: {
                  id: flatHier[i].id,
                  text: flatHier[i].text
                }
              });
            }
            break;
        }
      }

      return flattenedHierarchy;
    }

    /**
     * Add a datarow for the grid
     * @param data          Data for the flattened hierararchy (thus either LOB data or PU data or Total data)
     * @param type          Type of row (same: either LOB, PU or Total)
     * @param appData       All application data (not specific for the current business)
     * @param kpiId         The KPI which needs to be displayed in the grid
     * @param columnConfig  The configuration of the columns as provided in the MS Excel
     * @param gridData      An array holding the grid data (needs to be populated in this function)
     */
    function addGridRows(data, type, appData, kpiId, columnConfig, gridData) {
      var i, y,
        gridObj;

      for (i = 0; i < data.length; i++) {
        gridObj = {
          col1: (i == 0 || data[i].col1.text != data[i - 1].col1.text) ? data[i].col1.text : "",
          col2: data[i].col2.text,
          type: type,
          kpi: kpiId
        };

        // add the data from the KPI
        for (y = 0; y < columnConfig.length; y++) {
          if (columnConfig[y].period &&
            appData.datasets[data[i].rowDataBusinessId] &&
            appData.datasets[data[i].rowDataBusinessId].kpis &&
            appData.datasets[data[i].rowDataBusinessId].kpis[kpiId] &&
            appData.datasets[data[i].rowDataBusinessId].kpis[kpiId].data &&
            appData.datasets[data[i].rowDataBusinessId].kpis[kpiId].data[columnConfig[y].period] !== undefined) {
            gridObj[columnConfig[y].period] = appData.datasets[data[i].rowDataBusinessId].kpis[kpiId].data[columnConfig[y].period];
          }
        }
        if (Object.keys(gridObj).length > 3) {
          gridData.push(gridObj);
        }
      }
    }
  };


  /**
   * Calculates the delta of two values and returns a cell formatter that returns the value
   * @param compare1      value for comparison 1
   * @param compare2      value for comparison 2
   * @param numberFormat  the way the value should be displayed
   * @returns {Function}  formatter function
   */
  my.grid.cellCalculateDelta = function (compare1, compare2, numberFormat) {
    numberFormat = numberFormat || "#,##0.";

    return function (cellvalue, options, rowObject) {
      var calculatedDelta = (rowObject[compare1] - rowObject[compare2]);
      if (!isNaN(calculatedDelta)) {
        return my._formatNumber(numberFormat, calculatedDelta);
      }
      return "";
    };
  };


  /**
   * Calculates the delta of two values and returns a cell attribute function that returns attributes for the cell
   * @param compare1      value for comparison 1
   * @param compare2      value for comparison 2
   * @param invertedKpis  kpis that are inverted (low values are green; high values are red)
   * @returns {Function}  formatter function
   */
  my.grid.cellCalculateDeltaClass = function (compare1, compare2, invertedKpis) {
    return function (rowid, val, rawObject, cm, rdata) {

      var calculatedDelta = (rdata[compare1] - rdata[compare2]);
      var positiveNumberClass = ' class="delta_positive"';
      var negativeNumberClass = ' class="delta_negative"';


      // check if we are dealing with an inverted kpis
      var invertedKpisArray = [];
      if (invertedKpis && invertedKpis !== "") {
        invertedKpisArray = invertedKpis.split(";");
      }
      if (invertedKpisArray.length && rawObject.kpi && invertedKpisArray.indexOf(rawObject.kpi) > -1) {
        positiveNumberClass = ' class="delta_negative"';
        negativeNumberClass = ' class="delta_positive"';
      }

      if (!isNaN(calculatedDelta)) {
        return (calculatedDelta >= 0) ? positiveNumberClass : negativeNumberClass;
      }
    };
  };


  /**
   * Sets the class attribute of the table cell
   * @param className     Name of the class that will be added to the cell
   * @returns {Function}  formatter function
   */
  my.grid.cellAddClass = function (className) {
    return function (rowid, val, rawObject, cm, rdata) {
      return ' class="' + className + '"';
    };
  };


  my.grid.cellDeltaClass = function (inverted) {
    return function (rowid, val, rawObject, cm, rdata) {
      var positiveNumberClass = ' class="delta_positive"';
      var negativeNumberClass = ' class="delta_negative"';

      if (inverted) {
        positiveNumberClass = ' class="delta_negative"';
        negativeNumberClass = ' class="delta_positive"';
      }

      if (!isNaN(val)) {
        return (val >= 0) ? positiveNumberClass : negativeNumberClass;
      }
    };
  };



  /**
   * Enables horizontal hover styles
   *
   * The same style as for the horizontal hovering is used
   */
  my.grid.enableVerticalHover = function () {
    $('.grid td, grid th').hover(function () {
      $('.grid td:nth-child(' + ($(this).index() + 1) + ')').addClass('ui-state-hover');
    }, function () {
      $('.grid td:nth-child(' + ($(this).index() + 1) + ')').removeClass('ui-state-hover');
    });
  };


  /**
   * Set the styling to a group header row
   * @param row         row number
   * @param styleObject CSS style object
   */
  my.grid.addGroupHeaderStyle = function (row, styleObject) {
    setTimeout(function () {
      $(".ui-jqgrid-htable tr:nth-child(" + (row + 1) + ") th").css(styleObject)
    }, 1);
  };


  /**
   * Adds a class to each of the cells of a row based on the attribute of a single cell in the row
   * @param cellAttributeName   name of the cell attribute
   * @param cellAttributeValue  value of the cell attribute
   * @param className           className that needs to be added
   */
  my.grid.addClassToRowCellsBasedOnSingleCellAttr = function (cellAttributeName, cellAttributeValue, className) {
    $("[data-rowtype='" + cellAttributeValue + "']").parent().find("td").addClass(className);
  };



  my.grid.getHeatmapData = function (dataId, config, appData, businessData, showPUforBusiness) {
    var businessId = (businessData && businessData.nodetype && (businessData.nodetype === "B" || businessData.nodetype === "LOB" || businessData.nodetype === "PU")) ? businessData.id : null;
    var kpis = (dataId) ? dataId.split(";") : [];
    var gridData = [];
    var flattenedHierarchy;

    showPUforBusiness = showPUforBusiness || false;

    flattenedHierarchy = flattenBusinessHierarchy(appData, businessId);

    // Add the grid rows
    if (businessData.nodetype === "PU") {
      addGridRows(flattenedHierarchy.pu, "pu", appData, kpis, config, gridData);
    } else if (businessData.nodetype === "B") {
      addGridRows(flattenedHierarchy.lob, "lob", appData, kpis, config, gridData);
      addGridRows(flattenedHierarchy.total, "total", appData, kpis, config, gridData);
      if (showPUforBusiness) {
        gridData.push({
          type: "empty"
        });
        addGridRows(flattenedHierarchy.pu, "pu", appData, kpis, config, gridData);
        addGridRows(flattenedHierarchy.total, "total", appData, kpis, config, gridData);
      }
    } else if (businessData.nodetype === "LOB") {
      addGridRows(flattenedHierarchy.pu, "pu", appData, kpis, config, gridData);
      addGridRows(flattenedHierarchy.total, "total", appData, kpis, config, gridData);
    } else {
      addGridRows(flattenedHierarchy.lob, "lob", appData, kpis, config, gridData);
      addGridRows(flattenedHierarchy.total, "total", appData, kpis, config, gridData);
      gridData.push({
        type: "empty"
      });
      addGridRows(flattenedHierarchy.pu, "pu", appData, kpis, config, gridData);
      addGridRows(flattenedHierarchy.total, "total", appData, kpis, config, gridData);
    }

    return gridData;


    /**
     * Flatten the business hierarchy into three arrays
     * @param appData     All application data (not specific for the current business)
     * @param businessId  The identifier of the business that needs to be displayed
     * @returns {{
     *    total: Array,
     *    lob:   Array,
     *    pu:    Array
     * }}
     */
    function flattenBusinessHierarchy(appData, businessId) {
      var i,
        $datasets = $("body").data("customDataApp").datasets,
        flattenedHierarchy = {
          total: [], // node type S
          lob: [], // node type LOB
          pu: [] // node type PU
        };

      // return if no data
      if (!appData.businessHierarchy.length) {
        return flattenedHierarchy;
      }

      function flat(array) {
        var result = [];
        array.forEach(function (a) {
          result.push(a);
          if (Array.isArray(a.children)) {
            result = result.concat(flat(a.children));
          }
        });
        return result;
      }

      var flatHier = flat(appData.businessHierarchy);
      if (!flatHier.length) {
        return flattenedHierarchy;
      }

      // populate a list of LOBs that are related to the 'B'
      var filteredLOBs = [];
      if (businessData.nodetype === "B") {
        for (i = 0; i < flatHier.length; i++) {
          if (flatHier[i].parentNode === businessId) {
            filteredLOBs.push(flatHier[i].id)
          }
        }
      }

      for (i = 0; i < flatHier.length; i++) {
        switch (flatHier[i].nodetype.toUpperCase()) {
          case "S":
            if (businessData.nodetype === "LOB" || businessData.nodetype === "B") {
              continue;
            }

            flattenedHierarchy.total.push({
              rowDataBusinessId: flatHier[i].id,
              col1: {
                id: flatHier[i].id,
                text: "Total " + flatHier[i].text
              },
              col2: {
                id: null,
                text: null
              }
            });
            break;


          case "B":
            if (businessData.nodetype === "LOB") {
              continue;
            }

            if (businessData.nodetype === "B" && flatHier[i].id === businessId) {
              flattenedHierarchy.total.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].id,
                  text: "Total " + flatHier[i].text
                },
                col2: {
                  id: null,
                  text: null
                }
              });
              continue;
            }
            break;



          case "LOB":
            if (businessData.nodetype === "LOB" && flatHier[i].id === businessId) {
              flattenedHierarchy.total.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].id,
                  text: "Total " + flatHier[i].text
                },
                col2: {
                  id: null,
                  text: null
                }
              });
              continue;
            }

            if (!businessId || (businessData.nodetype === "B" && flatHier[i].parentNode === businessId)) {
              flattenedHierarchy.lob.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].id,
                  text: flatHier[i].text
                },
                col2: {
                  id: null,
                  text: null
                }
              });
            }
            break;

          case "PU":
            if (businessData.nodetype === "B" && filteredLOBs.indexOf(flatHier[i].parentNode) > -1) {
              flattenedHierarchy.pu.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].parentNode,
                  text: $datasets[flatHier[i].parentNode].text
                },
                col2: {
                  id: flatHier[i].id,
                  text: flatHier[i].text
                }
              });
            } else if (!businessId || flatHier[i].parentNode === businessId || flatHier[i].id === businessId) {

              flattenedHierarchy.pu.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].parentNode,
                  text: $datasets[flatHier[i].parentNode].text
                },
                col2: {
                  id: flatHier[i].id,
                  text: flatHier[i].text
                }
              });
            }
            break;
        }
      }

      return flattenedHierarchy;
    }

    /**
     * Add a datarow for the grid
     * @param data          Data for the flattened hierararchy (thus either LOB data or PU data or Total data)
     * @param type          Type of row (same: either LOB, PU or Total)
     * @param appData       All application data (not specific for the current business)
     * @param kpis          Array of the kpis that needs to be displayed
     * @param config        The configuration as provided in the MS Excel
     * @param gridData      An array holding the grid data (needs to be populated in this function)
     */
    function addGridRows(data, type, appData, kpis, config, gridData) {
      var i, y,
        gridObj;

      // check if the periods are delivered in the configuration
      if (!config || !config["ComparePeriods"]) {
        return [];
      }
      var periods = config["ComparePeriods"].split(";");
      if (!periods.length || periods.length !== 2) {
        return [];
      }

      // check if the kpis are delivered
      if (!kpis.length) {
        return [];
      }


      for (i = 0; i < data.length; i++) {
        gridObj = {
          col1: (i == 0 || data[i].col1.text != data[i - 1].col1.text) ? data[i].col1.text : "",
          col2: data[i].col2.text,
          type: type
        };

        kpis.forEach(function (kpi) {
          if (appData.datasets[data[i].rowDataBusinessId].kpis[kpi] &&
            appData.datasets[data[i].rowDataBusinessId].kpis[kpi].data) {

            if (appData.datasets[data[i].rowDataBusinessId].kpis[kpi].data[periods[0]] !== undefined) {
              gridObj[kpi + " - VALUE01"] = appData.datasets[data[i].rowDataBusinessId].kpis[kpi].data[periods[0]];
              if (appData.datasets[data[i].rowDataBusinessId].kpis[kpi].data[periods[1]] !== undefined) {
                gridObj[kpi + " - VALUE02"] = gridObj[kpi + " - VALUE01"] - appData.datasets[data[i].rowDataBusinessId].kpis[kpi].data[periods[1]];
              } else {
                gridObj[kpi + " - VALUE02"] = "";
              }
            } else {
              gridObj[kpi + " - VALUE01"] = "";
              gridObj[kpi + " - VALUE02"] = "";
            }
          }
        });

        if (Object.keys(gridObj).length > 3) {
          gridData.push(gridObj);
        }
      }
    }

  };


  return my;
}(shell.app.execdb.dashboard));
//####src/execdb/dashboard/mod_htmlcommentary.js
shell.app.execdb.dashboard = (function (my) {

  /**
   * Generates HTML commentary container
   *
   * This is a generic function that is used to generate the html commentary container
   *
   * @param {string} containerDiv the ID of the HTML div element in which the
   *                              object needs to be rendered
   * @param {object} config       the configuration settings for the bullet chart
   * @param {string} dataId       the ID of the data for the object
   * @param {object} businessData the data for the selected business
   */

  my._createHTMLCommentary = function (containerDiv, config, dataId, businessData) {
    var $body = $('body');
    var isInEditMode = $body.data("comment_edit_mode");

    var commentary = fetchCommentary();

    //var $container = $('#' + containerDiv);
    var $containerContent = $('#' + containerDiv + 'Content');

    addCSS(containerDiv, config);

    if (isInEditMode) renderEditor();
    else renderCommentary();


    /**
     * Generates the CSS for table
     *
     * The CSS settings are provided via the configuration. CSS can be set for an
     * entire table, a table column, a table row or a specific table cell.
     * This function generates a CSS string which will then be added to the header
     * of the document.
     *
     * @param containerDiv   the ID of the HTML div element in which the object
     *                       needs to be rendered
     * @param config         the total configuration object
     */
    function addCSS(containerDiv, config) {
      var $customConfig = $body.data("customConfig");
      var fontFamily = ($customConfig && $customConfig["CONFIG"] && $customConfig["CONFIG"]["dashboard"] && $customConfig["CONFIG"]["dashboard"]["FontFamily"]) || "Verdana";

      // create the CSS string
      var s = "";
      s += "<style type='text/css' id='CSS_HTMLCOMMENTS_" + containerDiv + "' data-group='LAYOUT'  data-repstyle='execdb'>";
      if (config.Height) {
        s += "  #" + containerDiv + " .trumbowyg-editor, #" + containerDiv + " .trumbowyg-box {";
        s += "     min-height: " + config.Height + "px !important;";
        s += "  }";
      }
      s += "  #" + containerDiv + " .trumbowyg-textarea {";
      s += "     min-height: 0 !important;";
      s += "  }";
      s += "  .trumbowyg-box {";
      s += "     margin: 0!important;";
      s += "     font-family: " + fontFamily + ";";
      s += "  }";
      s += "  #" + containerDiv + "Content {";
      s += "     overflow: hidden!important;";
      s += "  }";
      s += "  .trumbowyg-button-pane {";
      s += "     background-color: #F0F0F0;";
      s += "  }";
      s += "</style>";
      $(s).appendTo("head");
    }


    function renderEditor() {
      var editorId = containerDiv + 'Trumbowyg';

      var editorConfigOverrides = JSON.parse(config.EditorConfig || {});
      var editorConfig = jQuery.extend({}, {
        btns: [
          ['viewHTML'],
          ['undo', 'redo'], // Only supported in Blink browsers
          ['formatting'],
          ['fontsize'],
          ['strong', 'em', 'del'],
          ['foreColor', 'backColor'],
          ['superscript', 'subscript'],
          ['link'],
          ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
          ['unorderedList', 'orderedList'],
          ['horizontalRule'],
          ['removeformat'],
          ['fullscreen']
        ],
        btnsDef: {
          saveCommentary: {
            fn: saveCommentary,
            title: 'Save commentary',
            ico: 'upload'
          }
        }
      }, editorConfigOverrides);

      // Add save commentary button as the first button
      editorConfig.btns.unshift(['saveCommentary']);

      $containerContent.html('<div id="' + editorId + '"></div>');
      var $editor = $('#' + editorId);

      $editor.trumbowyg(editorConfig);

      if (commentary !== null) {
        $editor.trumbowyg('html', commentary);
      }

      function saveCommentary() {
        $('body').trigger('htmlCommentSaved', {
          COMMENTARY: $editor.trumbowyg('html'),
          VIEW: getCurrentView(),
          VIEW_SETTING: getViewSetting()
        });
      }
    }

    function renderCommentary() {
      $containerContent.html(commentary);

      var $customConfig = $("body").data("customConfig");
      var fontFamily = ($customConfig && $customConfig["CONFIG"] && $customConfig["CONFIG"]["dashboard"] && $customConfig["CONFIG"]["dashboard"]["FontFamily"])
        ? $customConfig["CONFIG"]["dashboard"]["FontFamily"]
        : "Verdana";

      // CSS Overrides
      $containerContent.css('font-family', fontFamily);
      $containerContent.css('padding-left', '10px');
      $containerContent.css('padding-right', '10px');
    }

    function fetchCommentary() {
      var comments = $('body').data('customDataApp').htmlComments || [];
      var currentView = getCurrentView();

      if (!comments.length) return null;

      var comment = comments.filter(function (comment) {
        return Object.keys(comment.VIEW).every(function (key) {
          return comment.VIEW[key] === currentView[key];
        });
      });

      if (comment.length > 1) {
        console.log('WARNING: more than one comment available for container, first one is used.', currentView);
      }

      return comment.length ? comment[0].COMMENTARY : null;
    }

    function getCurrentView() {
      var $body = $('body');
      var currentViewData = JSON.parse($body.data('currentView'));
      var currentView = {
        m: currentViewData.menuId,
        b: $body.data('currentBusiness'),
        c: config.CommentId
      };

      var activeFilters = currentViewData.filterItems
        .filter(function (filter) {
          return filter.filterValue !== '*';
        })
        .reduce(function (filters, filter) {
          var filterId = filter.filterId.substr('FILTER_'.length);
          filters['f' + filterId] = filter.filterValue;
          return filters;
        }, currentView);

      return currentView;
    }

    function getViewSetting() {
      var currentView = getCurrentView();

      return Object.keys(currentView).sort().map(function (key) {
        var value = currentView[key];
        return key + '=' + value;
      }).join(';');
    }
  };

  return my;
})(shell.app.execdb.dashboard);

//####src/execdb/dashboard/mod_layout.js
shell.app.execdb.dashboard = (function (my) {

    /**
     * Creates the Layout
     *
     * The layout of the report determines the number of containers within a
     * specific view and the positioning of these containers. The number of
     * layouts can easily be extended by adding a new function.
     * Each layout consist of a CSS part and a HTML part. When changing from
     * view, the current CSS and current HTML will be removed and then the
     * new CSS and HTML will be created.
     *
     * @param view   the view configuration that holds information about the
     *               layout that needs to be created
     */
    my._createViewLayout = function (view) {
      // check if a layout is provided
      if (!view.Layout) {
        return;
      }

      // remove CSS belonging to other layouts
      $("[data-group='LAYOUT']").remove();

      // CSS
      var s = "";
      s += "<style type='text/css' id='CSS_FLEX_LAYOUT' data-group='LAYOUT' data-repstyle='execdb'>";
      s += ".layoutContent {";
      s += "  position: relative;";
      s += "  background-color: white;";
      s += "  border: 1px solid lightgrey;";
      s += "  margin-bottom: 10px;";
      s += "}";
      s += ".containers {";
      s += "  margin: 0 !important;";
      s += "}";
      s += ".container {";
      s += "  overflow: auto;";
      s += "  padding: 4px !important;";
      s += "}";
      s += "</style>";
      $(s).appendTo("head");

      var layout = document.createElement('div');
      layout.classList.add('layoutContent');

      var rows = view.Layout.split('_').slice(1);
      for (var containerNo = 1, rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        var containersRow = document.createElement('div');
        containersRow.className += ' containers columns';

        for (var column = 1; column <= rows[rowIndex]; column++) {
          var container = document.createElement('div');
          container.className += ' container column';
          container.id = 'container' + containerNo;
          containersRow.appendChild(container);
          containerNo++;
        }

        layout.appendChild(containersRow);
      }

      // append the HTML to the content div
      $(".layoutContent").remove();
      $("#jbi_content").append(layout);
    };

    return my;

  }(shell.app.execdb.dashboard));

//####src/execdb/dashboard/mod_logo.js
shell.app.execdb.dashboard = ( function (my) {

  /**
   * Handle the periods
   * @private
   */
  my._getLogoBase64 = function () {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABmJLR0QA/wD/AP+gvaeTAAAZgUlEQVR42u1dCZgU1bUe4zMwMIPDOgMzzAKIsoiI7G4oIFHMA1QMhgcuCA/UgPDgRTALmigGFYSACvo0GkMwqBhRkacYSDSizBhjEoQPnJVZmaVn7+5Zbu5/p29TXV1Vfe+taphm+n7f8fPT7prqOqfOPec//zk3Jia6oiu6oiu6oiu6ouscXoSQOCoDqIynMsVE8P8G4rPRJxaZSu7rU+QyKs9T2UvlGyqNRH7hO0epfEBlG5XlVKZS6Rd90u1H4YOpLKHyOyr5Wu01F39DGg/tJLW7HyOuX99LKh6ZRcqWTiLFc0eRwhnDDAX/r2zZJPZZ19ZFpG7Pk8Tzz32ktaFKbxwnqfyeygNUhkQ1ceYUfr7vDd9C5YRf2WXfUmWtJxVrZ5Ki2SNI7ogM8m1/ByUtg+SPG0AN5HJqHDNJ3TvrScupE1qDyKHyHJUbqVwQ1ZTzir/S94DL8LRb3TWk/oNN5NSKKSR/4kBnlS0qqdQoJgwkp1ZNJvX7nqH3VM2NoYLKi1QmUTkvqj11pSdQWUHlCJ5qS00Zqd35E1I8fwzJGZx+dpRuIbin0nvHUU/0BGn11nFjOE5lNZWeUY2KK74PlcepsFeq8bMdpHTJVST7oox2p3QzyR2eTspXTyOebz7khlBLZT1+W1TD5opPpbKZSgNpaSK1bzxKCqYMjhilm20TRbcOIw37t3BDqKeyMZpJBCq+N5XtVLyt9ZWkatPdJHf0gMhWvIHkXzuIVL+ykpAmNwzB7TP27h1Z8d+lspZKXavXTVzPLj4nFR9kCJMG0VjmIQIvR1eVD7M4vyNG9X9nPvH9jSzFOtcVr5eC6waRxk9e4FvDl0AhO4Liu/hy+Oam3CxSdPtlHU7xenyh5N7xFMdAskDgEjZQiT1XlT+OASatLcS17X6SMzSjYytfI3mXp5Pa15EttsIQjlEZeS4p/jzfPuduLj1Kim4bfkYfbvagdJJ7aRrJG53KJOeSNPPPDkgneaPaPpc7Io1kZ5xZvKF0wUjS6srhdYhl54Ly46m8hl/UcPB5+nDD+0DzxvenYEwica3rTurfiCPew51J05edgqTyZz2D9+RrUww/6/k0ll3L9UR3UrowkeRfkxLe3zAxg7i/3Mljg5epdI1U5aezShyNdiufmEWy08Oj/PyrUkjFT3qSxj1dDRVoJFW/7BF0nZM3JAt/v3FfF1L5aA9y8sbksHmt6m3zgX/CCP4JjCTSlI+6ejng26LZl4Upr04h1c9eSJqyOgkrjovryYSg6xX+Zz/p60DgHYrnJLGAzvEtYeEYWmNglcgSKqMiRflXI79tLv2GInkXhUX5J6clKymeS/Wvgw2geHZf5euZeRUnpHDmJaTFlceLTBPbu/LnUPF4jv2ZBlLhy+0R1NlRVs32C4OuWfJfibauWXZ/7/CBR1cPIN68z2EEHiq3t1fl34Fc1vOPdx0N9rAfGv1390exysqqfaVbsAEssGcAhTcFxwPIJHIGpzkTHE7IIN4TH3G8YE57U/4tAHfcWbtJ7jD7ykfAWPyDJFLzQjfS+P9dWFFF/5mabRcqK6v+93FB1ytb0kfdADI7GSq66rEexPtZZ+LanGBoINJGQF8sz5G9jAODZ96eAJ46z9H91DXbUz7ycLjSxg8D326j1Kv8f3spK6zhrWADOPWg+vWQgRj9nsYPugT+XRowFs3oZ2/7uyKdNOV9wkvMY8+28kdScTUXZNFCjj3rLprVl7j3djF8wFCO0eeVFfZeV0cNyvVMdwOX3d8yBgHgpJ76ZpCWsn/BCFxULjtbyk8BEbOl/Dh9Q9VpWUDmXBu7Wz7gutfiDfdXVYUhftBfr/KnPdUDwB8FB4BlD/S2/I7nk1hSOj/JRiY0iLTWFsIIcqkkn2nlx6Kah/r9ye9dol4Rm5LCQJVQDxiInhGE696vFgh6/hJsAEjjnAwAa1/uJpY+UoRRFXIuum0YafVgJ2CV1c5n0gBQtSKli8YpK7/4tr7Ee6iz8ENGUBgUCG5XCwS9X3QOuhbAISUDoHhEzsVpOn5gGvF+Lv7ban8TT3KGqGULp1ZexWHjp86U8n+Iv1b90lJ15VNlInKW2mfXB++z5avU9209NA1wyKkAsOgW+fik/vV4tZSRZkh1bz7EjeDWcCv/YkSf7q/fUSZpAnLFG6i0b6faf9Bc9A9b1Zu4NiUYpn9K+AT1BCrbQc6QdI4RADceEC7lX0DlUIurSJnBg8INqmuqSiuYlOwYIojvBuzZr3RTCwAfCA4AgV0oZxQbEtSeLQ3EW+tY28SnVP4jHAbwMNv3F09Udv2o2tlB204t7+VYIIiav/Y6AIeUAsDpycLpnxBGsTvOEPgSigdWXce3gtVOK78/XD/ar+wxX1KV3L8/HdwR7xgiCG+kvQ7AIScQwLKlvW0ZQMkd6qkhDKfhIBqoSI2jqSG6bFsbXCR/rP0Cj+vJ7rYg19yh6Y4AOAWTA99cgENOBICqWwm73rtdbZeV2VbgRfsB2e2U8meyWiTtmHWmqNFfOgMIeEN+mOQIIqjP3VWKS3oEkKV/NjxcKS1IOfGMXZvn863gZrvKx1CFfM/xAyR7YLpSUcfov9c8r17IgQcJMKiRaoFg0cxATB7gkHQAuLS3Y1mJ++NYw2eskhXASzYXf018HdSxdgyAJZgqrB4ov3prQhtbRg9jTk1Wf1D7g9NBPDzZ6+iBJZU3t/Cmfo6kf2YBLuIUBIWInaTZREsmcC+w3A6hs7z+o2eV+O5IZzh/zsiy634br54OXptiO4cvmZcUYKxKCKAOntZX/4ShaVoX0KOJ2ngCz1DaCKgOPP/YDQNAwaCTctp3cro81g98W/sDy1caVPNm9lN/W1b0sh0Igj2s3bvtVhTtpH8VD/cKSVFreDvOktJuJCULruBeYLHK3l9Z/9Fz0so3qoJ5/9o52IKRsryplnvX/S4+qK5gh8KlAiiB5CFT/TOtS9CagR6UAi+i0aA0DhKsDEYAz+Y5yhBCjM/5rowB3Md8xy1yTRwnp6aYcvFR8g2y0LlqNCxWHdQUT2BcdrwIQCHp7y/rrVT9EyGT4t5MPdd/95GLBRaP415gvqjyv4PJFu4vd8tZG6z2na6Weya49/p9qvH9rkoPTh9cygaCFatPG0D+lSm2AsDsi9Klqn9aQ87VIZK5l6VZwuX4f7lXpEp5Ae+J/cQ3Le07IgYwrQ3yvVIOhlwW2gXW74oPAjrQbaOWDibYCgQrHzn95hVcn2wrAFRN/4xwfx48y2w/IbflB6/lXmCyiAHsanEVSFX7kHcikhWKvu9ODPIcKmkcvqP1UOU/lgsEEaj6t64b5QwAXst2+pcVDEeDICPU75AVnAlZs67SaaGoFAawQ2Rah8e1ZZGUhclE4Z6DsUFwLihVSung9cnKb6H27ZNFE/UlYJXqHwvodNshuoyEv79FzgtUv/Qj3nTaw8oAFuNTBdMultpjZGFUVAX1EKqoBzEN5CQDQe0DZAQVxQBQNf3Tx0OldyZJxw8yxNLC7w/h28ACKwM44Dl6QI6XprD/4eb17k/WhRvx+2VKw+g58D/8+UnKJWCV6p++MQUgkMo2qMdDQgFD3vzDMIAPzZSP8WzNlevnyBUeNqhRqfTtWciFpSNplGOHng7GoFRhLOHV01gCQCGpAFCTgta+1M12HQJAkGpjqhRAt+lO3lnU08gA7pR1/7Aq95/UGT6gh9kNprT18/KHxB8kOHj+t/j+3koBoEr6B/BLG7zmjemvlEJyY0TaKE7HG8q3gbmG0T9m1cjUo5nrOqhe/gRuoK0YApAxA5JMo/mnEpQ6fAGtigAvVp3FKtufvpzNWtwVnx/bSq8WzwZQWUSGF5QN+IYwV9W89pB8gwINZuzUwPWIWtXTcluK+0Cs32hlSsPoQvK74NW9lO63ap0cuaXhj4GEDzv1EGZMd8mzh2rfwGQ+NnP5PH2LF3WF1ygREGRcqFGTRu7wNA2jJUW6919LFhUNphiOwLuCHhHfegpv7qdc/dMWoOD5UOp1ihchDNitmMy3gaFaA3iAVQxsTN7WVwClfsyvAn9M9XNybhE4hCwiiLRT+t41CKAsfMzK4prtzs5LgwBWdeRO/qSLuAEs0hrAb5tLjiuzUblFK9f4MwNBHfD1pKLhnXHy6ST9m7KZjLYELJv+6auPqvR4gE766qEsT6ClisUBL2kN4F+Yv29/3l2qUj7blhsHlnhR8lVJB2UCQcDQzONsTZAOAGXSP2xzWvawah8isgXAxXb1hDI/XV9pp3c2Vz09T+6NN+EI2gkKtTQtWXiWR9dAx4S7g3z5fM2L3aQCQNn0D+mpluYlm+n4f+M9iVK6MMcD7oEBeBlHgP6D0UZKF06QbvKo/HlPYybKvCQ190YHQ+Dh+i1VAhvXYvuiXghZgww9jZeAZQgocPV+sCpV0rNpq5cmzxoQstHMI2u+oL+hdDif7UMKbrhYKp/kDxkNmoZWtk4tKNTSx2QMiUX1vhRL9I3OG9e/zdD+EC8WAPoUKQNYYZ6g3UlkZkEfOBHMm9AtUIYziJZ+fzMp/ccaNmVguLgbKbq1b0hMGkaiYu1a+hh+tEyqVXBdslRez0EUgEIyuIHoPWkLNmY0L5HsQZsmawtY2q3EaIqKaaw2MoMbwCoYwDYMdJTaQwzeAH2FjyGF9I1R+dHaYEsGp+feSPRNA4VNVKH8nmTSP21Lu0orO7YPVBsNt9hM89qGSAtZaz3GDpKtMIA9niP7pQzAjPqlR/Xa5uIny2PdoI9NTfYHOKJ7et2OOKlAkO/pItfnb5hw/g7Cx8T+QjQvs++DM2nEFjYKIvGMzUbqGYnn2EEYwNswgEMNB1+Wmukj8hYG3PTtSdLoHiuapInTzfy9gz53KaJUYPnsYQgop3B6P6nePy3fAC1k0rHQj3sZD7PMDO3RRKThL6+yVnIYwPHat34hPtdHgD9n1AegUvLk0CkjjAi2bvGGD5FAkFcSQ/Yq+krAwr1/ePt9lK2T35PvgkLHs74ohzQ31H3K1Abq/riOnU0AAzhV/fJy8WYDQSp32X19gpBCWeo03mIOoIjOFuDpoEggiAeG4Ew0ABSt/mHSB99rgVLKdgjr5wUBExHZRrVM51BS8+pKVv6BAdS4nlssXviRmKipzw6gTFTEpPLftT19Z/GlCQ2V4tVBkUAQHHsEqqIBoGhqy2MLADeyhTGceSCy5xuWxteJF4hwagtGPcEA3FWb7xGvJi2Xc+X6pkdEtTL8Py19TBRCBVwqwhFEbCH6OVHyJw9EpWlemcEEGTZJTQI1NGq+MTUAeqA2SKIwgNaqp+eLM4Bl05ms4G4WRsLMktwTYTxjxWYL8EAU3iDU5wAGiTCX8GbKNKxUrOmlXNFsI3H2kxqjxzzVVnGmcNUGRgBrgQE0VW28y1bvnwrxA4GiFI9uVl/hyh2ne4UKBBFXMP6BQAAoUv1jLKPUNi8nUw9hNPPUQKKtSj3FaJSeeT3gblYPgAE0yPQBIHBS5a8hftCCETKz+cDFQ8CG7SCk9/Clg6ECQXbsy9QUoQBQJP0DLi/bpYRuKW0xhwV8isU0jLsV3gKeZR0AdTCAagQEqjCwbN2/RDMGBfukzFk/PLMQSvFozhyK7w8iCvL7UPm8SPWPFbIo/B3qegFB359j2bbmd/t0bA3GyyvT6yTg4OoXlsIAKmEABTU71kidzGWHx8ZigsV9NOPPU0Pu1VoWD4ZEixzwBPAlFCKIz4RK7bB1iVT/4N1Y7ULQoPGWa5tDRFM9y/hjdl9xbuDrP4MB5MEAvpYig6Rl2Br2aBQYgmcnGu1y+lioQhNa0ELR1kE9AxgUigMYKv3D3wAMCw8l7M2W6H7/IXvKZ8MvR4tXBOv3sRPN/wYDONh4aKdULQDz+uzerN4IhPsDffQxEcII9vfa/zPfLsDqKbkrMWQJOFT6V/4/vaRoXi5NYyq2DCeUj+1EhtLX+MUuGMDHMIA/NOUclm4HU5mqZRgT8Fk9EkEho4/RtzsUqITUygqChheBEVqVYkNteShfo9m16hdiGAVILrxog4KXSk+k0XYSEGALSFPBVzCAnTCAJ+lRT9LjyBBly7RiWXqChYn+mjlSOCHMn0LSJfOskTYQPVghykIZVoUmBICh0j9E3qCli+ATCBQRw7S9+fYCPm3RjFcdZeh8OMOZridgAKxvOH+MwhTQ1DZo2E5jiN8IfNmBKLEUbhnQsuWEkcxOlgxjBGxWre2Iqq3SPz7fR4T4gs/yap3daJ8/M/QzcGKrFDV8wkBOCFkCA5jeNg/oUvXjS2g0qzoiTQv5chSN7YsCQSH23lC1CWwxCAjNXLxVkQnewyoyB/AiSj7h8Q7iF7tuH9uvnZnCmPvoW9NgAMn4t/I10+2d+EXdikyHTaiYoHRR6IgawRP2aKu2cKBsZoEg0k+AQaaEDIsAkdcoROoDfBAUSsOIGWwdekkxEFt9AUBhf/p9bgBJnBpeqtIXaHYaCCJSJ4xApGMHgaNVcyfuxewtZ2f6/cr4b8CjWaV/mNMjUhdBwAp8AAUqO+mzP9BLta8j4D50FWsbQz5oLvuWFj2GOTMQmhZYhJi2VtsBda1CQWFWW53Ayq3iuHiz70KRZoUVtwWfEYhoKIVicgqCPszzMduGRImhQRPWVM8ipjqGrjEBXmsAo8AOQWQIWDh7kAPHvqb5Zgdl2vAEFM6FuwvlZnEgo9Wxb1YFJLMOH6vvwA2HOuoO3gWsoILJKbb2fHhBJ46fxcvECkBt0f8xKpfrW8Q7U9mE8rD767305gc5YnHsaLi9XdSNgKZ7eINCgSWoLpp9BgUXszkGZs0nVgASgs9QBSkYLzIQVeVj6zI6KU2pIZRG/Y2H34DiW3067mw1J+gGDAjHARGnVkxxZM9B0UeFGOk3AsqHC9UkAjjWzJ1DWWYngph5F7MxtphLFKpjiWEDiPYVwTKklXZOFg1sB59CcL4j4nwqM0SnhWJe0Hvs7JGdaykT2IEtITWDFYGUJmrS72CYQtXj1kbE2sozzUEYs0wiyJiotzC7z1ATPcAHhOtXGp2T1RavqB4kGUi/o+P6f+M/Tm4flUTZgdHnUVkGylhT7t/JyZucCRDZDPy349SMgELQOEbWKlI2e3NlqFVmn4W3sAKpkDlg6KTq4Es9JUx5273+EuI9+ilvAF0WMA1EYWz8MFQMETwgiHDCOpEWqQSIUDAIKVboH3v4WZ3sQ9Qmh1VYdfEAmlZJgbE9Gp0XoBJ4Vzx6Cz0zyM1PCxnr1LlBsb7ggTR8soMOcxroDGZA6+yiXACtywZEaxkUZobHAEyvm9VWeJJ98+HVnMrtcy+lVdr3t3CX/xqVbuE4OxAHSJUjqGABogNGIDPaTesJ2OljYXrTVca+quz5QeNiFaXkzjGkpRJHApBa4bHwNowgESAC+2u7HqX1cps3vyBRGRmzM2TJKUGfpKwXM5pYrrSVUrym+pWV/K3/jErGmTpAmgeIHu/xz+lsgSE2kCn1UWlwobYrkTa3BDvYvtGxs+K5/SDSmLmHUbuprA3LcbEChjCaoUotTW0BosLkKhFe/rkqMhw+bTrNcnuK0wCvoTIl5mwubYAIapnswdKsNy+rYxqAzMx/FugNo2TO3Y9xl/8uxvvHtJeF4AO4UYurhJTcO17qh6keAB3poj83wZJzcfNQ0pT/Nz7sGSe6nR/T3ha9KVBNPmczh6YMFmeo7ozrcMpH7CAOpafz3D6byoSY9rz41LGSu8dKnHWb0OEMQDusWmK6510x7X3Rm+zFKg8PizOMRHv/zyWRGe1WfMcobgDXxETCQs8Zes+E59Yt6tPhDMDovEDTit7KG7gB9I8UAzhSt+cpcZLirL4dzgCMBmqZdvJuZpM9Pe0y8DMxgL0glQjvcQoHN0a6yLB6695+nBV3YiJl0Zt9Xmb2oMrhzRGPAUwWxwDcX71rfthTOzUARjuVqRPYOXomIjEACWo3sBW6tkeSAcxlWMAkCSxgV3zHwQBoDUO0BJw7LJ0HgGsiyQDYOOriOZeLDyzY2nGwALSkiZNqB3MDuCOSDCAVdyzDGcA4uI5iAKCiC2MA80ZzAxgfSQZwPhs+RSdRCQ+fuq/jYAEuiXl+5WtuCmzjiiAjyMUYEuFiB+2cRZtXWIQyb2RP6cC8v3DdD2+CFYLJt7JhTvW2iJ1nyQCkJ4+EU9DDL9LBDC6/jILCLXXvbYABHImJtMVOIis+1m4eZFtEnWbZ8YOjY5xqyHBKMMofPRqRaAC/BJU8e2BGu3qgYC2BWg5lg8qNlAxdQzgHQPUsvrAJO9ihCgawJRINYKHdwyg7uuSePtplZSQawDQ2eWTm8KgyVSev0JPc/Yc7RaABsKOpSu+7OqpMZcr8OG4AoyLRAHAgZWvFY7OjylSUip/P4AbQIyYSF06kqHl1VVSZiuKb5+uKidRFb/5ww8fbo8pUPeP3Q80ZvxFqAG95sw9Flako3m//2na0WwQbwMZWbwPNsa85a4IzkVXye3wH3z2b945nR9czkWwAy0k7WJiPkztavGMJn23MepO0k7Uskg0gnsqAsywLMNagueQ4e6ssR6umtaVegLBhN1QWtYP7j4uJLtuGOJzKAWi1ufQEqX7xQXaEetFtI0jhjGGkeO4ogoOzmnK+4G/dYSojo0/u3DMEEOzfQd+CgatFz92fqPwgYujX0aVsCBdQGUHlerRXU7k66mqjK7qiK7qiK7qiqyOtfwNiZXrmvDVdvAAAAABJRU5ErkJggg==";
  };

  return my;

}(shell.app.execdb.dashboard));
//####src/execdb/dashboard/mod_menu.js
shell.app.execdb.dashboard = ( function (my) {

  /**
   * MENU ITEMS
   * This function is triggered from the Config Handler view component
   **/
  my._buildMenu = function () {

    // get the menu config parameters
    var customData = $("body").data("customConfig"),
      menuItems = customData["MENU_ITEMS"];

    // check if there are menu items defined
    if (!menuItems) {
      return;
    }

    // build the menu and add the event listeners
    buildHTML(menuItems);
    addEventListeners();

    /** HTML **/
    function buildHTML(menuItems) {
      var $customAppFilters = $("body").data("customAppFilters");

      var s = "";
      s += "<nav>";
      s += "    <ul>";
      for (var i = 0; i < menuItems.length; i++) {

        // check if the current displayed hierarchy topnode supports the menu-item
        if (menuItems[i].businesses
          && menuItems[i].businesses.length
          && $customAppFilters
          && $customAppFilters.topNode
          && menuItems[i].businesses.indexOf($customAppFilters.topNode) === -1) {
          continue;
        }

        s += "<li>";
        s += "   <a  data-menuId=\"" + menuItems[i].id + "\">";
        s += "      <i class='fa " + menuItems[i].icon + "'></i>";
        s += "      <span>" + menuItems[i].text + "<\/span>";
        s += "   <\/a>";
        s += "<\/li>";
      }
      s += " <\/ul>";
      s += "<\/nav>";

      $("#jbi_menu").html(s);
    }


    /** EVENT HANDLERS **/
    function addEventListeners() {

      // Menu Click event
      var $menu = $("#jbi_menu a");
      $menu.unbind(my.eventTrigger);
      $menu.on(my.eventTrigger, function (e) {
        e.preventDefault();


        // do nothing if user clicked on an already active menu-id
        if ($(this).hasClass("menuActive")) {
          return;
        }

        $('body').trigger('beforePageRender');

        my._setMenuItem($(this).data("menuid"));
      });

    }


    my._setMenuItem = function (menuId, preventBuildView) {

      // change the classes of the menu item
      $("#jbi_menu a").removeClass("menuActive");
      $("#jbi_menu a[data-menuid=" + menuId + "]").addClass("menuActive");

      // load the business hierarchy
      my._updateBusinessFilter(menuId);

      // set the filters
      var $body = $("body"),
        filterConfig = $body.data("customConfig")["FILTER_ITEMS"],
        menuConfig = $body.data("customConfig")["MENU_ITEMS"],
        filters = [],
        i;

      for (i = 0; i < menuConfig.length; i++) {
        if (menuConfig[i].id === menuId) {
          filters = menuConfig[i].filters;
        }
      }

      // loop over all the filters and check if they need to be shown
      var filterPanelUsed;  // FILTER PANEL NEED TO BE VISIBLE IN ANY CASE BECAUSE OF COMMENT
      filterPanelUsed = true;
      if (filterConfig && filterConfig.length) {
        for (i = 0; i < filterConfig.length; i++) {

          // check if the filter values need to be 're-determined'

          if (filters.indexOf("FILTER_" + filterConfig[i].id) === -1) {
            $("#jbi_filter_" + filterConfig[i].id).hide();
          } else {
            if (filterConfig[i].type === "Type3") {
              filterPanelUsed = true;
            }
            $("#jbi_filter_" + filterConfig[i].id).fadeIn("fast");
          }
        }
      }


      // check if the filterpane needs to be shown
      if (filterPanelUsed) {
        setTimeout(function () {
          $("#jbi_content").css('margin-top', "0");
        }, 50);
      } else {
        var customConfig = $("body").data("customConfig"),
          filterPaneHeight = 40;
        if (customConfig && customConfig.CONFIG && customConfig.CONFIG.filter && customConfig.CONFIG.filter.FilterPaneHeightPixels) {
          filterPaneHeight = customConfig.CONFIG.filter.FilterPaneHeightPixels;
        }
        setTimeout(function () {
          $("#jbi_content").css('margin-top', "-" + ( filterPaneHeight - 8 ) + "px");
        }, 50);
      }


      // load the view
      if (!preventBuildView) {
        my._buildView(menuId);
      }
    }
  };

  return my;


}(shell.app.execdb.dashboard));

//####src/execdb/dashboard/mod_pdf.js
shell.app.execdb.dashboard = ( function (my) {

  my._buildPDF = function () {

    // get the menu config parameters
    var customData = $("body").data("customConfig");
    if (!(_checkPDFEnabled(customData.CONFIG)) || my.isMobile) {
      return;
    }

    _addHTML();
    _addCSS();
    _addEventlisteners();


    /**
     * Check if the PDF functionality is activated
     * @param cfg {object} Application configuration object
     * @returns {boolean} true in case the PDF Export functionality is active
     * @private
     */
    function _checkPDFEnabled(cfg) {
      return ( cfg && cfg.pdf && cfg.pdf.Enabled && cfg.pdf.Enabled === "True");
    }


    /**
     * Add the PDF button to the placeholder
     * @private
     */
    function _addHTML() {
      var s = "";
//@formatter:off
            s += "<div id='jbi_downloadPDFButton' class='jbi_downloadPDFButton'>";
              s += "<ul style='margin:0;padding:0;list-style: none;'>";
                s += "<li>";
                  //s += "<span><svg style=\"width:20px;height:20px;\" width=\"1792\" height=\"1792\" viewBox=\"0 0 1792 1792\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M1344 1344q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm256 0q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm128-224v320q0 40-28 68t-68 28h-1472q-40 0-68-28t-28-68v-320q0-40 28-68t68-28h465l135 136q58 56 136 56t136-56l136-136h464q40 0 68 28t28 68zm-325-569q17 41-14 70l-448 448q-18 19-45 19t-45-19l-448-448q-31-29-14-70 17-39 59-39h256v-448q0-26 19-45t45-19h256q26 0 45 19t19 45v448h256q42 0 59 39z\" fill=\"#CC0000\"/></svg></span>";
                  s += "<span title='Print'><svg style=\"width:20px;height:20px;\" width=\"1792\" height=\"1792\" viewBox=\"0 0 1792 1792\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M448 1536h896v-256h-896v256zm0-640h896v-384h-160q-40 0-68-28t-28-68v-160h-640v640zm1152 64q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm128 0v416q0 13-9.5 22.5t-22.5 9.5h-224v160q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-160h-224q-13 0-22.5-9.5t-9.5-22.5v-416q0-79 56.5-135.5t135.5-56.5h64v-544q0-40 28-68t68-28h672q40 0 88 20t76 48l152 152q28 28 48 76t20 88v256h64q79 0 135.5 56.5t56.5 135.5z\" fill=\"#CC0000\"/></svg></span>";
                  s += "<ul id='jbi_downloadOptions' style='display:none;'>";
                  s += "</ul>";
                s += "</li>";
              s += "</ul>";
            s += "</div>";
//@formatter:on

      $("#jbi_pdf").html(s);
    }


    /**
     * Add the event listener for the PDF button
     * @private
     */
    function _addCSS() {
      var cfg = $("body").data("customConfig");

      var s = "";
      s += "<style type='text/css' id='CSS_PDF' data-repstyle='execdb'>";
      s += ".jbi_downloadPDFButton{";
      s += " cursor: pointer;";
      s += " padding: 0 4px 0 4px;";
      s += " display:inline-block;";
      s += "}";
      s += "#jbi_downloadOptions{";
      s += " position: absolute;";
      s += " padding: 0;";
      s += " margin: 0;";
      s += " z-index: 9999999;";
      s += " right: -1px;";
      s += " list-style: none;";
      s += " background: white;";
      s += " line-height: 40px;";
      s += " border-style: solid;";
      s += " border-color: lightgrey;";
      s += " border-width: 2px;";
      s += " min-width: 130px;";
      s += "}";
      s += "#jbi_downloadOptions li{";
      s += " border-bottom: 1px solid #EEEEEE;";
      s += "}";
      if (!my.isMobile) {
        s += "#jbi_downloadOptions > :not(:first-child):hover{";
        s += " background: #EEEEEE;";
        s += " color: #4A4A4A;";
        s += "}";
      }
      s += "#jbi_downloadOptions > :first-child {";
      s += "background-color: " + cfg.CONFIG.pdf.ListTitleBackgroundColor + ";";
      s += "color: " + cfg.CONFIG.pdf.ListTitleFontColor + ";";
      s += "font-size: 11px;";
      s += "font-family: Verdana;";
      s += "text-align: center;";
      s += "font-weight: bold;";
      s += "line-height: 23px;";
      s += "cursor: default;";
      s += "}";
      s += "#jbi_downloadOptions li span{";
      s += " display: inline-block;";
      s += " line-height: 20px;";
      s += " padding: 5px;";
      s += " color: #4A4A4A;";
      s += " font-family: Verdana;";
      s += " font-size: 12px;";
      s += "}";

      s += "</style>";
      $(s).appendTo("head");
    }


    function createPDFOptions() {

      var $body = $("body"),
        cfg = $body.data("customConfig"),
        cfgView = JSON.parse($body.data("currentView")),
        i, j, y, z, a;

      // current menu item
      var currentMenuItem = null;
      for (i = 0; i < cfg["MENU_ITEMS"].length; i++) {
        if (cfg["MENU_ITEMS"][i].id === cfgView.menuId) {
          currentMenuItem = cfg["MENU_ITEMS"][i];
          break;
        }
      }

      // get all available icons
      var allIcons = [],
        iconNames  = [];
      for (i=0; i< cfg["FILTER_ITEMS"].length; i++) {
        var filterItem = cfg["FILTER_ITEMS"][i];
        if (filterItem.type === "IconFilter") {
          for (y = 0; y<filterItem.filterValues.length; y++) {
            if (iconNames.indexOf(filterItem.filterValues[y].key) === -1 ){
              iconNames.push(filterItem.filterValues[y].key);
              allIcons.push(filterItem.filterValues[y].icon);
            }
          }
        }
      }


      // current container types
      var availableIcons = [],
        availableFilters = [],
        currentIcon = null;
      for (i = 0; i < currentMenuItem.filters.length; i++) {
        var filterId = currentMenuItem.filters[i].substring(7);
        for (y = 0; y < cfg["FILTER_ITEMS"].length; y++) {
          if (cfg["FILTER_ITEMS"][y].id === filterId) {

            // available icons current menu item;
            if (cfg["FILTER_ITEMS"][y].type === "IconFilter") {
              for (z = 0; z < cfg["FILTER_ITEMS"][y].filterValues.length; z++) {
                availableIcons.push(cfg["FILTER_ITEMS"][y].filterValues[z].icon)
              }

              // current selected icon
              for (z = 0; z < cfgView.filterItems.length; z++) {
                if (cfgView.filterItems[z].filterId === currentMenuItem.filters[i]) {
                  for (j = 0; j < cfg["FILTER_ITEMS"][y].filterValues.length; j++) {
                    if (cfg["FILTER_ITEMS"][y].filterValues[j].key === cfgView.filterItems[z].filterValue) {
                      currentIcon = cfg["FILTER_ITEMS"][y].filterValues[j].icon;
                      break;
                    }
                  }
                  break;
                }
              }
            } else {

              // current selected filter value
              var currentFilterValue = null;
              for (z = 0; z < cfgView.filterItems.length; z++) {
                if (cfgView.filterItems[z].filterId === currentMenuItem.filters[i]) {

                  // find the text for the current filter value
                  for (a = 0; a < cfg["FILTER_ITEMS"][y].filterValues.length; a++) {
                    if (cfg["FILTER_ITEMS"][y].filterValues[a].key === cfgView.filterItems[z].filterValue) {
                      currentFilterValue = cfg["FILTER_ITEMS"][y].filterValues[a].text.trim();
                      break;
                    }
                  }
                }
              }

              // all other filters are not icon filters
              availableFilters.push({
                name: cfg["FILTER_ITEMS"][y].name,
                textNoSelection: cfg["FILTER_ITEMS"][y].textNoSelection || "No filter on " + cfg["FILTER_ITEMS"][y].name,
                currentSelection: currentFilterValue
              });
            }
          }
        }
      }


      // create the HTML for each of the options
      var htmlString = "";

      // businesses
      var htmlPartialAllBusinesses = "<br>All businesses";
      var htmlPartialCurrentBusiness = "<br>" + $('#jbi_businesses').jstree().get_selected(true)[0].text;

      // filters
      var htmlPartialAllFilters = "";
      var htmlPartialCurrentFilters = "";
      for (i = 0; i < availableFilters.length; i++) {
        htmlPartialCurrentFilters += "<br>" + availableFilters[i].currentSelection;
      }
      if (availableFilters.length) {
        htmlPartialAllFilters = "<br>All Filters";
      }

      // icons
      var htmlPartialCurrentMenuAllIcons = "";
      var htmlPartialAllIcons = "";
      var htmlPartialCurrentIcon = currentIcon.toLowerCase();
      for (i = 0; i < availableIcons.length; i++) {
        if (i > 0) {
          htmlPartialCurrentMenuAllIcons += " / ";
        }
        htmlPartialCurrentMenuAllIcons += availableIcons[i];
      }
      for (i = 0; i < allIcons.length; i++) {
        if (i > 0) {
          htmlPartialAllIcons += " / ";
        }
        htmlPartialAllIcons += allIcons[i];
      }

      htmlString += "<li>PRINT TO PDF</li>";
      htmlString += "<li data-menus='current' data-icons='current' data-business='current' data-filters='current'><span>" + currentMenuItem.text + htmlPartialCurrentBusiness + htmlPartialCurrentFilters + "<br>" + htmlPartialCurrentIcon + "</span></li>";
      htmlString += "<li data-menus='current' data-icons='all' data-business='current' data-filters='current'><span>" + currentMenuItem.text + htmlPartialCurrentBusiness + htmlPartialCurrentFilters + "<br>" + htmlPartialCurrentMenuAllIcons + "</span></li>";
      htmlString += "<li data-menus='all' data-icons='current' data-business='current' data-filters='all'><span>" + 'All Menu Items' + htmlPartialCurrentBusiness + "<br>" + htmlPartialCurrentIcon + "</span></li>";
      htmlString += "<li data-menus='all' data-icons='all' data-business='current' data-filters='all'><span>" + 'All Menu Items' + htmlPartialCurrentBusiness + "<br>" + htmlPartialAllIcons + "</span></li>";
      htmlString += "<li data-menus='current' data-icons='current' data-business='all' data-filters='all'><span>" + currentMenuItem.text + htmlPartialAllBusinesses + htmlPartialAllFilters + "<br>" + htmlPartialCurrentIcon + "</span></li>";
      htmlString += "<li data-menus='current' data-icons='all' data-business='all' data-filters='all'><span>" + currentMenuItem.text + htmlPartialAllBusinesses + htmlPartialAllFilters + "<br>" + htmlPartialCurrentMenuAllIcons + "</span></li>";

      var $jbi_downloadOptions = $("#jbi_downloadOptions");
      $jbi_downloadOptions.empty();
      $jbi_downloadOptions.append(htmlString);


      // add an event listener for the options
      var $jbi_downloadOptionsNotFirst = $("#jbi_downloadOptions > :not(:first-child)");
      $jbi_downloadOptionsNotFirst.unbind(my.eventTrigger);
      $jbi_downloadOptionsNotFirst.on(my.eventTrigger, function () {
        _createPDF({
          menuId: $(this).data("menus") === "all" ? "all" : cfgView.menuId,
          businessId: $(this).data("business") === "all" ? "all" : $('#jbi_businesses').jstree('get_selected')[0],
          icons: $(this).data("icons"),
          filters: $(this).data("filters")
        });
      });
    }


    /**
     * Add the event listener for the PDF button
     * @private
     */
    function _addEventlisteners() {
      var $jbi_downloadPDFButton = $("#jbi_downloadPDFButton");
      $jbi_downloadPDFButton.unbind(my.eventTrigger);
      $jbi_downloadPDFButton.on(my.eventTrigger, function () {
        createPDFOptions();
        $('#jbi_downloadOptions').toggle();
      });
    }


    /**
     * Generate the PDF
     * @private
     */
    function _createPDF(selection) {
      var $body = $("body"),
        cfg = $body.data("customConfig"),
        cfgView = JSON.parse($body.data("currentView")),
        pdfSettings = _getPDFSettings();


      // get the pages that need to be PDF'd based on the selection
      var businessReports = _getBusinessReports(selection);
      if (!businessReports || !businessReports.length) {
        alert("Something went wrong during the PDF printing.");
        return;
      }


      // setup a new PDF document
      var doc = _initializePDF();

      // create a cover page and an index page
      createCoverPage();


      // add the pages
      _addPages(businessReports).then(
        function () {
          _saveDocument();
        }
      );


      function _getPDFSettings() {
        var pdfSettingsLandscape = {
            imageQuality: 0.9,
            orientation: "landscape",     // portrait / landscape
            unit: "mm",                  // pt / mm / cm / in
            format: "a4",                // a3 / a4 / a5 / letter / legal
            structure: {
              pageSize: [290, 210],
              header: [12.5, 12.5, 271.2, 8],
              pageComments: [12.5, 20.8, 271.2, 15],
              contents: [12.5, 36.5, 271.2, 161],
              footer: [12.5, 198.5, 271.2, 8]
            }
          },
          pdfSettingsPortrait = {
            imageQuality: 0.9,
            orientation: "portrait",
            unit: "mm",                  // pt / mm / cm / in
            format: "a4",                // a3 / a4 / a5 / letter / legal
            structure: {
              pageSize: [210, 290],
              header: [25.4, 10, 159.2, 8],
              pageComments: [25.4, 20.6, 159.2, 15],
              contents: [25.4, 37, 159.2, 240.2],
              footer: [25.4, 280, 159.2, 8]
            }
          };

        return (cfg["CONFIG"].pdf["Orientation"] && cfg["CONFIG"].pdf["Orientation"].toUpperCase() === "PORTRAIT")
          ? pdfSettingsPortrait
          : pdfSettingsLandscape;
      }


      function _initializePDF() {
        return new jsPDF(
          pdfSettings.orientation,
          pdfSettings.unit,
          pdfSettings.format
        );
      }


      function createCoverPage() {
        var base64Logo = shell.app.execdb.dashboard._getLogoBase64();
        doc.addImage(
          base64Logo,
          'png',
          pdfSettings.structure.header[0],
          pdfSettings.structure.header[1] - 2.5,
          12,
          12
        );


        // add the title of the project
        doc.setTextColor("#dd1d21");
        doc.setFontSize(15);
        doc.setFontType("bold");
        doc.textEx(
          "EXECUTIVE REPORTING",
          pdfSettings.structure.pageSize[0] - 10,
          (pdfSettings.structure.pageSize[1] / 4 * 3) - 18,
          'right'
        );

        // report title
        doc.setFontSize(11);
        doc.textEx(
          cfg.CONFIG.header.Title.toUpperCase(),
          pdfSettings.structure.pageSize[0] - 10,
          (pdfSettings.structure.pageSize[1] / 4 * 3) - 10,
          'right'
        );

        // report version
        var currentPeriod = shell.app.execdb.dashboard.period_functions.getCurrentPeriod();
        var period;
        if (currentPeriod) {
          period = currentPeriod.periodFullName + " " + currentPeriod.year;

          // check if there is a version
          var version = $("body").data("currentVersion");
          if (!version || version === '') {
            version = "UNPUBLISHED";
          }
          doc.textEx(
            period.toUpperCase() + " / " + version.toUpperCase(),
            pdfSettings.structure.pageSize[0] - 10,
            (pdfSettings.structure.pageSize[1] / 4 * 3) - 4,
            'right'
          );
        }

        // KPIs
        var kpiText = "All Key Performance Indicators";
        if (selection.menuId !== 'all') {
          kpiText = getMenuText(selection.menuId);

          // add the filters if required
          if (selection.filters !== "all") {
            var filterText = getCurrentFilterText(selection.menuId);
            if (filterText && filterText !== "") {
              kpiText += " / " + filterText;
            }
          }


        }
        doc.textEx(
          kpiText.toUpperCase(),
          pdfSettings.structure.pageSize[0] - 10,
          (pdfSettings.structure.pageSize[1] / 4 * 3) + 2,
          'right'
        );

        // Businesses
        var businessText = "All Businesses";
        if (selection.businessId !== 'all') {
          businessText = getBusinessText(selection.businessId);
        }
        doc.textEx(
          businessText.toUpperCase(),
          pdfSettings.structure.pageSize[0] - 10,
          (pdfSettings.structure.pageSize[1] / 4 * 3) + 8,
          'right'
        );


        // Most confidential
        doc.textEx(
          "MOST CONFIDENTIAL",
          pdfSettings.structure.pageSize[0] - 10,
          (pdfSettings.structure.pageSize[1] / 4 * 3) + 20,
          'right'
        );


        // add a line between the project title and the report title
        doc.setDrawColor(221, 29, 33);
        doc.setLineWidth(0.5);
        doc.line(
          pdfSettings.structure.pageSize[0] - 73,           // left
          (pdfSettings.structure.pageSize[1] / 4 * 3) - 17, // top
          pdfSettings.structure.pageSize[0] - 10,           // right
          (pdfSettings.structure.pageSize[1] / 4 * 3) - 17  // bottom
        );

      }


      function getMenuText(menuId) {
        var $customConfig = $("body").data("customConfig");
        var menuItems = $customConfig["MENU_ITEMS"];

        for (var i=0; i<menuItems.length; i++) {
          if (menuItems[i].id === menuId) {
            return menuItems[i].text;
          }
        }
        return menuId;
      }


      function getBusinessText(businessId) {
        var $customDataApp = $("body").data("customDataApp");
        if ($customDataApp && $customDataApp.datasets && $customDataApp.datasets[businessId]) {
          return $customDataApp.datasets[businessId].text;
        }
        return businessId;
      }


      function getCurrentFilterText(menuId) {
        var cfg = $("body").data("customConfig"),
          $menuItems = cfg["MENU_ITEMS"],
          $filterItems = cfg["FILTER_ITEMS"],
          cfgView = JSON.parse($body.data("currentView")),
          currentMenuItem,
          currentFilters = [],
          i, y, z, a;

        // get the current menu item
        for (i=0; i<$menuItems.length; i++) {
          if ($menuItems[i].id === menuId) {
            currentMenuItem = $menuItems[i];
            break;
          }
        }

        // get the valid filters for the menu item
        for (i = 0; i < currentMenuItem.filters.length; i++) {
          var filterId = currentMenuItem.filters[i].substring(7);
          for (y = 0; y < cfg["FILTER_ITEMS"].length; y++) {
            if ($filterItems[y].id === filterId) {
              if ($filterItems[y].type !== "IconFilter") {
                var currentFilterValue = null;
                for (z = 0; z < cfgView.filterItems.length; z++) {
                  if (cfgView.filterItems[z].filterId === currentMenuItem.filters[i]) {
                    for (a = 0; a < $filterItems[y].filterValues.length; a++) {
                      if ($filterItems[y].filterValues[a].key === cfgView.filterItems[z].filterValue) {
                        currentFilters.push($filterItems[y].filterValues[a].text.trim());
                        break;
                      }
                    }
                  }
                }
              }
            }
          }
        }

        return currentFilters.join(" / ");
      }



      function _getBusinessReports(selection) {
        var i, y, z,
         businessReports = [],
         menusWithFilters = getMenusWithFilters(selection.menuId, selection),
         businesses = getBusinesses(selection.businessId),
         availableViews = $("body").data("customConfig")["VIEWS"];

        for (i=0; i<businesses.length; i++) {
          var businessView = {
            business: businesses[i],
            viewIndices: []
          };

          for (y=0; y<menusWithFilters.length; y++) {
            for (z=0; z<menusWithFilters[y].filterCombinations.length; z++) {
              var viewSetting = shell.app.execdb.dashboard._getViewConfigIdBasedOnFilters(
                menusWithFilters[y].id,
                menusWithFilters[y].filterCombinations[z],
                availableViews,
                businesses[i]
              );
              businessView.viewIndices.push(viewSetting.id);
            }
          }
          businessReports.push(businessView);
        }

        return businessReports;


        function getMenusWithFilters(menuId, selection) {
          var menuItems = cfg["MENU_ITEMS"],
            menuItem;

          var menuIds = [];
          for (var i = 0; i < menuItems.length; i++) {

            // check if the menuItem is available for the selected business
            if (selection.businessId !== "all"
              && menuItems[i].businesses
              && menuItems[i].businesses.length
              && menuItems[i].businesses.indexOf(selection.businessId) === -1) {
              continue;
            }

            menuItem = menuItems[i];
            if (menuItem.id === menuId || menuId === 'all') {

              menuIds.push({
                id: menuItem.id,
                filterCombinations: getFiltersCombinationsForMenu(menuItem.filters, selection)
              });
            }
          }
          return menuIds;
        }

        function getFiltersCombinationsForMenu(filterIds, selection) {
          var filterItems = cfg["FILTER_ITEMS"],
            currentFilters = $("body").data("filters"),
            availableFilters = [],
            i, y, z;

          // get the icon filter
          for (i = 0; i < filterIds.length; i++) {
            for (y = 0; y < filterItems.length; y++) {
              if (filterIds[i] === "FILTER_" + filterItems[y].id) {
                var filterItem = {
                  filter: filterIds[i],
                  filterValues: [],
                  type: filterItems[y].type
                };

                if (filterItems[y].type === "IconFilter" && selection.icons === "current") {

                  // get the current selection
                  for (z=0; z<currentFilters.length; z++) {
                    if (currentFilters[z].filter === filterIds[i]) {
                      filterItem.filterValues.push(currentFilters[z].selectedValues[0]);
                      break;
                    }
                  }
                } else {
                  for (z = 0; z < filterItems[y].filterValues.length; z++) {
                    filterItem.filterValues.push(filterItems[y].filterValues[z].key);
                  }
                }

                availableFilters.push(filterItem);
              }
            }
          }

          // generate all unique combinations of the filters
          var filterCombo = [];
          for (i=0; i<availableFilters.length; i++) {
            var filterKeys = [];
            for (y=0; y<availableFilters[i].filterValues.length; y++) {
              filterKeys.push(availableFilters[i].filterValues[y]);
            }
            filterCombo.push(filterKeys);
          }
          var filterValueCombinations = cartesian(filterCombo);


          function cartesian(arguments) {
            var r = [], arg = arguments, max = arg.length-1;
            function helper(arr, i) {
              for (var j=0, l=arg[i].length; j<l; j++) {
                var a = arr.slice(0); // clone arr
                a.push(arg[i][j]);
                if (i==max)
                  r.push(a);
                else
                  helper(a, i+1);
              }
            }
            helper([], 0);
            return r;
          }

          // create the different menu with filter selection options
          var filterCombinations = [];
          for (i=0; i<filterValueCombinations.length; i++) {
            var filters = [];
            for (y=0; y<availableFilters.length; y++) {
              var filter = {
                filter: availableFilters[y].filter,
                selectedValues : [filterValueCombinations[i][y]]
              };
              filters.push(filter);
            }
            filterCombinations.push(filters);
          }
          return filterCombinations;
        }


        function getBusinesses(businessId) {
          var $jbiBusinesses = $('#jbi_businesses');
          var businessToPrint = [$jbiBusinesses.jstree().get_selected(true)[0].id];
          if (businessId === "all") {
            var childNodes = $jbiBusinesses.jstree()._model.data[businessToPrint[0]].children;

            // only visible nodes may be printed
            for (i = 0; i < childNodes.length; i++) {
              var childNode = $jbiBusinesses.jstree()._model.data[childNodes[i]];
              if (childNode.state && !childNode.state.hidden) {
                businessToPrint.push(childNode.id);
              }
            }
          }
          return businessToPrint;
        }
      }


      function addPDFStyles() {
        var s = "";
        s += "<style type='text/css' id='CSS_PDF_TEMP' data-repstyle='execdb'>";
        s += ".zoomButton{";
        s += " display: none !important;";
        s += "}";
        s += "</style>";
        $(s).appendTo("head");
      }

      function deletePDFStyles() {
        $("#CSS_PDF_TEMP").remove();
      }

      function _addPages(businessReports) {
        var deferred = $.Deferred();
        var originalConfig = JSON.parse($("body").data("currentView"));
        var originalBusiness = $('#jbi_businesses').jstree('get_selected')[0];
        var pageNumber = 1;
        var $jbiPdf = $("#jbi_pdf");

        // switch off highcharts animations
        Highcharts.setOptions({
          plotOptions: {
            series: {
              animation: false
            }
          }
        });

        // add specific pdf styles
        addPDFStyles();

        $jbiPdf.unbind("showNextFilter");
        $jbiPdf.on("showNextFilter", function (evt, prop) {
          if (prop.nextIndex < prop.viewIndices.length) {
            cfgView = cfg["VIEWS"][prop.viewIndices[prop.nextIndex]];

            my._setView(cfgView, businessReports[prop.currentBusinessIndex].business);

            setTimeout(function () {
              $.when(
                _addNewPage(pageNumber),
                _addPageHeader(pageNumber),
                _addCommentaryImageToPDF(),
                _addContentImageToPDF(),
                _addPageFooter()
              ).then(
                function () {
                  pageNumber += 1;
                  $("#jbi_pdf").trigger("showNextFilter", {
                    nextIndex: prop.nextIndex + 1,
                    currentBusinessIndex: prop.currentBusinessIndex,
                    viewIndices: businessReports[prop.currentBusinessIndex].viewIndices
                  });
                }
              )
            }, 1000);

          } else {
            $("#jbi_pdf").trigger("showNextBusiness", {
              nextIndex: prop.currentBusinessIndex + 1
            });
          }
        });


        $jbiPdf.unbind("showNextBusiness");
        $jbiPdf.on("showNextBusiness", function (evt, prop) {
          if (prop.nextIndex < businessReports.length) {

            // select the next business
            if (businessReports.length > 1) {
              var $jbiBusinesses = $('#jbi_businesses');
              $jbiBusinesses.jstree().deselect_all();
              $jbiBusinesses.jstree().select_node(businessReports[prop.nextIndex].business);
            }

            // loop over the filters
            $("#jbi_pdf").trigger("showNextFilter", {
              nextIndex: 0,
              currentBusinessIndex: prop.nextIndex,
              viewIndices: businessReports[prop.nextIndex].viewIndices
            });


          } else {

            // printing done, reset everything to original state
            Highcharts.setOptions({
              plotOptions: {
                series: {
                  animation: true
                }
              }
            });

            var $jsTree = $('#jbi_businesses').jstree();
            $jsTree.deselect_all();
            $jsTree.select_node(originalBusiness);

            my._setView(originalConfig, originalBusiness);
            deletePDFStyles();
            deferred.resolve();
          }
        });


        $jbiPdf.trigger("showNextBusiness", {nextIndex: 0});

        return deferred.promise();
      }


      function _addNewPage(pageNumber) {
        var deferred = $.Deferred();

        if (pageNumber > 0) {
          doc.addPage();
        }

        deferred.resolve();
        return deferred.promise();
      }


      function _addDocumentProperties() {
        var deferred = $.Deferred();

        // add the title of the selected menu
        var menuTitle = "";
        for (var i = 0; i < cfg.MENU_ITEMS.length; i++) {
          if (cfg.MENU_ITEMS[i].id === cfgView.menuId) {
            menuTitle = cfg.MENU_ITEMS[i].text;
            break;
          }
        }

        // get the period
        var period = "";
        if (cfg && cfg.CONFIG && cfg.CONFIG.period && cfg.CONFIG.period.long) {
          period = cfg.CONFIG.period.long;
        }

        doc.setProperties({
          title: "SHELL - GROUP MI - " + cfg.CONFIG.header.Title,
          subject: menuTitle + " " + period,
          author: "Shell Group MI",
          keywords: 'shell, group mi, report, ' + menuTitle + ', ' + cfg.CONFIG.header.Title,
          creator: 'Generated from a Group MI report'
        });

        deferred.resolve();
        return deferred.promise();
      }

      /**
       * Adds the page header to the PDF document
       * @returns {object} promise
       * @private
       */
      function _addPageHeader(pageNumber) {
        var deferred = $.Deferred();

        // add the logo
        var base64Logo = shell.app.execdb.dashboard._getLogoBase64();
        doc.addImage(
          base64Logo,
          'png',
          pdfSettings.structure.header[0],
          pdfSettings.structure.header[1] - 2.5,
          7,
          7
        );


        // add the title of the report as text
        doc.setTextColor("#dd1d21");
        doc.setFontSize(8);
        doc.setFontType("bold");
        doc.textEx(
          cfg.CONFIG.header.Title.toUpperCase(),
          pdfSettings.structure.header[0] + 10,
          pdfSettings.structure.header[1],
          'left'
        );


        // add the title of the selected menu
        var menuTitle = "",
          validFilters = [],
          validFilterTexts = [],
          menuItems = cfg["MENU_ITEMS"],
          filterItems = cfg["FILTER_ITEMS"],
          i;
        for (i = 0; i < menuItems.length; i++) {
          if (menuItems[i].id === cfgView.menuId) {
            menuTitle = menuItems[i].text;
            validFilters = menuItems[i].filters;
            break;
          }
        }

        // add the selected filters
        validFilterTexts.push(menuTitle);
        validFilterTexts.push($('#jbi_businesses').jstree().get_selected(true)[0].text);
        for (i = 0; i < validFilters.length; i++) {
          for (var y = 0; y < cfgView.filterItems.length; y++) {
            if (validFilters[i] === cfgView.filterItems[y].filterId) {
              var selectedItemKey = cfgView.filterItems[y].filterValue;

              for (var x = 0; x < filterItems.length; x++) {
                if ("FILTER_" + filterItems[x].id === validFilters[i]) {
                  for (var z = 0; z < filterItems[x].filterValues.length; z++) {
                    if (filterItems[x].filterValues[z].key === selectedItemKey) {
                      validFilterTexts.push(filterItems[x].filterValues[z].text.trim());
                      break;
                    }
                  }
                  break;
                }
              }
              break;
            }
          }
        }

        doc.setFontType("normal");
        doc.setFontSize(8);
        doc.textEx(
          validFilterTexts.join(" / "),
          pdfSettings.structure.header[0] + 10,
          pdfSettings.structure.header[1] + 4,
          'left'
        );


        // add the period and the version
        var currentPeriod = shell.app.execdb.dashboard.period_functions.getCurrentPeriod();
        var period;
        if (currentPeriod) {
          period = currentPeriod.periodFullName + " " + currentPeriod.year;

          // check if there is a version
          var version = $("body").data("currentVersion");
          if (!version || version === '') {
            version = "UNPUBLISHED";
          }

          doc.setFontType("bold");
          doc.setFontSize(8);
          doc.textEx(
            period.toUpperCase() + " / " + version.toUpperCase(),
            pdfSettings.structure.header[0] + pdfSettings.structure.header[2],
            pdfSettings.structure.header[1],
            'right'
          );

          doc.setFontType("normal");
          doc.setFontSize(8);
          doc.textEx(
            "Page " + pageNumber,
            pdfSettings.structure.header[0] + pdfSettings.structure.header[2],
            pdfSettings.structure.header[1] + 4,
            'right'
          );
        }


        // draw a line under the header section
        doc.setDrawColor(238, 238, 238);
        doc.setLineWidth(0.5);
        doc.line(
          pdfSettings.structure.header[0],    // margin left
          ( pdfSettings.structure.header[1] + pdfSettings.structure.header[3] ),  // margin top + height
          ( pdfSettings.structure.header[0] + pdfSettings.structure.header[2] ),  // margin left  + width
          ( pdfSettings.structure.header[1] + pdfSettings.structure.header[3] )   // margin top + height
        );

        deferred.resolve();
        return deferred.promise()
      }


      /**
       * Adds the page commentary to the PDF
       * @returns {object} promise
       * @private
       */
      function _addCommentaryImageToPDF() {
        var deferred = $.Deferred();

        // cfgView.commentKey
        var noCommentsText = "No comments.";
        var text = $(decodeURIComponent( my._getCommentText() )).text();
        if (!text || text === '') {
          text = noCommentsText;
        }

        try {
          text = doc.splitTextToSize(pdfSettings.structure.pageComments[2]);
        } catch (err) {
        }

        // add a background for the comments
        //doc.setDrawColor(0.95);

        doc.setDrawColor(238, 238, 238);
        //doc.setFillColor(220, 220, 220);
        doc.rect(
          pdfSettings.structure.pageComments[0],
          pdfSettings.structure.pageComments[1],
          pdfSettings.structure.pageComments[2],
          pdfSettings.structure.pageComments[3]
        );

        // only show the comments big if they are available
        if (text === noCommentsText) {
          doc.setTextColor(220, 220, 220);
          doc.setFontSize(8);
          doc.setFontType("italic");
        } else {
          doc.setTextColor(100);
          doc.setFontSize(8);
          doc.setFontType("bold");
        }

        doc.textEx(
          text,
          pdfSettings.structure.pageSize[0] / 2,
          pdfSettings.structure.pageComments[1] + ( pdfSettings.structure.pageComments[3] / 2  ),
          'center',
          'middle'
        );

        // draw a line below the comment section
        //doc.setDrawColor(180, 180, 180);
        //doc.setLineWidth(0.5);
        //doc.line(
        //  pdfSettings.structure.pageComments[0],    // margin left
        //  ( pdfSettings.structure.pageComments[1] + pdfSettings.structure.pageComments[3] ),  // margin top + height
        //  ( pdfSettings.structure.pageComments[0] + pdfSettings.structure.pageComments[2] ),  // margin left  + width
        //  ( pdfSettings.structure.pageComments[1] + pdfSettings.structure.pageComments[3] )   // margin top + height
        //);

        deferred.resolve();
        return deferred.promise()
      }

      /**
       * Adds the page content to the PDF
       * @returns {object} promise
       * @private
       */
      function _addContentImageToPDF() {
        var deferred = $.Deferred();

        _addDOMElementAsImage(
          $('#jbi_content')[0],
          pdfSettings.structure.contents[0],
          pdfSettings.structure.contents[1]
        ).then(function () {
          deferred.resolve()
        });

        return deferred.promise()
      }

      /**
       * Adds a footer to the PDF
       * @returns {object} promise
       * @private
       */
      function _addPageFooter() {
        var deferred = $.Deferred();

        // add the classification
        doc.setTextColor("#dd1d21");
        doc.setFontSize(8);
        doc.setFontType("normal");
        doc.textEx(
          'MOST CONFIDENTIAL',
          pdfSettings.structure.footer[0],
          pdfSettings.structure.footer[1] + 4,
          'left'
        );

        // add the classification
        var currentDate = new Date;
        doc.setFontType("normal");
        doc.textEx(
          'Generated at: ' + currentDate.toUTCString(),
          pdfSettings.structure.footer[0] + pdfSettings.structure.footer[2],
          pdfSettings.structure.footer[1] + 4,
          'right'
        );

        // draw a line above the footer section
        doc.setDrawColor(238, 238, 238);
        doc.setLineWidth(0.5);
        doc.line(
          pdfSettings.structure.footer[0],    // margin left
          pdfSettings.structure.footer[1],  // margin top + height
          ( pdfSettings.structure.footer[0] + pdfSettings.structure.footer[2] ),  // margin left  + width
          pdfSettings.structure.footer[1]   // margin top + height
        );

        deferred.resolve();
        return deferred.promise()
      }


      /**
       * Add a DOM element as image to the PDF
       * @param element {object} DOM object
       * @param x {int} The x-position in the PDF document
       * @param y {int} the y-position in the PDF document
       * @returns {object} promise
       * @private
       */
      function _addDOMElementAsImage(element, x, y) {
        var deferred = $.Deferred();
        var imageData;


        // first convert the element to an image
        _elementToImage(element)
          .then(function (imgData) {
            imageData = imgData;
            return _calculateImageSize(imageData);
          })
          .then(function (imageSize) {
            return _addImageToDoc(imageData, x, y, imageSize.fixedWidth, imageSize.fixedHeight, imageSize.actualWidthMM, imageSize.actualHeightMM);
          })
          .then(function () {
            deferred.resolve();
          });

        return deferred.promise();
      }


      /**
       * Calculates the width / height of the images to make sure it fits on
       * the PDF document
       * Upscaling the image will result in a very bad looking PDF page, for that
       * reason we will only shrink the image in case the image is too big for
       * the page. To calculate if the image is too big, we need to convert the
       * PDF units (mm) to pixels;
       * As the image is generated from the HTML Canvas via function toDataURL, we
       * know that the resolution of the image is 96dpi
       * https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
       * With this information, we can calculate the content area in pixels:
       * http://www.dallinjones.com/2008/07/how-to-convert-from-pixels-to-millimeters/
       * @param imageData {string} Base64 encoded image string
       * @returns {object} promise
       * @private
       */
      function _calculateImageSize(imageData) {

        var deferred = $.Deferred(),
          img = new Image();

        img.onload = function () {
          var calculatedSize = {
              fixedWidth: undefined,
              fixedHeight: undefined,
              actualWidthMM: null,
              actualHeightMM: null
            },
            imageWidthInPixels = img.width,
            imageHeightInPixels = img.height,
            dpi = 96,
            pdfContentAreaWidthInPixels = ( pdfSettings.structure.contents[2] * dpi ) / 25.4,
            pdfContentAreaHeightInPixels = ( pdfSettings.structure.contents[3] * dpi ) / 25.4;

          calculatedSize.actualWidthMM = ( imageWidthInPixels * 25.4 ) / dpi;
          calculatedSize.actualHeightMM = ( imageHeightInPixels * 25.4 ) / dpi;

          // if both the image width and height are within the limits, there is no need to shrink it
          if (imageWidthInPixels > pdfContentAreaWidthInPixels ||
            imageHeightInPixels > pdfContentAreaHeightInPixels) {

            // reset the actual width
            calculatedSize.actualWidthMM = pdfSettings.structure.contents[2];
            calculatedSize.actualHeightMM = pdfSettings.structure.contents[3];

            // shrink the image
            var ratio = Math.min(pdfSettings.structure.contents[2] / img.width, pdfSettings.structure.contents[3] / img.height);
            calculatedSize.fixedWidth = img.width * ratio;
            calculatedSize.fixedHeight = img.height * ratio;
          }

          deferred.resolve(calculatedSize);
        };

        // add an dummy image to retrieve its size
        img.src = imageData;

        return deferred.promise()
      }


      /**
       * Add an image to the PDF document
       * @param img {string} Base64 encoded image string
       * @param x {int} The x-position in the PDF document
       * @param y {int} the y-position in the PDF document
       * @param fixedWidth {int} the width of the image in mm that is rendered. If this
       *                         value is undefined, the library picks the actual width
       * @param fixedHeight {int} the height of the image in mm that is rendered. If this
       *                         value is undefined, the library picks the actual height
       * @param actualWidthMM {int} the width of the image in mm
       * @param actualHeightMM {int} the height of the image in mm
       * @returns {object} promise
       * @private
       */
      function _addImageToDoc(img, x, y, fixedWidth, fixedHeight, actualWidthMM, actualHeightMM) {
        var deferred = $.Deferred();

        doc.addImage(
          img,
          x + ( ( pdfSettings.structure.contents[2] - actualWidthMM ) / 2),
          y + ( ( pdfSettings.structure.contents[3] - actualHeightMM ) / 2),
          fixedWidth,
          fixedHeight
        );

        deferred.resolve();
        return deferred.promise();
      }


      /**
       * Save the PDF file
       * @private
       */
      function _saveDocument() {

        // set the file name
        var currentDate = new Date(),
          yyyy = currentDate.getFullYear().toString(),
          mm = (currentDate.getMonth() + 1).toString(), // getMonth() is zero-based
          dd = currentDate.getDate().toString(),
          yyyymmdd = yyyy + (mm[1] ? mm : "0" + mm[0]) + (dd[1] ? dd : "0" + dd[0]),
          fileName = "report_" + yyyymmdd;

        if (cfg && cfg.CONFIG && cfg.CONFIG.header && cfg.CONFIG.header.Title) {
          fileName = cfg.CONFIG.header.Title + "_" + yyyymmdd;
        }

        doc.save("shell - group mi - " + fileName.toLowerCase() + ".pdf");
      }


      /**
       * Creating a PDF file based on HTML requires the following steps: First
       * a DOM element is converted to a canvas by using the html2canvas library.
       * Next the canvas is converted to an PNG image and then this image is added
       * to a PDF file using the jsPDF library.
       * @param element {object} DOM element that will be converted to image
       * @private
       */
      function _elementToImage(element) {
        var deferred = $.Deferred();

        // create a clone of the target element (because the element requires modifications before being able to print)
        var cloneElement = _createElementClone(element);

        // convert all SVGs in the clone to canvas (as html2canvas lib cannot handle them)
        _convertSVGtoCanvas(cloneElement);

        // convert the HTML of the clone to canvas
        html2canvas(cloneElement, {
          onrendered: function (canvas) {
            document.body.removeChild(cloneElement);
            $("body").css("overflow", "initial");
            deferred.resolve(canvas.toDataURL('image/jpeg', pdfSettings.imageQuality));
          }
        });
        return deferred.promise();


        /**
         * This function creates a clone of the target element and sets its position
         * to relative and uses that in the html2canvas library.
         * @param element {object} DOM element to be cloned
         * @private
         */
        function _createElementClone(element) {

          // create a clone object
          var clone = element.cloneNode(true);

          // Position element relatively within the body but still out of the viewport
          var style = clone.style;
          style.position = 'relative';
          style.top = window.innerHeight + 'px';
          style.left = 0;
          style.maxWidth = $("#jbi_content").width() + 'px';      // change in order to keep control over image size
          $(clone).css("background", "white");

          // Append clone to body and return the clone
          $("body").css("overflow", "hidden");
          document.body.appendChild(clone);
          return clone;
        }


        /**
         * Converts all SVG objects within a certain rootElement to canvas.
         * @param element {object} DOM element for which its SVG children will be converted
         * @private
         */
        function _convertSVGtoCanvas(element) {
          var svgElem = $(element).find("svg");

          svgElem.each(function (index, node) {
            var parentNode = node.parentNode,
              svg = $('<div>').append($(node).clone()).html(), //node.outerHTML,
              canvas = document.createElement('canvas');

            // use the canvg library to replace the svg elements
            try {
              canvg(canvas, svg);
            } catch (err) {
            }

            // remove the svg and add the canvas object
            parentNode.removeChild(node);
            parentNode.appendChild(canvas);
          });
        }
      }
    }


    jsPDF.API.textEx = function (text, x, y, hAlign, vAlign) {
      var splitRegex = /\r\n|\r|\n/g;
      var fontSize = this.internal.getFontSize() / this.internal.scaleFactor;

      // As defined in jsPDF source code
      var lineHeightProportion = 1.15;

      var splittedText = null;
      var lineCount = 1;
      if (vAlign === 'middle' || vAlign === 'bottom' || hAlign === 'center' || hAlign === 'right') {
        splittedText = typeof text === 'string' ? text.split(splitRegex) : text;

        lineCount = splittedText.length || 1;
      }

      // Align the top
      if (vAlign) {
        y += fontSize * (2 - lineHeightProportion);
      }

      if (vAlign === 'middle')
        y -= (lineCount / 2) * fontSize;
      else if (vAlign === 'bottom')
        y -= lineCount * fontSize;

      if (hAlign === 'center' || hAlign === 'right') {
        var alignSize = fontSize;
        if (hAlign === 'center')
          alignSize *= 0.5;

        if (lineCount > 1) {
          for (var iLine = 0; iLine < splittedText.length; iLine++) {
            this.text(splittedText[iLine], x - this.getStringUnitWidth(splittedText[iLine]) * alignSize, y);
            y += fontSize;
          }
          return this;
        }
        x -= this.getStringUnitWidth(text) * alignSize;
      }

      this.text(text, x, y);
      return this;
    };

  };

  return my;

}(shell.app.execdb.dashboard));

//####src/execdb/dashboard/mod_period.js
shell.app.execdb.dashboard = ( function (my) {

  /**
   * Handle the periods
   * @private
     */
  my._showPeriod = function () {
    var currentPeriod = getCurrentPeriod();
    if (currentPeriod) {
      $("#jbi_period").html(currentPeriod.periodFullName + " " + currentPeriod.year)
    }
  };


  /**
   * Converts a month short name to a number (Jan --> 1)
   * @param periodShortName {string} the short name of the month
   * @returns {string} the number of the month. Or (in case the input string was not valid, -1)
     */
  function periodShortNameToNumber(periodShortName) {
    var periodShortNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
      periodShortNamesIndex = periodShortNames.indexOf(periodShortName);
    if (periodShortNamesIndex > -1) {
      var periodNumber = "000" + (periodShortNamesIndex + 1);
      return periodNumber.substring(periodNumber.length - 3);
    }
    return "000";
  }


  /**
   * Converts a month short name to a full name
   * @param periodShortName {string} the short name of the month
   * @returns {string} the full name of the month
     */
  function periodShortNameToFullName(periodShortName) {
    var periodShortNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
      periodFullNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      periodShortNamesIndex = periodShortNames.indexOf(periodShortName);
    if (periodShortNamesIndex > -1) {
      return (periodFullNames[periodShortNamesIndex]);
    }
    return "";
  }


  /**
   * Either accepts a single period identifier or an array of them. It does a
   * lookup of the name of the periodIdentifiers. If none can be found, it returns
   * the identifier
   * @param periodIdentifier {string || array} holding the identifiers
   * @returns {string || array} the header labels
     */
  function getPeriodIdentifierLabel(periodIdentifier) {
    var customData = $("body").data("customDataApp"),
      periods = customData.periods,
      returnObject;

    // in case an array is provided, get the header labels for each item
    if (Object.prototype.toString.call(periodIdentifier) === '[object Array]') {
      returnObject = [];
      for (var i=0; i<periodIdentifier.length; i++) {
        returnObject.push( (periods[periodIdentifier[i]] || periodIdentifier[i]) );
      }
      return returnObject;
    }

    return (periods[periodIdentifier] || periodIdentifier);
  }


  /**
   * Gets information about the current period
   * @returns {object} Names for the current period
     */
  function getCurrentPeriod() {
    var periodSplit,
      periodIdentifier = "CM CY",
      currentPeriod = getPeriodIdentifierLabel(periodIdentifier);

    // check if a valid name is found
    if (currentPeriod === periodIdentifier) {
      return null;
    }

    // a valid period contains of 2 items in the split period eg [001, 2010]
    periodSplit = currentPeriod.split(" ");
    if (!periodSplit.length || periodSplit.length !== 2) {
      return null;
    }

    // create the period object
    return {
      periodIdentifier: periodIdentifier,
      currentPeriod: currentPeriod,
      periodNumber: periodShortNameToNumber(periodSplit[0]),
      periodShortName : periodSplit[0],
      periodFullName : periodShortNameToFullName(periodSplit[0]),
      year : periodSplit[1]
    };
  }


  /**
   * Expose the period functions to the application
   */
  my.period_functions = {
    getCurrentPeriod : getCurrentPeriod,
    getPeriodIdentifierLabel: getPeriodIdentifierLabel
  };

  return my;

}(shell.app.execdb.dashboard));

//####src/execdb/dashboard/mod_skeleton.js
shell.app.execdb.dashboard = ( function (my) {

  my._buildSkeleton = function (elementId) {

    // extract an object holding the styles from the configuration object
    var appConfig = $("body").data("customConfig"),
      styleConfig = getStyleConfig(appConfig.CONFIG);

    // Set the application CSS and HTML
    setCSS(styleConfig);
    setHTML(elementId, styleConfig);
  };


  /**
   * Extract the application style configuration
   * @param  {object} config Application configuration file
   * @returns {object} All styles in a single object
   */
  function getStyleConfig(config) {
    var configObject = {
      pDashboardMinWidth: (config.dashboard.MinWidth && config.dashboard.MinWidth !== "") ? config.dashboard.MinWidth : "auto",
      pDashboardMaxWidth: (config.dashboard.MaxWidth && config.dashboard.MaxWidth !== "") ? config.dashboard.MaxWidth : "auto",
      pDashboardMaxHeight: (config.dashboard.MaxHeight && config.dashboard.MaxHeight !== "") ? config.dashboard.MaxHeight : "auto",
      pDashboardBackgroundColor: (config.dashboard.BackgroundColor && config.dashboard.BackgroundColor !== "") ? config.dashboard.BackgroundColor : "#FFFFFF",
      pDashboardFontFamily: (config.dashboard.FontFamily && config.dashboard.FontFamily !== "") ? config.dashboard.FontFamily : "Verdana",

      pHeaderEnabled: (config.header.Enabled && config.header.Enabled !== "True") ? "none" : "block",
      pHeaderHeightPixels: (!config.header.HeightPixels || isNaN(parseInt(config.header.HeightPixels))) ? 50 : parseInt(config.header.HeightPixels),
      pHeaderFontSizePixels: (!config.header.FontSizePixels || isNaN(parseInt(config.header.FontSizePixels))) ? 17 : parseInt(config.header.FontSizePixels),
      pHeaderBackgroundColor: (config.header.BackgroundColor && config.header.BackgroundColor !== "") ? config.header.BackgroundColor : "#FFFFFF",
      pHeaderFontColor: (config.header.FontColor && config.header.FontColor !== "") ? config.header.FontColor : "#000000",
      pHeaderTitle: (config.header.Title && config.header.Title !== "") ? config.header.Title : "",
      pHeaderTitleYPosition: (!config.header.TitleYPosition || isNaN(parseInt(config.header.TitleYPosition))) ? 0 : parseInt(config.header.TitleYPosition),
      pHeaderTitleXPosition: (!config.header.TitleXPosition || isNaN(parseInt(config.header.TitleXPosition))) ? 40 : parseInt(config.header.TitleXPosition),
      pHeaderLogoEnabled: (config.header.LogoEnabled && config.header.LogoEnabled !== "True") ? "none" : "block",
      pHeaderLogoWidthPixels: (!config.header.LogoWidthPixels || isNaN(parseInt(config.header.LogoWidthPixels))) ? 30 : parseInt(config.header.LogoWidthPixels),
      pHeaderLogoHeightPixels: (!config.header.LogoHeightPixels || isNaN(parseInt(config.header.LogoHeightPixels))) ? 30 : parseInt(config.header.LogoHeightPixels),
      pHeaderLogoYPosition: (!config.header.LogoYPosition || isNaN(parseInt(config.header.LogoYPosition))) ? 4 : parseInt(config.header.LogoYPosition),
      pHeaderLogoXPosition: (!config.header.LogoXPosition || isNaN(parseInt(config.header.LogoXPosition))) ? 4 : parseInt(config.header.LogoXPosition),
      pHeaderPeriodXPos: (!config.header.PeriodXPosition || isNaN(parseInt(config.header.PeriodXPosition))) ? 17 : parseInt(config.header.PeriodXPosition),
      pHeaderPeriodYPos: (!config.header.PeriodYPosition || isNaN(parseInt(config.header.PeriodYPosition))) ? 20 : parseInt(config.header.PeriodYPosition),
      pHeaderPeriodFontColor: (config.header.PeriodFontColor && config.header.PeriodFontColor !== "") ? config.header.PeriodFontColor : "#FFFFFF",
      pHeaderPeriodFontSize: (!config.header.PeriodFontSize || isNaN(parseInt(config.header.PeriodYPosition))) ? 12 : parseInt(config.header.PeriodFontSize),
      pHeaderSubTitleEnabled: config.header.SubTitleEnabled === "True",
      pHeaderSubTitleContent: config.header.SubTitleContent || "",
      pHeaderSubTitleFontColor: (config.header.SubTitleFontColor && config.header.SubTitleFontColor !== "") ? config.header.SubTitleFontColor : "#FFFFFF",
      pHeaderSubTitleFontSize: (!config.header.SubTitleFontSize || isNaN(parseInt(config.header.SubTitleYPosition))) ? 12 : parseInt(config.header.SubTitleFontSize),
      pHeaderSubTitleXPos: (!config.header.SubTitleXPosition || isNaN(parseInt(config.header.SubTitleXPosition))) ? 70 : parseInt(config.header.SubTitleXPosition),
      pHeaderSubTitleYPos:  (!config.header.SubTitleYPosition || isNaN(parseInt(config.header.SubTitleYPosition))) ? 50 : parseInt(config.header.SubTitleYPosition),

      pFooterEnabled: (config.footer.Enabled && config.footer.Enabled !== "True") ? "none" : "block",
      pFooterHeightPixels: (!config.footer.HeightPixels || isNaN(parseInt(config.footer.HeightPixels))) ? 50 : parseInt(config.footer.HeightPixels),
      pFooterBackgroundColor: (config.footer.BackgroundColor && config.footer.BackgroundColor !== "") ? config.footer.BackgroundColor : "#FFFFFF",

      pMenuPlacement: (config.menu.Display && config.menu.Display !== "") ? config.menu.Display : "TextOnly",
      pMenuTopYOffset: (!config.menu.topYOffset || isNaN(parseInt(config.menu.topYOffset))) ? 0 : parseInt(config.menu.topYOffset),
      pMenuDisplay: (config.menu.Display === "None") ? "none" : "block",
      pMenuBackgroundColor: (config.menu.BackgroundColor && config.menu.BackgroundColor !== "") ? config.menu.BackgroundColor : "#333333",
      pMenuItemIconDisplay: "inline-block",
      pMenuItemTextUnselected: (config.menu.MenuItemTextUnselected && config.menu.MenuItemTextUnselected !== "") ? config.menu.MenuItemTextUnselected : "#FFFFFF",
      pMenuItemTextSelected: (config.menu.MenuItemTextSelected && config.menu.MenuItemTextSelected !== "") ? config.menu.MenuItemTextSelected : "#FFFFFF",
      pMenuItemBackgroundUnselected: (config.menu.MenuItemBackgroundUnselected && config.menu.MenuItemBackgroundUnselected !== "") ? config.menu.MenuItemBackgroundUnselected : "#333333",
      pMenuItemBackgroundSelected: (config.menu.MenuItemBackgroundSelected && config.menu.MenuItemBackgroundSelected !== "") ? config.menu.MenuItemBackgroundSelected : "#008CBA",
      pMenuItemBackgroundHover: (config.menu.MenuItemBackgroundHover && config.menu.MenuItemBackgroundHover !== "") ? config.menu.MenuItemBackgroundHover : "#666666",
      pMenuItemFontSize: (config.menu.MenuItemFontSize && isNaN(parseInt(config.menu.MenuItemFontSize))) ? 12 : parseInt(config.menu.MenuItemFontSize),
      pMenuItemTextHover: (config.menu.MenuItemTextHover && config.menu.MenuItemTextHover !== "") ? config.menu.MenuItemTextHover : "#FFFFFF",
      pMenuHorizontalMenuHeightPixels: (config.menu.HorizontalMenuHeightPixels && config.menu.HorizontalMenuHeightPixels !== "") ? config.menu.HorizontalMenuHeightPixels : 40,
      pMenuBorderTop : (config.menu.MenuBorderTop && config.menu.MenuBorderTop !== "") ? config.menu.MenuBorderTop : "none",
      pMenuBorderRight : (config.menu.MenuBorderRight && config.menu.MenuBorderRight !== "") ? config.menu.MenuBorderRight : "none",
      pMenuBorderLeft : (config.menu.MenuBorderLeft && config.menu.MenuBorderLeft !== "") ? config.menu.MenuBorderLeft : "none",
      pMenuBorderBottom : (config.menu.MenuBorderBottom && config.menu.MenuBorderBottom !== "") ? config.menu.MenuBorderBottom : "none",

      pFilterLeftPaneEnabled: (config.filter.FilterLeftPaneEnabled && config.filter.FilterLeftPaneEnabled !== "True") ? "none" : "block",
      pFilterLeftPaneWidthPixels: (!config.filter.FilterLeftPaneWidthPixels || isNaN(parseInt(config.filter.FilterLeftPaneWidthPixels))) ? 200 : parseInt(config.filter.FilterLeftPaneWidthPixels),
      pFilterLeftPaneBorderRight : (config.filter.FilterLeftPaneBorderRight && config.filter.FilterLeftPaneBorderRight !== "") ? config.filter.FilterLeftPaneBorderRight : "none",
      pFilterLeftPaneItemBackgroundColor: (config.filter.FilterLeftPaneItemBackgroundColor && config.filter.FilterLeftPaneItemBackgroundColor !== "") ? config.filter.FilterLeftPaneItemBackgroundColor : "#32323a",
      pFilterLeftPaneItemFontColor: (config.filter.FilterLeftPaneItemFontColor && config.filter.FilterLeftPaneItemFontColor !== "") ? config.filter.FilterLeftPaneItemFontColor : "#FFF",
      pFilterLeftPaneItemHoverBackgroundColor: (config.filter.FilterLeftPaneItemHoverBackgroundColor && config.filter.FilterLeftPaneItemHoverBackgroundColor !== "") ? config.filter.FilterLeftPaneItemHoverBackgroundColor : "#666666",
      pFilterLeftPaneItemHoverFontColor: (config.filter.FilterLeftPaneItemHoverFontColor && config.filter.FilterLeftPaneItemHoverFontColor !== "") ? config.filter.FilterLeftPaneItemHoverFontColor : "#FFFFFF",
      pFilterLeftPaneItemSelectedBackgroundColor: (config.filter.FilterLeftPaneItemSelectedBackgroundColor && config.filter.FilterLeftPaneItemSelectedBackgroundColor !== "") ? config.filter.FilterLeftPaneItemSelectedBackgroundColor : "#008CBA",
      pFilterLeftPaneItemSelectedFontColor: (config.filter.FilterLeftPaneItemSelectedFontColor && config.filter.FilterLeftPaneItemSelectedFontColor !== "") ? config.filter.FilterLeftPaneItemSelectedFontColor : "#FFFFFF",
      pFilterTopPaneHeightPixels: (!config.filter.FilterTopPaneHeightPixels || isNaN(parseInt(config.filter.FilterTopPaneHeightPixels))) ? 45 : parseInt(config.filter.FilterTopPaneHeightPixels),
      pFilterTopPaneBackgroundColor: (config.filter.FilterTopPaneBackgroundColor && config.filter.FilterTopPaneBackgroundColor !== "") ? config.filter.FilterTopPaneBackgroundColor : "transparent",
      pFilterTopPaneDropdownBorderWidth: (config.filter.FilterTopPaneDropdownBorderWidth === undefined || isNaN(parseInt(config.filter.FilterTopPaneDropdownBorderWidth))) ? 1 : parseInt(config.filter.FilterTopPaneDropdownBorderWidth),
      pFilterTopPaneDropdownBorderColor: (config.filter.FilterTopPaneDropdownBorderColor && config.filter.FilterTopPaneDropdownBorderColor !== "") ? config.filter.FilterTopPaneDropdownBorderColor : "lightgrey",
      pFilterTopPaneDropdownSelectedFontColor: (config.filter.FilterTopPaneDropdownSelectedFontColor && config.filter.FilterTopPaneDropdownSelectedFontColor !== "") ? config.filter.FilterTopPaneDropdownSelectedFontColor : "#333",
      pFilterTopPaneDropdownSelectedFontWeight: (config.filter.FilterTopPaneDropdownSelectedFontWeight === undefined || config.filter.FilterTopPaneDropdownSelectedFontWeight === "") ? "normal" : config.filter["FilterTopPaneDropdownSelectedFontWeight"],
      pFilterTopPaneDropdownSelectedFontSizePixels: (config.filter.FilterTopPaneDropdownSelectedFontSizePixels && config.filter.FilterTopPaneDropdownSelectedFontSizePixels !== "") ? config.filter.FilterTopPaneDropdownSelectedFontSizePixels : "12",
      pFilterTopPaneDropdownSelectedBackgroundColor: (config.filter.FilterTopPaneDropdownSelectedBackgroundColor && config.filter.FilterTopPaneDropdownSelectedBackgroundColor !== "") ? config.filter.FilterTopPaneDropdownSelectedBackgroundColor : "lightgrey",
      pFilterTopPaneDropdownHoverBackgroundColor: (config.filter.FilterTopPaneDropdownHoverBackgroundColor && config.filter.FilterTopPaneDropdownHoverBackgroundColor !== "") ? config.filter.FilterTopPaneDropdownHoverBackgroundColor : "#F0F0F0",
      pFilterTopPaneDropdownHoverFontColor: (config.filter.FilterTopPaneDropdownHoverFontColor && config.filter.FilterTopPaneDropdownHoverFontColor !== "") ? config.filter.FilterTopPaneDropdownHoverFontColor : "#4A4A4A",
      pFilterTopPaneDropdownHeightPixels: (!config.filter.FilterTopPaneDropdownHeightPixels || isNaN(parseInt(config.filter.FilterTopPaneDropdownHeightPixels))) ? 30 : parseInt(config.filter.FilterTopPaneDropdownHeightPixels),
      pFilterTopPaneDropdownItemFontColor: (config.filter.FilterTopPaneDropdownItemFontColor && config.filter.FilterTopPaneDropdownItemFontColor !== "") ? config.filter.FilterTopPaneDropdownItemFontColor : "#4A4A4A",
      pFilterTopPaneDropdownItemFontSizePixels: (!config.filter.FilterTopPaneDropdownItemFontSizePixels || isNaN(parseInt(config.filter.FilterTopPaneDropdownItemFontSizePixels))) ? 12 : parseInt(config.filter.FilterTopPaneDropdownItemFontSizePixels),
      pFilterTopPaneDropdownItemBackgroundColor: (config.filter.FilterTopPaneDropdownItemBackgroundColor && config.filter.FilterTopPaneDropdownItemBackgroundColor !== "") ? config.filter.FilterTopPaneDropdownItemBackgroundColor : "#FFFFFF",
      pFilterTopPaneDropdownItemHoverBackgroundColor: (config.filter.FilterTopPaneDropdownItemHoverBackgroundColor && config.filter.FilterTopPaneDropdownItemHoverBackgroundColor !== "") ? config.filter.FilterTopPaneDropdownItemHoverBackgroundColor : "#F2F2F2",
      pFilterTopPaneDropdownItemHoverFontColor: (config.filter.FilterTopPaneDropdownItemHoverFontColor && config.filter.FilterTopPaneDropdownItemHoverFontColor !== "") ? config.filter.FilterTopPaneDropdownItemHoverFontColor : "#4A4A4A",
      pFilterTopPaneDropdownItemDisabledFontColor: (config.filter.FilterTopPaneDropdownItemDisabledFontColor && config.filter.FilterTopPaneDropdownItemDisabledFontColor !== "") ? config.filter.FilterTopPaneDropdownItemDisabledFontColor : "#CCCCCC",
      pFilterTopPaneDropdownItemDisabledBackgroundColor: (config.filter.FilterTopPaneDropdownItemDisabledBackgroundColor && config.filter.FilterTopPaneDropdownItemDisabledBackgroundColor !== "") ? config.filter.FilterTopPaneDropdownItemDisabledBackgroundColor : "#FFFFFF",
      pFilterIconsEnabled: (config.filter.FilterIconsEnabled && config.filter.FilterIconsEnabled !== "True") ? "none" : "block",

      pViewCommentEnabled: (config.viewcomment.Enabled && config.viewcomment.Enabled !== "True") ? "none" : "block",
      pViewCommentTextAlign: (config.viewcomment.TextAlign && config.viewcomment.TextAlign !== "") ? config.viewcomment.TextAlign : "left",
      pViewCommentFontColor: (config.viewcomment.FontColor && config.viewcomment.FontColor !== "") ? config.viewcomment.FontColor : "#888",
      pViewCommentMaxWidth: (config.viewcomment.MaxWidth === undefined || isNaN(parseInt(config.viewcomment.MaxWidth))) ? undefined : parseInt(config.viewcomment.MaxWidth),
      pViewCommentHeight: (config.viewcomment.Height === undefined || isNaN(parseInt(config.viewcomment.Height))) ? 45 : parseInt(config.viewcomment.Height),
      pViewCommentTop: (config.viewcomment.Top === undefined || isNaN(parseInt(config.viewcomment.Top))) ? 70 : parseInt(config.viewcomment.Top),
      pViewCommentLeft: (config.viewcomment.Left === undefined || isNaN(parseInt(config.viewcomment.Left))) ? 200 : parseInt(config.viewcomment.Left),
      pViewCommentRight: (config.viewcomment.Right === undefined || isNaN(parseInt(config.viewcomment.Right))) ? 180 : parseInt(config.viewcomment.Right),
      pViewCommentBottom: (config.viewcomment.Bottom === undefined || isNaN(parseInt(config.viewcomment.Bottom))) ? undefined : parseInt(config.viewcomment.Bottom),
      pViewCommentFontSize: (config.viewcomment.FontSize && config.viewcomment.FontSize !== "") ? config.viewcomment.FontSize : "14px",
      pViewCommentUpperCase: (config.viewcomment.UpperCase && config.viewcomment.UpperCase !== "True") ? "none" : "uppercase",

      pPdfEnabled: (config.pdf.Enabled && config.pdf.Enabled !== "True") ? "none" : "block",
      pPdfExportEnabled: (config.pdf.Enabled && config.pdf.Enabled === "True") ? true : false,
      pPdfFontColor: (config.pdf.FontColor && config.pdf.FontColor !== "") ? config.pdf.FontColor : "#888",
      pPdfFontSize: (config.pdf.FontSize && config.pdf.FontSize !== "") ? config.pdf.FontSize : "14px",
      pPdfPositionTop: (config.pdf.PositionTop === undefined || isNaN(parseInt(config.pdf.PositionTop))) ? "0px;" : parseInt(config.pdf.PositionTop) + "px;",
      pPdfPositionRight: (config.pdf.PositionRight === undefined || isNaN(parseInt(config.pdf.PositionRight))) ? "0px;" : parseInt(config.pdf.PositionRight) + "px;",
      pPdfPositionBottom: (config.pdf.PositionBottom === undefined || isNaN(parseInt(config.pdf.PositionBottom))) ? "auto;" : parseInt(config.pdf.PositionBottom),
      pPdfPositionLeft: (config.pdf.PositionLeft === undefined || isNaN(parseInt(config.pdf.PositionLeft))) ? "auto;" : parseInt(config.pdf.PositionLeft),

      pContainerMessageFontSizePixels: (config.container["MessageFontSizePixels"] === undefined || isNaN(parseInt(config.container["MessageFontSizePixels"]))) ? 12 : parseInt(config.container["MessageFontSizePixels"]),
      pContainerMessageDefaultFontColor: (config.container["MessageDefaultFontColor"] && config.container["MessageDefaultFontColor"] !== "") ? config.container["MessageDefaultFontColor"] : "#000000",
      pContainerMessageWarningFontColor: (config.container["MessageWarningFontColor"] && config.container["MessageWarningFontColor"] !== "") ? config.container["MessageWarningFontColor"] : "#000000",
      pContainerMessageErrorFontColor: (config.container["MessageErrorFontColor"] && config.container["MessageErrorFontColor"] !== "") ? config.container["MessageErrorFontColor"] : "#000000",
      pContainerFooterHeightPixels: (config.container["FooterHeightPixels"] === undefined || isNaN(parseInt(config.container["FooterHeightPixels"]))) ? 24 : parseInt(config.container["FooterHeightPixels"]),
      pContainerFooterFontColor: (config.container["FooterFontColor"] && config.container["FooterFontColor"] !== "") ? config.container["FooterFontColor"] : "#564A4A",
      pContainerFooterBackgroundColor: (config.container["FooterBackgroundColor"] && config.container["FooterBackgroundColor"] !== "") ? config.container["FooterBackgroundColor"] : "#F0F0F0",
      pContainerFooterFontSizePixels: (config.container["FooterFontSizePixels"] === undefined || isNaN(parseInt(config.container["FooterFontSizePixels"]))) ? 12 : parseInt(config.container["FooterFontSizePixels"]),
      pContainerTitleHeightPixels: (config.container["TitleHeightPixels"] === undefined || isNaN(parseInt(config.container["TitleHeightPixels"]))) ? 0 : parseInt(config.container["TitleHeightPixels"]),
      pContainerTitleBackgroundColor: (config.container["TitleBackgroundColor"] && config.container["TitleBackgroundColor"] !== "") ? config.container["TitleBackgroundColor"] : "#F0F0F0",
      pContainerTitleFontColor: (config.container["TitleFontColor"] && config.container["TitleFontColor"] !== "") ? config.container["TitleFontColor"] : "#000000",
      pContainerTitleFontSizePixels: (config.container["TitleFontSizePixels"] === undefined || isNaN(parseInt(config.container["TitleFontSizePixels"]))) ? 0 : parseInt(config.container["TitleFontSizePixels"]),
      pContainerTitleFontWeight: (config.container["TitleFontWeight"] === undefined || config.container["TitleFontWeight"] === "") ? "normal" : config.container["TitleFontWeight"],
      pContainerTitleTextAlign: (config.container["TitleTextAlign"] && config.container["TitleTextAlign"] !== "") ? config.container["TitleTextAlign"] : "left",
      pContainerBorderColor: (config.container["BorderColor"] && config.container["BorderColor"] !== "") ? config.container["BorderColor"] : "#D8D8D8",
      pContainerBorderWidthPixels: (config.container["BorderWidthPixels"] === undefined || isNaN(parseInt(config.container["BorderWidthPixels"]))) ? 1 : parseInt(config.container["BorderWidthPixels"]),
      pContainerBorderStyle: (config.container["BorderStyle"] && config.container["BorderStyle"] !== "") ? config.container["BorderStyle"] : "solid"
    };


    if (configObject.pHeaderEnabled === "none") {
      configObject.pHeaderHeightPixels = 0;
    }
    if (configObject.pFooterEnabled === "none") {
      configObject.pFooterHeightPixels = 0;
    }
    if (configObject.pMenuPlacement === "TextOnly") {
      configObject.pMenuItemIconDisplay = "none";
    }
    if (configObject.pMenuPlacement === "None") {
      configObject.pMenuDisplay = "none";
      configObject.pMenuHorizontalMenuHeightPixels = 0;
    }
    return configObject;
  }


  /**
   * SET APPLICATION CSS
   * Add CSS based on the configuration
   **/
  function setCSS(cfg) {
    var s = "";
    s += "<style type='text/css' id='CSS_" + cfg.pDashboardLayout + "' data-repstyle='execdb'>";

    /** Framework specific **/
    s += "#jbi_container{";
    s += "  position: fixed;";
    s += "  top: 0;";
    s += "  left: 0;";
    s += "  right: 0;";
    s += "  bottom:0;";
    s += "  background-color : " + cfg.pDashboardBackgroundColor + ";";
    s += "  overflow-x: auto;";
    s += "  overflow-y: hidden;";
    s += "}";

    s += "#jbi_app{";
    s += "  min-width : " + cfg.pDashboardMinWidth + ";";
    s += "  max-width: " + cfg.pDashboardMaxWidth + ";";
    s += "  max-height: " + cfg.pDashboardMaxHeight + ";";
    s += "  margin-left: auto;";
    s += "  margin-right: auto;";
    s += "  width: 100%;";
    s += "  position: absolute;";
    s += "  top: 0;";
    s += "  left: 0;";
    s += "  right: 0;";
    s += "  bottom:0;";
    s += "  border-left-width : 1px;";
    s += "  border-left-style: solid;";
    s += "  border-left-color: lightgrey;";
    s += "  border-right-width : 1px;";
    s += "  border-right-style: solid;";
    s += "  border-right-color: lightgrey;";
    s += "  z-index: 12000;";
    s += "  box-sizing: border-box;";
    s += "}";

    s += "#jbi_header{";
    s += "  display : " + cfg.pHeaderEnabled + ";";
    s += "  position: absolute;";
    s += "  top: 0;";
    s += "  left: 0;";
    s += "  right: 0;";
    s += "  height: " + cfg.pHeaderHeightPixels + "px;";
    s += "  line-height: " + cfg.pHeaderHeightPixels + "px;";
    s += "  background-color : " + cfg.pHeaderBackgroundColor + ";";
    s += "  color : " + cfg.pHeaderFontColor + ";";
    s += "  padding-left: 17px;";
    s += "}";

    s += "#jbi_period{";
    s += "  position:absolute;";
    s += "  top: " + cfg.pHeaderPeriodYPos + "px;";
    s += "  left: " + cfg.pHeaderPeriodXPos + "px;";
    s += "  height: 20px;";
    s += "  font-family: Futura, 'Trebuchet MS', Arial, sans-serif;";
    s += "  font-size: " + cfg.pHeaderPeriodFontSize + "px;";
    s += "  font-style: italic;";
    s += "  font-variant: normal;";
    s += "  font-weight: bold;";
    s += "  color: " + cfg.pHeaderPeriodFontColor + ";";
    s += "  z-index: 1;";
    s += "}";

    if (cfg.pHeaderSubTitleEnabled) {
        s += "#jbi_sub_title {";
        s += "  position:absolute;";
        s += "  top: " + cfg.pHeaderSubTitleYPos + "px;";
        s += "  left: " + cfg.pHeaderSubTitleXPos + "px;";
        s += "  height: 20px;";
        s += "  font-family: Futura, 'Trebuchet MS', Arial, sans-serif;";
        s += "  font-size: " + cfg.pHeaderSubTitleFontSize + "px;";
        s += "  font-variant: normal;";
        s += "  color: " + cfg.pHeaderSubTitleFontColor + ";";
        s += "  z-index: 1;";
        s += "}";
    }

    s += "#jbi_menu{";
    s += "  background-color: " + cfg.pMenuBackgroundColor + ";";
    s += "  position: absolute;";
    s += "  right: 0;";
    s += "  top: " + parseInt(cfg.pHeaderHeightPixels + cfg.pMenuTopYOffset) + "px;";
    s += "  height: " + cfg.pMenuHorizontalMenuHeightPixels + "px;";
    s += "  left: " + cfg.pFilterLeftPaneWidthPixels + "px;";
    s += "  display :" + cfg.pMenuDisplay + ";";
    s += "  font-size: " + cfg.pMenuItemFontSize + "px;";
    s += "  overflow-y: hidden;";
    s += "  border-top: " + cfg.pMenuBorderTop + ";";
    s += "  border-right: " + cfg.pMenuBorderRight + ";";
    s += "  border-bottom: " + cfg.pMenuBorderBottom + ";";
    s += "  border-left: " + cfg.pMenuBorderLeft + ";";
    s += "}";

    s += "#jbi_comment{";
    s += " position: absolute;";
    s += " color: " + cfg.pViewCommentFontColor + ";";
    s += " text-align: " + cfg.pViewCommentTextAlign + ";";
    s += " font-size: " + cfg.pViewCommentFontSize + ";";
    s += " height: " + cfg.pViewCommentHeight + "px;";
    s += " left: " + cfg.pViewCommentLeft + "px;";
    s += " top: " + cfg.pViewCommentTop + "px;";
    s += " right: " + cfg.pViewCommentRight + "px;";
    if (cfg.pViewCommentBottom) {
      s += " bottom: " + cfg.pViewCommentBottom + "px;";
    }
    s += " display: " + cfg.pViewCommentEnabled + ";";
    if (cfg.pViewCommentMaxWidth) {
      s += " max-width: " + cfg.pViewCommentMaxWidth + "px;";
    }
    s += " text-transform: " + cfg.pViewCommentUpperCase + ";";
    s += " padding: 4px;";
    s += " overflow: hidden;";
    s += " box-sizing: border-box;";
    s += " font-family: Tahoma,Arial,Helvetica,sans-serif;";
    s += "}";

    s += "#jbi_filter_toppane{";
    s += "  position: absolute;";
    s += "  height: " + cfg.pFilterTopPaneHeightPixels + "px;";
    s += "  line-height: " + cfg.pFilterTopPaneHeightPixels + "px;";
    s += "  left: " + cfg.pFilterLeftPaneWidthPixels + "px;";
    s += "  top: " + parseInt(cfg.pHeaderHeightPixels + cfg.pMenuTopYOffset + cfg.pMenuHorizontalMenuHeightPixels) + "px;";
    s += "  right: 0;";
    s += "  background-color: " + cfg.pFilterTopPaneBackgroundColor + ";";
    s += "  text-align: right;";
    s += "  margin-right: 4px;";
    s += "}";



    s += "#jbi_filter_icons{";
    s += "  position: absolute;";
    s += "  margin: 0px 4px 0px 4px;";
    s += "  left: " + cfg.pFilterLeftPaneWidthPixels + "px;";
    s += "  top: " + parseInt(cfg.pHeaderHeightPixels + cfg.pMenuTopYOffset +  cfg.pMenuHorizontalMenuHeightPixels + cfg.pFilterTopPaneHeightPixels) + "px;";
    s += "  right: 0;";
    s += "  bottom: 0;";
    s += "  background-color: #FFF;";
    s += "  display: none;";
    s += "}";

    s += "#jbi_filter_iconsitems{";
    s += "  position: absolute;";
    s += "  left: 0px;";
    s += "  right: 0px;";
    s += "  top: 0px;";
    s += "  height: 24px;";
    s += "  background-color: #F0F0F0;";
    s += "  text-align: right;";
    s += "  border-left: 1px solid lightgrey;";
    s += "  border-top: 1px solid lightgrey;";
    s += "  border-right: 1px solid lightgrey;";
    s += "  display: " + cfg.pFilterIconsEnabled + ";";
    s += "}";

    s += "#jbi_footer{";
    s += "  background-color: " + cfg.pFooterBackgroundColor + ";";
    s += "  position: absolute;";
    s += "  bottom: 0;";
    s += "  left: 0;";
    s += "  right: 0;";
    s += "  height: " + cfg.pFooterHeightPixels + "px;";
    s += "}";


    /** Header specific **/
    s += "#jbi_headerTitle{";
    s += "  line-height: " + cfg.pHeaderHeightPixels + "px;";
    s += "  font-size: " + cfg.pHeaderFontSizePixels + "px;";
    s += "  font-family: Futura, 'Trebuchet MS', Arial, sans-serif;";
    s += "  font-weight: bold;";
    s += "  overflow: hidden;";
    s += "  text-align:left;";
    s += "  position:absolute;";
    s += "  left: " + cfg.pHeaderTitleXPosition + "px;";
    s += "  top: " + cfg.pHeaderTitleYPosition + "px;";
    s += "}";
    s += "#jbi_headerLogo{";
    s += "  width: " + cfg.pHeaderLogoWidthPixels + "px;";
    s += "  height: " + cfg.pHeaderLogoHeightPixels + "px;";
    s += "  position:absolute;";
    s += "  top: " + cfg.pHeaderLogoYPosition + "px;";
    s += "  left: " + cfg.pHeaderLogoXPosition + "px;";
    s += "  display: " + cfg.pHeaderLogoEnabled + ";";
    s += "}";
    s += "#jbi_pdf{";
    s += "  display: " + cfg.pPdfEnabled + ";";
    s += "  position: absolute;";
    s += "  color: " + cfg.pPdfFontColor + ";";
    s += "  font-size: " + cfg.pPdfFontSize + ";";
    s += "  top: " + cfg.pPdfPositionTop;
    s += "  right: " + cfg.pPdfPositionRight + ";";
    s += "  bottom: " + cfg.pPdfPositionBottom + ";";
    s += "  left: " + cfg.pPdfPositionLeft + ";";
    s += "}";

    /** Menu specific **/
    s += "#jbi_menu nav {";
    s += "  overflow: hidden;";
    s += "  text-align: left;";
    s += "}";

    s += "#jbi_menu nav > ul {";
    s += "  list-style-type: none;";
    s += "  display: inline-block;";
    s += "  margin: 0;";
    s += "  padding: 0;";
    s += "}";

    s += "#jbi_menu nav > ul > li {";
    s += "  display: inline-block;";
    s += "  border-right-width: 1px;";
    s += "  border-right-color: lightgrey;";
    s += "  border-right-style: none;";
    s += "}";

    s += "#jbi_menu > nav > ul > li .menuActive{";
    s += "  background-color: " + cfg.pMenuItemBackgroundSelected + "  !important;";
    s += "  color: " + cfg.pMenuItemTextSelected + " !important;";
    s += "  cursor: default;";
    s += "}";

    s += "#jbi_menu nav > ul > li > a {";
    s += "  padding-left: 15px;";
    s += "  padding-right: 15px;";
    s += "  background-color: " + cfg.pMenuItemBackgroundUnselected + ";";
    s += "  color: " + cfg.pMenuItemTextUnselected + ";";
    s += "  display: block;";
    s += "  font-size: " + cfg.pMenuItemFontSize + "px;";
    s += "  font-weight: 500;";
    s += "  height: " + cfg.pMenuHorizontalMenuHeightPixels + "px;";
    s += "  line-height: " + cfg.pMenuHorizontalMenuHeightPixels + "px;";
    s += "  text-decoration: none;";
    s += "  font-family : " + cfg.pDashboardFontFamily + ";";
    s += "  -webkit-user-select: none;";
    s += "  -moz-user-select: none;";
    s += "  -ms-user-select: none;";
    s += "}";
    if (!my.isMobile) {
      s += "#jbi_menu nav > ul > li > a:not(.menuActive):hover {";
      s += "  cursor: pointer;";
      s += "  background-color: " + cfg.pMenuItemBackgroundHover + ";";
      s += "  color: " + cfg.pMenuItemTextHover + ";";
      s += "}";
    }
    s += "#jbi_menu > nav > ul > li > a > i{";
    s += "  display : " + cfg.pMenuItemIconDisplay + ";";
    s += "}";


    /** Filter Icons and Content specific **/
    s += "#jbi_filter_iconsitems .filterActive{";
    s += "  background-color: white;";
    s += "}";

    s += "#jbi_filter_iconsitems > ul{";
    s += "  list-style-type: none;";
    s += "  margin: 0;";
    s += "  padding: 0;";
    s += "  display: inline;";
    s += "}";

    s += "#jbi_filter_iconsitems > ul > li{";
    s += "  display: inline-block;";
    s += "  width: 24px;";
    s += "  height: 24px;";
    s += "  line-height: 24px;";
    s += "  text-align: center;";
    s += "  font-size: 16px;";
    s += "  padding-left: 3px;";
    s += "  padding-right: 3px;";
    s += "  cursor: pointer;";
    s += "}";
    if (!my.isMobile) {
      s += "#jbi_filter_iconsitems > ul > li:hover{";
      s += "  background-color: white;";
      s += "}";
    }
    s += "#jbi_content{";
    s += "  position: absolute;";
    s += "  bottom: " + cfg.pFooterHeightPixels + "px;";
    s += "  left :0px;";
    s += "  top : 26px;";
    s += "  right: 0;";
    s += "  overflow: auto;";
    s += "}";


    /** Top Filter Pane (top of report) specific **/
    s += "#jbi_filter_toppane .click-nav{";
    s += "  display: inline-block;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav ul{";
    s += "  position:relative;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav ul .clicker{";
    s += "  color : " + cfg.pFilterTopPaneDropdownSelectedFontColor + ";";
    s += "  height: " + cfg.pFilterTopPaneDropdownHeightPixels + "px;";
    s += "  line-height: " + cfg.pFilterTopPaneDropdownHeightPixels + "px;";
    s += "  text-align: center;";
    s += "  font-family: " + cfg.pDashboardFontFamily + ";";
    s += "  font-weight: " + cfg.pFilterTopPaneDropdownSelectedFontWeight + ";";
    s += "  font-size : " + cfg.pFilterTopPaneDropdownSelectedFontSizePixels + "px;";
    s += "  background-color: " + cfg.pFilterTopPaneDropdownSelectedBackgroundColor + ";";
    s += "  white-space: nowrap;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav ul li span{";
    s += "  padding-left: 5px;";
    s += "  padding-right: 20px;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav ul li{";
    s += "  position:relative;";
    s += "  list-style:none;";
    s += "  cursor:pointer;";
    s += "  border-style: solid;";
    s += "  border-color: " + cfg.pFilterTopPaneDropdownBorderColor + ";";
    s += "  border-width: " + cfg.pFilterTopPaneDropdownBorderWidth + "px;";
    s += "}";
    if (!my.isMobile) {
      s += "#jbi_filter_toppane .click-nav ul .clicker:hover,";
      s += "#jbi_filterpane .click-nav ul .active {";
      s += "  background:" + cfg.pFilterTopPaneDropdownHoverBackgroundColor + ";";
      s += "  color:" + cfg.pFilterTopPaneDropdownHoverFontColor + ";";
      s += "}";
    }
    s += "#jbi_filter_toppane .click-nav ul li span{";
    s += "  display:block;";
    s += "  line-height:40px;";
    s += "  background: " + cfg.pFilterTopPaneDropdownItemBackgroundColor + ";";
    s += "  color:#333;";
    s += "  text-decoration:none;";
    s += "  font-size: 11px;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav ul li ul {";
    s += "  position:absolute;;";
    s += "  z-index: 999999;";
    s += "  padding:0;";
    s += "  text-align : left;";
    s += "  border-style: solid;";
    s += "  border-color: " + cfg.pFilterTopPaneDropdownBorderColor + ";";
    s += "  border-width: " + cfg.pFilterTopPaneDropdownBorderWidth + "px;";
    s += "  display: table;";
    s += "  left: -2px;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav ul li ul li {";
    s += "  border: none;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav ul li ul li span{";
    s += "  padding-left: 10px;";
    s += "  font-family: " + cfg.pDashboardFontFamily + ";";
    s += "  font-size: " + cfg.pFilterTopPaneDropdownItemFontSizePixels + "px;";
    s += "  color:  " + cfg.pFilterTopPaneDropdownItemFontColor + ";";
    s += "  white-space: pre;";
    s += "  overflow: hidden;";
    s += "  text-overflow: ellipsis;";
    s += "}";
    if (!my.isMobile) {
      s += "#jbi_filter_toppane .click-nav ul li span:hover {";
      s += "  background:" + cfg.pFilterTopPaneDropdownItemHoverBackgroundColor + ";";
      s += "  color:" + cfg.pFilterTopPaneDropdownItemHoverFontColor + ";";
      s += "}";
    }
    s += "#jbi_filter_toppane .click-nav .no-js{";
    s += "  padding:0;margin:0;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav .js{";
    s += "  padding:0;margin:0;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav .no-js ul {";
    s += "  display:none;";
    s += "}";
    if (!my.isMobile) {
      s += "#jbi_filter_toppane .click-nav .no-js:hover ul{ ";
      s += "  display:table;";
      s += "}";
    }
    s += "#jbi_filter_toppane .click-nav ul li i {";
    s += "  text-align: right;";
    s += "  right: 7px;";
    s += "  position: absolute;";
    s += "  line-height: 30px;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav ul li ul li.filterDisabled span{";
    s += "  color: " + cfg.pFilterTopPaneDropdownItemDisabledFontColor + ";";
    s += "  background-color: " + cfg.pFilterTopPaneDropdownItemDisabledBackgroundColor + ";";
    s += "  cursor: default;";
    s += "}";

    // Business hierarchy
    s += "#jbi_businesses_wrapper {";
    s += "top: 70px;";
    s += "bottom: 0;";
    s += "position: absolute;";
    s += "border-right: " + cfg.pFilterLeftPaneBorderRight + ";";
    s += "width: " + cfg.pFilterLeftPaneWidthPixels + "px;";
    s += "font-family: " + cfg.pDashboardFontFamily + ";";
    s += "font-size: 12px;";
    //s += "overflow: hidden;";
    //s += "overflow-y: auto;";
    s += "}";

    s += "#jbi_businesses {";
    s += "top: 0px;";

    if (!my.isMobile) {
      s += "bottom: 0px;";
    } else {
      s += "bottom: 50px;";
    }
    s += "position: absolute;";
    s += "width: " + cfg.pFilterLeftPaneWidthPixels + "px;";
    s += "overflow: hidden;";
    s += "overflow-y: auto;";
    s += "}";

    s += "#jbi_businesses > ul {";
    s += "  display: " + cfg.pFilterLeftPaneEnabled + ";";
    s += "}";

    // Container settings
    s += ".containerContent .message-placeholder{";
    s += "  display: table;";
    s += "  width: 100%;";
    s += "  height: 100%;";
    s += "  min-height: 100px;";
    s += "}";
    s += ".containerContent .message{";
    s += "  display:table-cell;";
    s += "  vertical-align: middle;";
    s += "  font-family: " + cfg.pDashboardFontFamily + ";";
    s += "  font-size: " + cfg.pContainerMessageFontSizePixels + "px;";
    s += "  text-align: center;";
    s += "  color: " + cfg.pContainerMessageDefaultFontColor + ";";
    s += "}";
    s += ".containerContent .message.error{";
    s += "    color: " + cfg.pContainerMessageErrorFontColor+ "!important;";
    s += "}";
    s += ".containerContent .message.warning{";
    s += "    color: " + cfg.pContainerMessageWarningFontColor + "!important;";
    s += "}";
    s += ".container-footer{";
    s += "    margin: 1px 2px 1px; 2px";
    s += "    height: " + cfg.pContainerFooterHeightPixels + "px;";
    s += "    line-height: " + cfg.pContainerFooterHeightPixels + "px;";
    s += "    position: relative;";
    s += "    overflow: auto;";
    s += "    font-family: " + cfg.pDashboardFontFamily + ";";
    s += "    border: 1px solid #D8D8D8;";
    s += "    padding-left: 6px;";
    s += "    font-style: italic;";
    s += "    background-color: " + cfg.pContainerFooterBackgroundColor + ";";
    s += "    color: " + cfg.pContainerFooterFontColor + ";";
    s += "    font-size: " + cfg.pContainerFooterFontSizePixels + "px;";
    s += "}";
    s += ".container-title{";
    s += "    left: 0;";
    s += "    right: 0;";
    s += "    top: 0;";
    s += "    height: " + cfg.pContainerTitleHeightPixels + "px;";
    s += "    line-height: " + + cfg.pContainerTitleHeightPixels + "px;";
    s += "    position: relative;";
    s += "    background-color: " + cfg.pContainerTitleBackgroundColor + ";";
    s += "    color: " + cfg.pContainerTitleFontColor + ";";
    s += "    font-size: " + cfg.pContainerTitleFontSizePixels + "px;";
    s += "    padding-left : 5px;";
    s += "    font-family: " + cfg.pDashboardFontFamily + ";";
    s += "    text-align:" + cfg.pContainerTitleTextAlign + ";";
    s += "    font-weight:" + cfg.pContainerTitleFontWeight + ";";
    s += "}";
    s += ".container-content-box{";
    s += "   position: relative;";
    s += "   border-style: " + cfg.pContainerBorderStyle + ";";
    s += "   border-width: " + cfg.pContainerBorderWidthPixels + "px;";
    s += "   border-color: " + cfg.pContainerBorderColor + ";";
    s += "}";

    /** hide the layout border in case the filter icon is not required **/
    if (cfg.pFilterIconsEnabled === "none") {
      s += ".layoutContent{";
      s += "  border: 0px solid white !important;";
      s += "}";
    }


    /** Overall **/
    s += ".customtable p {";
    s += "  margin: 0;";
    s += "  padding: 0;";
    s += "}";
    s += ".containerComment p{";
    s += "  margin: 0;";
    s += "  padding: 0;";
    s += "}";
    s += "#jbi_comment_text p{";
    s += "  margin: 0;";
    s += "  padding: 0;";
    s += "}";
    s += ".containerContent p{";
    s += "  margin: 0;";
    s += "  padding: 0;";
    s += "}";

    s += ".ui-jqgrid > .ui-jqgrid-view {";
    s += "  font-family : " + cfg.pDashboardFontFamily  + "!important;";
    s += "}";

    if (my.isMobile) {
      s += "body {";
    } else {
      s += ".noselect {";
    }
    s += "  -webkit-touch-callout: none;";
    s += "  -webkit-user-select: none;";
    s += "  -khtml-user-select: none;";
    s += "  -moz-user-select: none;";
    s += "  -ms-user-select: none;";
    s += "  user-select: none;";
    s += "}";
    s += "svg{";
    s += "overflow:visible !important;";
    s += "}";
    s += ".highcharts-container{";
    s += "overflow:visible !important;";
    s += "}";



    s += "</style>";


    // Add the CSS to the head of the HTML page
    $(s).appendTo("head");
  }


  function setHTML(elementId, cfg) {

    // check if the period is known
    var customConfig = $("body").data("customConfig"),
      periodName = "";
    if (customConfig.CONFIG && customConfig.CONFIG.period && customConfig.CONFIG.period.long) {
      periodName = customConfig.CONFIG.period.long;
    }

//@formatter:off
        var s = "";
        s += "<div id=\"jbi_container\">";
          s += "<div id=\"jbi_app\">";
            s += "<div id=\"jbi_header\">";
              s += "<img id='jbi_headerLogo' src='" + shell.app.execdb.dashboard._getLogoBase64() + "'>";
              s += "<div id=\"jbi_headerTitle\">" + cfg.pHeaderTitle + "</div>";
            s += "</div>";
            s += "<div id=\"jbi_pdf\"></div>";
            s += "<div id=\"jbi_menu\"></div>";
            s += "<div id=\"jbi_period\">" + periodName + "</div>";
            if (cfg.pHeaderSubTitleEnabled) {
                s += "<div id=\"jbi_sub_title\">" + cfg.pHeaderSubTitleContent + "</div>";
            }
            s += "<div id=\"jbi_businesses_wrapper\">";
              s += "<div id=\"jbi_businesses\"></div>";
            s += "</div>";
            s += "<div id=\"jbi_filter_icons\">";
              s += "<div id=\"jbi_filter_iconsitems\"><ul id='jbi_filter_8'><li class=\"filterActive\"><i class=\"fa fa-server\"></i></li><li><i class=\"fa fa-bar-chart\"></i></li><li><i class=\"fa fa-table\"></i></li></ul><ul id='jbi_filter_9'><li class=\"filterActive\"><i class=\"fa fa-server\"></i></li><li><i class=\"fa fa-bar-chart\"></i></li><li><i class=\"fa fa-table\"></i></li></ul></div>";
              s += "<div id=\"jbi_content\"></div>";
            s += "</div>";
            s += "<div id=\"jbi_filter_toppane\"></div>";
            s += "<div id=\"jbi_comment\"></div>";
            s += "<div id=\"jbi_footer\"></div>";
          s += "</div>";
        s += "</div>";
//@formatter:on
    $("#" + elementId).html(s);
  }

  return my;

}(shell.app.execdb.dashboard));

//####src/execdb/dashboard/mod_specific_logic.js
shell.app.execdb.dashboard = ( function (my) {

  my._specific = {

    charts: {

      /**
       * MI LaunchPad - Stacked bar tooltip & data label
       *
       * @param chartConfig
       */
      birdy_stack: function(chartConfig) {

        // add the specific Birdy Stacked logic
        // tooltip formatter
        chartConfig.tooltip = chartConfig.tooltip || {};
        chartConfig.tooltip.formatter = function () {
          return '<b>' + this.x + '</b>' + '<br/>' + this.series.name + ': ' + (chartConfig["custom"]["uom_prefix"] ? chartConfig["custom"]["uom_prefix"] : "") + Highcharts.numberFormat(this.y, 0) + (chartConfig["custom"]["uom_suffix"] ? chartConfig["custom"]["uom_suffix"] : "") + '<br>' + chartConfig.custom.periodText;
        };

        // stacklabels formatter
        chartConfig.yAxis = chartConfig.yAxis || {};
        chartConfig.yAxis.stackLabels = chartConfig.yAxis.stackLabels || {};
        chartConfig.yAxis.stackLabels.formatter = function () {

          var stackItem = this,
            allStacks = stackItem.axis.stacks;

          for (var key in allStacks) {
            if (allStacks.hasOwnProperty(key)) {
              if (allStacks[key][stackItem.x] == stackItem) {
                var oppositeKey = stackItem.isNegative ? key.slice(1) : '-' + key,
                  oppositeItem = allStacks[oppositeKey] && allStacks[oppositeKey][stackItem.x];

                if (oppositeItem === undefined) {
                  if (stackItem.total !== 0.0) {
                    return (chartConfig["custom"]["uom_prefix"] ? chartConfig["custom"]["uom_prefix"] : "") + Highcharts.numberFormat(stackItem.total, 0) + (chartConfig["custom"]["uom_suffix"] ? chartConfig["custom"]["uom_suffix"] : "");
                  }
                } else {
                  var sum = stackItem.total + oppositeItem.total;
                  if (stackItem.isNegative ^ sum > 0) {
                    return (chartConfig["custom"]["uom_prefix"] ? chartConfig["custom"]["uom_prefix"] : "") + Highcharts.numberFormat(sum, 0) + (chartConfig["custom"]["uom_suffix"] ? chartConfig["custom"]["uom_suffix"] : "");
                  }
                }
              }
            }
          }
        };

        return chartConfig;
      },

        /**
         * Environment Chart - X-axis logic
         * The chart displays months, but the xAxis should show quarters. Besides
         * that, the periods that need to be shown in the chart depend on the
         * period that is reported on.
         * @param chartConfig
         * @returns {*}
         */
      environment_logic: function (chartConfig) {
        chartConfig.xAxis = chartConfig.xAxis || {};
        chartConfig.xAxis.labels = chartConfig.xAxis.labels || {};
        chartConfig.xAxis.labels.formatter = function () {
          if (!this.value || typeof this.value.substring !== "function") {
            return null;
          }

          // Latest Estimates
          // just show the result of the query
          if (this.value.substring(0, 2) === "LE") {
            return this.value;
          }

          // Current Period
          // The way the labels for the months need to be displayed
          // depends on the period for which the dashboard is running
          // This period is not returned by the formatter callback
          // function directly and needs to be looked up from the
          // chart configuration
          var currentPeriod = this.chart.options.custom.period.label,
            currentMonth = currentPeriod.substring(0, 3),
            currentYear = currentPeriod.substring(4),
            monthTypes = {
              m1: ["JAN", "APR", "JUL", "OCT"],
              m2: ["FEB", "MAY", "AUG", "NOV"],
              m3: ["MAR", "JUN", "SEP", "DEC"]
            },
            monthType;
          if (monthTypes.m1.indexOf(currentMonth) > -1) {
            monthType = "m1";
          } else if (monthTypes.m2.indexOf(currentMonth) > -1) {
            monthType = "m2";
          } else {
            monthType = "m3";
          }

          // Month logic
          // Instead of the month label, the quarter should be shown. Meaning
          // that January should be empty, but February should show 2017-Q1. Then
          // March and April empty, but May shown as "Q2".
          // However, this is only valid for quarters that have data for each
          // month. Thus if the last month in the chart is of type m2 (e.g. FEB),
          // then the last two months should be displayed with the month text:
          // thus 2017-JAN and FEB

          // get the month for the current label
          var monthText = this.value.substring(0, 3).toUpperCase(),
            yearText = this.value.substring(4);

          // Month 1: check if label is for current period
          // check if the current label is either the current period (because the
          // Month needs to be displayed in that case instead of the quarter).
          if (monthType === "m1") {
            if (monthText === currentMonth && yearText === currentYear) {

              // only show the year in front of the month for January
              if (monthText === "JAN") {
                return currentYear + "-" + monthText;
              }
              return monthText;
            }
          }


          // Month 2: check if label is for current or previous period
          // check if the current label is either the current period or the
          // previous period (because the Month needs to be displayed in that
          // case instead of the quarter).
          if (monthType === "m2") {
            var previousPeriod = monthTypes.m1[monthTypes.m2.indexOf(currentMonth)];
            if ((monthText === previousPeriod
              || monthText === currentMonth)
              && yearText === currentYear) {

              // only show the year in front of the month for January
              if (monthText === "JAN") {
                return currentYear + "-" + monthText;
              }
              return monthText;
            }
          }


          // Months logic
          // instead of showing the labels for each month, the report should display
          // the quarters. Meaning: JAN 2017 should not display any label on the X-Axis,
          // but FEB 2017 should show '2017-Q1'. Then march and april should show
          // nothing again, but may should be 'Q2'.
          var quarterMonths = ["FEB", "MAY", "AUG", "NOV"],
            monthQuarterIndex = quarterMonths.indexOf(monthText);
          if (monthQuarterIndex > -1) {
            if (monthQuarterIndex === 0) {
              return yearText + " - Q1";
            }

            // check if this is the first quarter that needs to be displayed in the chart
            for (var i = 0; ( i < this.axis.categories.length && i < 3); i++) {
              if (this.axis.categories[i] === this.value) {
                return yearText + " - Q" + (monthQuarterIndex + 1);
              }
            }

            return "Q" + (monthQuarterIndex + 1);
          }

          // All other cases should not return a label
          return null;
        };

        return chartConfig;
      }
    }

  };


  return my;

}(shell.app.execdb.dashboard));

//####src/execdb/dashboard/mod_table.js
shell.app.execdb.dashboard = ( function (my) {

  /**
   * Generates table
   *
   * This is a generic function that is used to generate the HTML for a table
   *
   * @param containerDiv   the ID of the HTML div element in which the object
   *                       needs to be rendered
   * @param config         the configuration settings for the bullet chart
   * @param dataId         the ID of the data for the object
   * @param businessData   the data for the selected business
   */
  my._createTable = function (containerDiv, config, dataId, businessData) {
    if (!dataId) {
      return;
    }

    // get the data
    var $body = $("body"),
      customConfig = $body.data("customConfig"),
      dataset = [];
    if (customConfig && businessData && businessData.kpis && dataId) {

      // split the kpis
      var kpis = dataId.split(";");
      for (var i = 0; i < kpis.length; i++) {
        var kpi = kpis[i];

        // check for specific configuration settings
        // config string is build up like 100.01[{'text':'abc'}]
        // find the [ and the ] character in the string to see if a configuration setting exist
        var startConfigIndex = kpi.indexOf("[");
        var endConfigIndex = kpi.lastIndexOf("]");
        var kpiConfig = {};
        if ( (startConfigIndex > -1) && (endConfigIndex > -1)) {
          var cfgString = kpi.substring(startConfigIndex + 1, endConfigIndex);
          kpi = kpi.substring(0, startConfigIndex);
          try{
            kpiConfig = JSON.parse(cfgString)
          } catch(err) {
            console.error("Unable to parse configuration string for kpi " + kpi)
          }
        }

        // the ++ indicate the children which will be processed later
        if (kpi === "++") {
          continue;
        }

        // try to read the dataset
        if (kpi === "EMPTY") {
          dataset.push({
            Group: ''
          });

        } else if (businessData.kpis[kpi] && businessData.kpis[kpi].data) {
          dataset.push($.extend({}, businessData.kpis[kpi].data, true));

          // check if the children need to be displayed
          if (i < kpis.length && kpis[i + 1] === '++') {

            // check if the child needs to be hidden due to configuration settings
            var hideChildren = config["HideChildren"] ? config["HideChildren"].split(";") : [];

            dataset[dataset.length - 1].Group = businessData.text;

            // get the children
            var businessDatasets = $body.data("customDataApp").datasets;
            var nodeInfo = $("#jbi_businesses").jstree().get_node(businessData.id);
            if (nodeInfo && nodeInfo.children && nodeInfo.children.length) {
              for (var y = 0; y < nodeInfo.children.length; y++) {

                // check if child is in the 'to hide' table
                if (hideChildren.indexOf(nodeInfo.children[y]) > -1) {
                  continue;
                }

                // check if there is data for the child
                var childKpis = businessDatasets[nodeInfo.children[y]];
                if (childKpis.kpis && childKpis.kpis[kpi] && childKpis.kpis[kpi].data){
                  dataset.push($.extend({}, childKpis.kpis[kpi].data, true));
                } else {
                  dataset.push({})
                }

                dataset[dataset.length - 1].Group = "   " + childKpis.text;
              }
            }
          }
        }
      }
    }


    // fill an array with the column information
    var columnConfig = getColumnConfiguration(config, dataset);
    if (columnConfig.error) {
      $body.trigger("showContainerMessage", {
        container: containerDiv,
        message: columnConfig.message,
        type: columnConfig.message_type
      });
      return;
    }

    if (!columnConfig.error) {
      addCSS(containerDiv, config, columnConfig);
      addHTML(containerDiv, config, columnConfig, dataset);
    }


    function getColumnConfiguration(config, dataset) {
      if (!config || !config["DataPoints"]) {
        return {
          error: true,
          message: "No configuration for datapoints set.",
          message_type: "E"
        };
      }

      // make sure that data is available
      var dataAvailable = false;
      if (dataset && dataset.length) {
        for (var rowIndex=0; rowIndex<dataset.length; rowIndex++) {
          var rowObject = dataset[rowIndex];
          for (var columnName in rowObject) {
            if (rowObject.hasOwnProperty(columnName)) {
              if (columnName !== "Group") {
                dataAvailable = true;
                break;
              }
            }
          }
          if (dataAvailable) {
            break;
          }
        }
      }
      if (!dataAvailable) {
        return {
          error: true,
          message: "No data available.",
          message_type: "W"
        };
      }

      // determine which periods are valid for the current month
      var periodSettings = JSON.parse(config["DataPoints"]);
      var currentPeriod = my.period_functions.getCurrentPeriod().periodShortName;
      var columnConfig = {};
      for (i=0; i<periodSettings.length; i++) {
        if (periodSettings[i].months.indexOf(currentPeriod) > -1) {
          columnConfig = periodSettings[i];
          break;
        }
      }

      return columnConfig;
    }


    /**
     * Generates the CSS for table
     *
     * The CSS settings are provided via the configuration. CSS can be set for an
     * entire table, a table column, a table row or a specific table cell.
     * This function generates a CSS string which will then be added to the header
     * of the document.
     *
     * @param containerDiv   the ID of the HTML div element in which the object
     *                       needs to be rendered
     * @param config         the total configuration object
     * @param columnConfig   an object holding the configuration settings for the
     *                       columns
     */
    function addCSS(containerDiv, config, columnConfig) {

      // the CSS is provided in the settings
      if (!config || !config.settings || !config.settings.length) {
        return;
      }

      // create the CSS string
      var s = "";
      s += "<style type='text/css' id='CSS_TABLE_" + containerDiv + "' data-group='LAYOUT' data-repstyle='execdb'>";

      for (var i = 0; i < config.settings.length; i++) {

        // check if a CSS setting is provided
        if (config.settings[i].css !== undefined && config.settings[i].css !== null) {

          // settings per row
          var className = "";

          if (config.settings[i].rowIndex !== undefined &&
            config.settings[i].colIndex === undefined) {
            if (config.settings[i].rowIndex === "*") {
              className += " tr";
            } else if (config.settings[i].rowIndex === "{odd}") {
              className += " tr:nth-child(odd)";
            } else if (config.settings[i].rowIndex === "{even}") {
              className += " tr:nth-child(even)";
            } else if (config.settings[i].rowIndex === "{hover}") {
              if (my.isMobile) {
                continue;
              }
              className += " tr:hover";
            } else if (config.settings[i].rowIndex === 0) {
              className += " th";
            } else if (("" + config.settings[i].rowIndex).indexOf(",") > -1) {
              var strIndices = config.settings[i].rowIndex.split(",");
              var strClasses = [];
              for (y = 0; y < strIndices.length; y++) {
                strClasses.push(className + " .tr" + strIndices[y]);
              }
              className = strClasses.join();
            } else {
              className += " .tr" + config.settings[i].rowIndex;
            }
          }

          // settings per column
          if (config.settings[i].colIndex !== undefined &&
            config.settings[i].rowIndex === undefined) {
            if (config.settings[i].colIndex === "*") {
              className += " td";
            } else if (config.settings[i].colIndex === "{odd}") {
              className += " td:nth-child(odd)";
            } else if (config.settings[i].colIndex === "{even}") {
              className += " td:nth-child(even)";
            } else if (config.settings[i].colIndex === "{hover}") {
              if (my.isMobile) {
                continue;
              }
              className += " tr:hover";
            } else if (config.settings[i].colIndex.length && config.settings[i].colIndex.indexOf("<") === 0 && config.settings[i].colIndex.indexOf(">") === config.settings[i].colIndex.length - 1) {

              // get the source column by name and find the index of this column
              var sourceColumn = config.settings[i].colIndex.substring(1, config.settings[i].colIndex.length - 1),
                sourceColumnIndex = -1;
              if (columnConfig["displayColumns"] && columnConfig["displayColumns"].length) {
                sourceColumnIndex = columnConfig["displayColumns"].indexOf(sourceColumn);
                if (sourceColumnIndex > -1) {
                  className += " .td" + (sourceColumnIndex + 1);
                }
              }

            } else if (("" + config.settings[i].colIndex).indexOf(",") > -1) {
              strIndices = config.settings[i].colIndex.split(",");
              strClasses = [];
              for (y = 0; y < strIndices.length; y++) {
                strClasses.push(className + " .td" + strIndices[y]);
              }
              className = strClasses.join();
            } else {
              className += " .td" + config.settings[i].colIndex;
            }
          }

          // setting per cell
          if (config.settings[i].colIndex !== undefined &&
            config.settings[i].rowIndex !== undefined) {

            var arrCols = [],
              arrRows = [],
              arrCells = [];

            // get the columns
            if (config.settings[i].colIndex === "*") {
              arrCols.push(" td");
            } else if (config.settings[i].colIndex === "{odd}") {
              arrCols.push(" td:nth-child(odd)");
            } else if (config.settings[i].colIndex === "{even}") {
              arrCols.push(" td:nth-child(even)");
            } else if (("" + config.settings[i].colIndex).indexOf(",") > -1) {
              strIndices = config.settings[i].colIndex.split(",");
              for (y = 0; y < strIndices.length; y++) {
                arrCols.push(" .td" + strIndices[y]);
              }
            } else {
              arrCols.push(" .td" + config.settings[i].colIndex);
            }

            // get the rows
            if (config.settings[i].rowIndex === "*") {
              arrRows.push(" tr");
            } else if (config.settings[i].rowIndex === "{odd}") {
              arrRows.push(" tr:nth-child(odd)");
            } else if (config.settings[i].rowIndex === "{even}") {
              arrRows.push(" tr:nth-child(even)");
            } else if (("" + config.settings[i].rowIndex).indexOf(",") > -1) {
              strIndices = config.settings[i].rowIndex.split(",");
              for (y = 0; y < strIndices.length; y++) {
                arrRows.push(" .tr" + strIndices[y]);
              }
            } else {
              arrRows.push(" .tr" + config.settings[i].rowIndex);
            }

            // generate the css per cell
            for (var c = 0; c < arrCols.length; c++) {
              for (var r = 0; r < arrRows.length; r++) {
                arrCells.push(className + arrRows[r] + arrCols[c]);
              }
            }

            className = arrCells.join();
          }


          // setting for entire table
          if (( config.settings[i].colIndex === undefined )
            && ( config.settings[i].rowIndex === undefined )) {
            //className += " .customtable";
          }

          // add the style
          s += "#" + containerDiv + " .customtable " + className + "{" + config.settings[i].css + "}";
        }
      }
      s += "</style>";
      $(s).appendTo("head");
    }

    /**
     * Generates the HTML for the table header
     *
     * The labels used in the header are provided either via the configuration settings
     * or (if not provided via the configuration) via the BEx query. The BEx query is
     * using text-variables in order to set the correct month names.
     *
     * @param columnConfig      an object holding the configuration settings for the
     *                          columns
     * @return {String}         a HTML string holding the table header
     */
    function getHTMLTableHeaderRow(columnConfig) {

      var columnHeaderLabels = [],
        i,
        html;

      if (!columnConfig || !columnConfig["displayColumns"]) {
        return "";
      }

      // get the column header labels
      for (i = 0; i < columnConfig["displayColumns"].length; i++) {

        // if a predefined headerLabel is defined in the configuration, use this
        if (columnConfig["HeaderText"] && columnConfig["HeaderText"][i]) {
          columnHeaderLabels.push(columnConfig["HeaderText"][i]);
          continue;
        }

        // if a SourceColumn is defined in the configuration, get the header label from the
        // BEx query (via the headerLabels)
        if (columnConfig["displayColumns"][i]) {

          // lookup the label for the source column
          var bexHeaderLabel = my.period_functions.getPeriodIdentifierLabel(columnConfig["displayColumns"][i]);
          if (bexHeaderLabel === columnConfig["displayColumns"][i]) {
            bexHeaderLabel = "";
          }

          // because the lack of space, trim the header line before the year
          if (bexHeaderLabel !== "") {
            if (isNaN(parseInt(bexHeaderLabel.substr(( bexHeaderLabel.length - 4 ))))) {
              columnHeaderLabels.push(bexHeaderLabel);
            } else {
              columnHeaderLabels.push(bexHeaderLabel.substr(0, bexHeaderLabel.length - 5).trim() + "<br>" + bexHeaderLabel.substr(bexHeaderLabel.length - 5).trim());
            }
            continue;
          }
        }

        // in case the headerlabel is not provided in the configuration and not as SourceColumn, add an empty line
        columnHeaderLabels.push("");
      }

      // generate the HTML
      html = "<tr class='tr0'>";
      for (i = 0; i < columnHeaderLabels.length; i++) {
        html += "<th class='td" + (i + 1 ) + "'>" + columnHeaderLabels[i] + "</th>";
      }
      html += "</tr>";

      return html;
    }


    /**
     * Generates the HTML for the table contents
     *
     * The labels used in the header are provided either via the configuration settings
     * or (if not provided via the configuration) via the BEx query. The BEx query is
     * using text-variables in order to set the correct month names.
     *
     * @param config            the configuration for the entire object
     * @param columnConfig      an object holding the configuration settings for the
     *                          columns
     * @param dataset           the resultset of the BEx query
     * @return {String}         a HTML string holding the table contents
     */
    function getHTMLTableContent(config, columnConfig, dataset) {

      var rows = [],
        row,
        col,
        html = "",
        cell,
        i;

      if (!dataset || !dataset.length) {
        return html;
      }

      // get the metadata for the cells
      for (row = 0; row < dataset.length; row++) {
        var cols = [];

        for (col = 0; col < columnConfig["displayColumns"].length; col++) {
          cell = {
            label: "",
            raw: null,
            classes: ["tr" + (row + 1), "td" + (col + 1)],
            attr: []
          };

          if (columnConfig["displayColumns"][col]
            && dataset[row][columnConfig["displayColumns"][col]] !== undefined
            && dataset[row][columnConfig["displayColumns"][col]] !== null) {

            cell.label = dataset[row][columnConfig["displayColumns"][col]];
            cell.raw = dataset[row][columnConfig["displayColumns"][col]];

          } else {
            cell.classes.push("emptycell");

            /** SHELL LOGIC --> SHOW N/A in case label is empty, but group is populated **/
            if (dataset[row].Group !== "") {
              cell.label = "N/A";
            }
          }


          cols.push(cell);
        }
        rows.push(cols);
      }

      // apply the formatters
      rows = applyFormatters(config, rows, columnConfig);


      // generate the HTML
      for (row = 0; row < rows.length; row++) {
        html += "<tr class='tr" + (row + 1 ) + "'>";
        for (col = 0; col < rows[row].length; col++) {

          cell = rows[row][col];

          // add the classes
          html += "<td class='";
          for (i = 0; i < cell.classes.length; i++) {
            if (i > 0)
              html += " ";

            html += cell.classes[i];
          }
          html += "'";

          // add the attributes
          for (i = 0; i < cell.attr.length; i++) {
            html += " " + cell.attr[i].name + "='" + cell.attr[i].value + "'";
          }

          // add the text
          html += ">" + cell.label + "</td>";
        }
        html += "</tr>";
      }

      return html;
    }


    /**
     * Apply the correct format on the values in the tables
     *
     * Sets the correct format of the values in the table. The required formats are provided
     * via the configuration. Via a format function (see data handler) the values are
     * formatted.
     *
     * @param config            the configuration for the entire object
     * @param dataset           the cell meta data with the raw value
     * @param columnConfig      an object holding the configuration settings for the
     *                          columns
     * @return                  the cell meta data with the formatted value
     */
    function applyFormatters(config, dataset, columnConfig) {

      var i,
        row,
        col,
        columnIndex,
        sourceColumn;

      if (!config || !config.settings || !config.settings.length) {
        return dataset;
      }

      for (i = 0; i < config.settings.length; i++) {
        if (config.settings[i].format !== undefined) {

          var cellValue;

          // apply the formatter on a specific cell
          if (config.settings[i].rowIndex !== undefined
            && config.settings[i].rowIndex !== null
            && config.settings[i].colIndex !== undefined
            && config.settings[i].colIndex !== null) {


            // check if the columnIndex should be retrieved based on the sourceColumn name
            columnIndex = -1;
            if (config.settings[i].colIndex.length && config.settings[i].colIndex.indexOf("<") === 0 && config.settings[i].colIndex.indexOf(">") === config.settings[i].colIndex.length - 1) {

              // get the source column by name and find the index of this column
              sourceColumn = config.settings[i].colIndex.substring(1, config.settings[i].colIndex.length - 1);
              if (columnConfig && columnConfig["displayColumns"] && columnConfig["displayColumns"].length) {
                columnIndex = columnConfig["displayColumns"].indexOf(sourceColumn);
              }
            } else {
              columnIndex = config.settings[i].colIndex - 1;
            }

            // check if the cell exists
            cellValue = dataset[config.settings[i].rowIndex - 1][columnIndex];
            if (cellValue !== undefined
              && cellValue !== null
              && cellValue.raw !== undefined
              && cellValue.raw !== null
              && cellValue.raw !== "") {
              dataset[config.settings[i].rowIndex - 1][columnIndex].label = my._formatNumber(config.settings[i].format, cellValue.raw);
            }
          }

          // apply the formatter on a specific row
          if (config.settings[i].rowIndex !== undefined
            && config.settings[i].rowIndex !== null
            && ( config.settings[i].colIndex === undefined
            || config.settings[i].colIndex === null )
            && dataset[config.settings[i].rowIndex - 1]
            && dataset[config.settings[i].rowIndex - 1].length) {

            for (col = 0; col < dataset[config.settings[i].rowIndex - 1].length; col++) {
              cellValue = dataset[config.settings[i].rowIndex - 1][col];
              if (cellValue !== undefined
                && cellValue !== null
                && cellValue.raw !== undefined
                && cellValue.raw !== null
                && cellValue.raw !== "") {
                dataset[config.settings[i].rowIndex - 1][col].label = my._formatNumber(config.settings[i].format, cellValue.raw);
              }
            }
          }

          // apply the formatter on a specific column
          if (( config.settings[i].rowIndex === undefined
            || config.settings[i].rowIndex === null )
            && config.settings[i].colIndex !== undefined
            && config.settings[i].colIndex !== null
            && dataset.length) {

            // check if the columnIndex should be retrieved based on the sourceColumn name
            columnIndex = -1;
            if (config.settings[i].colIndex.length && config.settings[i].colIndex.indexOf("<") === 0 && config.settings[i].colIndex.indexOf(">") === config.settings[i].colIndex.length - 1) {

              // get the source column by name and find the index of this column
              sourceColumn = config.settings[i].colIndex.substring(1, config.settings[i].colIndex.length - 1);
              if (columnConfig && columnConfig["displayColumns"] && columnConfig["displayColumns"].length) {
                columnIndex = columnConfig["displayColumns"].indexOf(sourceColumn);
              }
            } else {
              columnIndex = config.settings[i].colIndex - 1;
            }

            // apply the formatters for every column cell
            if (columnIndex > -1) {
              for (row = 0; row < dataset.length; row++) {
                if (dataset[row][columnIndex]) {
                  cellValue = dataset[row][columnIndex];
                  if (cellValue !== undefined
                    && cellValue !== null
                    && cellValue.raw !== undefined
                    && cellValue.raw !== null
                    && cellValue.raw !== "") {
                    dataset[row][columnIndex].label = my._formatNumber(config.settings[i].format, cellValue.raw);
                  }
                }
              }
            }
          }

          // apply the formatter on a whole table
          if (( config.settings[i].rowIndex === undefined
            || config.settings[i].rowIndex === null )
            && ( config.settings[i].colIndex === undefined
            || config.settings[i].colIndex === null )
            && dataset.length) {

            for (row = 0; row < dataset.length; row++) {
              for (col = 0; col < dataset[row].length; col++) {
                cellValue = dataset[row][col];
                if (cellValue !== undefined
                  && cellValue !== null
                  && cellValue.raw !== undefined
                  && cellValue.raw !== null
                  && cellValue.raw !== "") {
                  dataset[row][col].label = my._formatNumber(config.settings[i].format, cellValue.raw);
                }
              }
            }
          }
        }
      }
      return dataset;
    }


    /**
     * Create the HTML table
     *
     * Build up a HTML string based on the configuration settings and the results of
     * the dataset. Add the table to the containerDiv
     *
     * @param containerDiv      the ID of the HTML div element in which the object
     *                          needs to be rendered
     * @param config            the configuration for the entire object
     * @param columnConfig      an object holding the configuration settings for the
     *                          columns
     * @param dataset           the cell meta data with the raw value
     */
    function addHTML(containerDiv, config, columnConfig, dataset) {

      var s = "";
      if (dataset && dataset.length) {
        s += "<table class=\"customtable\">";
        s += getHTMLTableHeaderRow(columnConfig);
        s += getHTMLTableContent(config, columnConfig, dataset);
        s += "</table>";
      }

      // Add the HTML to the container
      $("#" + containerDiv + "Content").html(s);

      // If necessary, overwrite specific columns based on the settings
      if (config && config.settings && config.settings.length) {
        for (var i=0; i<config.settings.length; i++) {
          if (config.settings[i].text
            && config.settings[i].colIndex !== undefined
            && config.settings[i].rowIndex !== undefined) {
            $("#" + containerDiv + " .tr" + config.settings[i].rowIndex + ".td" + config.settings[i].colIndex).html(config.settings[i].text);
          }
        }
      }
    }
  };

  return my;
}(shell.app.execdb.dashboard));

//####src/execdb/dashboard/mod_trend_chart.js
shell.app.execdb.dashboard = (function (my) {

  /**
   * Generates trend chart
   *
   * This is a generic function that is used to generate the chart
   *
   * @param {string} containerDiv the ID of the HTML div element in which the
   *                              object needs to be rendered
   * @param {object} config       the configuration settings for the bullet chart
   * @param {string} dataId       the ID of the data for the object
   * @param {object} businessData the data for the selected business
   */

  my._createTrendChart = function (containerDiv, config, dataId, businessData) {

    // check if there is data to be displayed
    if (!dataId || !businessData.kpis[dataId.split(';')[0]] || Object.keys(businessData.kpis[dataId.split(';')[0]].data).length <= 1) {
      $('body').trigger('showContainerMessage', {
        container: containerDiv,
        message: 'No data available.',
        type: 'W'
      });
      return;
    }

    addCSS(containerDiv, config);
    addHTML(containerDiv, dataId, businessData);
    checkChartDivRendered(containerDiv, config, dataId, businessData, 0);

    function checkChartDivRendered(containerDiv, config, dataId, businessData, time) {
      var $containerDiv = $('#' + containerDiv + 'Content');

      if ($containerDiv.outerWidth() === 0 && time < 100) {
        setTimeout(function () {
          checkChartDivRendered(containerDiv, config, dataId, businessData, ++time);
        }, 100);
        return;
      }

      setTimeout(function () {
        buildCharts(containerDiv, config, dataId, businessData);
        buildLegend(containerDiv, config)
      }, 200);
    }


    /**
     * Add CSS for trend chart object
     *
     * This function adds the CSS for the trend chart object
     * to the head of the document.
     *
     * @param {string} containerDiv   the ID of the HTML div element in which
     *                                the object needs to be rendered
     * @param {object} config       the configuration settings for the bullet chart
     */
    function addCSS(containerDiv, config) {
      var s = '';
      var legendHeight = (config["ShowLegend"] === 'True') ? 40 : 0;

      var $customConfig = $("body").data("customConfig");
      var fontFamily = ($customConfig && $customConfig["CONFIG"] && $customConfig["CONFIG"]["dashboard"] && $customConfig["CONFIG"]["dashboard"]["FontFamily"])
        ? $customConfig["CONFIG"]["dashboard"]["FontFamily"]
        : "Verdana";


      s += '<style type="text/css" id="CSS_TREND_CHART_' + containerDiv + '" data-group="LAYOUT" data-repstyle="execdb">';

      s += '.trend-header-labels {';
      s += '  background-color: #f6f6f6;';
      s += '  height: 25px;';
      s += '}';

      s += '.primary-container {';
      s += '  width: 58%;';
      s += '  display: inline-block;';
      s += '}';

      s += '.secondary-container {';
      s += '  width: 10.5%;';
      s += '  display: inline-block;';
      s += '}';

      s += '.third-container {';
      s += '  width: 15%;';
      s += '  display: inline-block;';
      s += '}';

      s += '.trend-container-title {';
      s += '  left: 0;';
      s += '  right: 0;';
      s += '  top: 0;';
      s += '  height: 25px;';
      s += '  line-height: 25px;';
      s += '  position: relative;';
      s += '  background-color: #f6f6f6;';
      s += '  color: #000000;';
      s += '  font-size: 11px;';
      s += '  padding-left: 5px;';
      s += '  font-family: ' + fontFamily + ';';
      s += '  text-align: center;';
      s += '  font-weight: bold;';
      s += '  box-sizing: border-box;';
      s += '  text-overflow: ellipsis;';
      s += '  overflow: hidden;';
      s += '}';

      s += '#' + containerDiv + 'Charts {';
      s += '    position: absolute;';
      s += '    left : 0;';
      s += '    right : 0;';
      s += '    top : 25px;';
      s += '    bottom : ' + legendHeight + 'px;';
      s += '    overflow: hidden;';
      s += '}';

      s += '.tc-legend {';
      s += '  position: absolute;';
      s += '  left: 0;';
      s += '  right: 0;';
      s += '  bottom: 0;';
      s += '  height: ' + legendHeight + 'px;';
      s += '  font-size: 14px;';
      s += '  box-sizing: border-box;';
      s += '  text-align: center;';
      s += '  line-height:' + legendHeight + 'px;';
      s += '  font-family: ' + fontFamily + ';';
      s += '  overflow:hidden;';
      s += '  padding-top: 10px;';
      s += '}';
      s += '</style>';

      $(s).appendTo('head');
    }

    /**
     * Add HTML for trend chart object
     *
     * This function adds the HTML for the chart object inside the Content container.
     *
     * @param {string} containerDiv   the ID of the HTML div element in which
     *                                the object needs to be rendered
     * @param {string} dataId       the ID of the data for the object
     * @param {object} businessData the data for the selected business
     */
    function addHTML(containerDiv, dataId, businessData) {
      var kpiId = dataId.split(';')[0];
      var kpiTitle = (businessData.kpis[kpiId]) ? businessData.kpis[kpiId].text : "";
      var currentPeriod = my.period_functions.getCurrentPeriod();
      var currentYear = currentPeriod.year;
      var currentMonth = currentPeriod.periodShortName;
      var ytdLabel = (currentMonth === 'JAN') ? 'JAN' : 'JAN - ' + currentMonth;
      var s = '';

      // Labels
      s += '<div id="' + containerDiv + 'Labels" class="trend-header-labels">';
      s += '<div class="primary-container trend-container-title">' + kpiTitle + '</div>';
      s += '<div class="secondary-container trend-container-title">' + currentMonth + '</div>';
      s += '<div class="third-container trend-container-title">YTD ' + ytdLabel + '</div>';
      s += '<div class="third-container trend-container-title">FY ' + currentYear + '</div>';
      s += '</div>';


      // Charts
      s += '<div id="' + containerDiv + 'Charts">';
      s += '<div style="height:100%;" id="' + containerDiv + 'TrendChart" class="primary-container"></div>';
      s += '<div style="height:100%;" id="' + containerDiv + 'MonthChart" class="secondary-container"></div>';
      s += '<div style="height:100%;" id="' + containerDiv + 'YTDChart" class="third-container"></div>';
      s += '<div style="height:100%;" id="' + containerDiv + 'FullYearChart" class="third-container"></div>';
      s += '</div>';

      // Legend
      s += '<div id="' + containerDiv + 'Legend" class="tc-legend"></div>';

      // Add the HTML to the container
      $('#' + containerDiv + 'Content').html(s);
    }



    function buildLegend(containerDiv, config) {
      if (config.ShowLegend !== 'True') {
        return;
      }

      var chartConfig = {
        chart: {
          custom: {
            chartIds: ""
          },
          plotBackgroundColor: false,
          backgroundColor: '#FFFFFF',
          type: 'column',
          height: 150,
          margin: [0, 0, 0, 0],
          spacing: [5, 0, 0, 0]
        },
        legend: {
          verticalAlign: 'top',
          padding: 0,
          margin: 0
        },
        exporting: {
          enabled: false
        },
        plotOptions: {
          series: {
            stacking: 'normal',
            events: {
              legendItemClick: function (event) {

                // get the custom type of the clicked item
                var clickedType = ((((event || {}).target || {}).userOptions || {}).custom || {}).trigger;
                var showSeries = this.visible;

                // check all charts
                var allCharts = Highcharts.charts;

                // search for a series with custom type 'actual'
                allCharts.forEach(function (chart) {
                  chart.series
                    .filter(function (item) {
                      return ((((item || {}).options || {}).custom || {}).type === clickedType)
                    })
                    .forEach(function (chartSeries) {
                      if (showSeries) {
                        chartSeries.hide()
                      } else {
                        chartSeries.show()
                      }
                    });
                });

              }
            }
          }
        },
        credits: {
          enabled: false
        },
        title: {
          text: null
        },
        xAxis: {
          lineWidth: 0,
          minorGridLineWidth: 0,
          minorTickLength: 0,
          tickLength: 0,
          labels: {
            enabled: false
          }
        },
        yAxis: {
          gridLineWidth: 0,
          minorGridLineWidth: 0,
          labels: {
            enabled: false
          },
          title: {
            text: null
          }
        },
        series: [{
          "name": "Actual",
          "type": "column",
          "color": "#2196f3",
          "custom": {
            "trigger": "actual"
          }
        }, {
          "name": "Plan",
          "type": "column",
          "color": "#b5dcff",
          "custom": {
            "trigger": "plan"
          }
        }, {
          "name": "Previous Year",
          "type": "column",
          "color": "#bdbdbd",
          "custom": {
            "trigger": "py"
          }
        }, {
          "name": "12M RR",
          "type": "scatter",
          "marker": {
            "enabled": true,
            "symbol": "circle"
          },
          "color": "#020042",
          "custom": {
            "trigger": "rrytd"
          }
        }, {
          "name": "ROY RR",
          "type": "scatter",
          "marker": {
            "enabled": true,
            "symbol": "circle"
          },
          "color": "red",
          "custom": {
            "trigger": "rrroy"
          }
        }]
      };

      if (config.ShowBrent === 'True') {
        chartConfig.series.push({
          "name": "Brent",
          "type": "scatter",
          "marker": {
            "enabled": true,
            "symbol": "circle"
          },
          "color": "#d243dd",
          "custom": {
            "trigger": "brent"
          }
        });
      }


      if ($("#" + containerDiv + "Content").data("hasLEData")) {
        chartConfig.series.splice(3, 0, {
          "name": getCurrentQuarter() + " FYLE",
          "type": "column",
          "color": "#E9E8B0",
          "custom": {
            "trigger": "le"
          }
        });
      }


      $('#' + containerDiv + 'Legend').highcharts(chartConfig);
    }

    function _getCurrentQuarterNumber() {
        var currentMonth = my.period_functions.getCurrentPeriod().periodShortName;

        switch (currentMonth) {
          case "JAN":
          case "FEB":
          case "MAR":
            return 1;

          case "APR":
          case "MAY":
          case "JUN":
            return 2;

          case "JUL":
          case "AUG":
          case "SEP":
            return 3;

          case "OCT":
          case "NOV":
          case "DEC":
            return 4;
        }
      }

      function getCurrentQuarter() {
        return 'Q' + _getCurrentQuarterNumber();
      }


    /**
     * Build Chart
     *
     * Build the chart in the container based on the provided configuration and the
     * data.
     *
     * @param containerDiv   the ID of the HTML div element in which the object
     *                       needs to be rendered
     * @param config         the configuration settings for the bullet chart
     * @param dataId         the ID of the data for the object
     * @param businessData   the data for the selected business
     */
    function buildCharts(containerDiv, config, dataId, businessData) {

      // get the kpi that needs to be displayed (note that previous function already checked if it was available)
      var kpiIds = dataId.split(';');
      var kpiId = (kpiIds.length) ? kpiIds[0] : null;
      var kpiData = (businessData.kpis[kpiId]) ? businessData.kpis[kpiId].data : {};

      var currentPeriod = my.period_functions.getCurrentPeriod();
      var currentYear = currentPeriod.year;
      var previousYearLabel = "'" + (currentYear.substr(-2) - 1);

      var containerConfig = config;

      buildChart("TrendChart", config["TrendChartConfig"], kpiData);
      buildChart("MonthChart", config["MonthChartConfig"], kpiData);
      buildChart("YTDChart", config["YTDChartConfig"], kpiData);
      buildChart("FullYearChart", config["FullYearChartConfig"], kpiData);


      function buildChart(chartId, configString, kpiData) {

        // parse the provided configuration string
        var config = {};
        try {
          config = JSON.parse(configString);
        } catch (e) {
          return;
        }

        if (
          chartId === 'TrendChart' &&
          containerConfig.ShowBrent === 'True' &&
          containerConfig.BrentDataId
        ) {

          // check if the second axis is available
          var secondYAxis = {
            "title": {
              "text": ""
            },
            "labels": {
              "enabled": false
            },
            "gridLineWidth": 0,
            "minorGridLineWidth": 0
          };

          if (config.chartConfig.yAxis && Array.isArray(config.chartConfig.yAxis) && config.chartConfig.yAxis.length < 2) {
            config.chartConfig.yAxis.push(secondYAxis);
          } else if (config.chartConfig.yAxis && !Array.isArray(config.chartConfig.yAxis)) {
            config.chartConfig.yAxis = [config.chartConfig.yAxis, secondYAxis];
          }

          config.chartSeries.push({
            custom: {
              type: "brent"
            },
            name: "Brent",
            yAxis: 1,
            zIndex: 10,
            type: "spline",
            color: "#d243dd",
            dashStyle: "Dot",
            dataLabels: {
              enabled: false,
              format: "{point.y:,.1f}"
            },
            tooltip : {
              valueDecimals: 1
            },
            marker: {
              enabled: false
            },
            dataPoints: [{
              months: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
              displayPeriods: ["M1 CY", "M2 CY", "M3 CY", "M4 CY", "M5 CY", "M6 CY", "M7 CY", "M8 CY", "M9 CY", "M10 CY", "M11 CY", "M12 CY"]
            }]
          });
        }

        // get chart configuration from the provided parameters
        var hcConfig = config.chartConfig || {};
        hcConfig.series = [];
        if (config.chartSeries) {
          hcConfig.series = config.chartSeries.map(function (seriesConfig) {

            var series = $.extend(true, {}, seriesConfig);
            var displayPeriods = getDisplayPeriods(seriesConfig.dataPoints);
            delete seriesConfig.dataPoints;

            var _kpiData = kpiData;

            if (seriesConfig.custom.type === 'brent') {
              var datasets = $('body').data('customDataApp').datasets;

              _kpiData = datasets['SE-00']
                ? datasets['SE-00'].kpis[containerConfig.BrentDataId].data
                : {};
            }

            series.name = series.name.replace(/<=PY=>/g, currentYear - 1);

            series.data = displayPeriods.map(function (displayPeriod) {
              return _kpiData[displayPeriod] === undefined ? null : _kpiData[displayPeriod];
            });


            // check if specific logic is required
            if (seriesConfig.custom && seriesConfig.custom.logic) {
              if (seriesConfig.custom.logic === "le_monthly") {

                // get the current period
                var currentPeriod = shell.app.execdb.dashboard.period_functions.getCurrentPeriod();
                var periodNumber = parseInt(currentPeriod.periodNumber);
                var noOfEmptyPeriods = (periodNumber > series.data.length) ? series.data.length : periodNumber;
                var hasLEData = false;

                // check if LE data is available
                if (!series.data || !series.data.length) {
                  return {};
                }

                // delete all the data prior to the
                for (var i = 0; i < series.data.length; i++) {
                  if (i < noOfEmptyPeriods) {
                    series.data[i] = null;
                  } else {
                    if (series.data[i] !== null) {
                      hasLEData = true;
                    }
                  }
                }

                // return if no LE data was found else set an indicator of the availability of LE Data
                if (!hasLEData) {
                  return {};
                } else {
                  $("#" + containerDiv + "Content").data("hasLEData", true);
                }

                // add the latest actual data as starting point for the LE series
                if (series.data.length >= (periodNumber - 1)) {
                  series.data[periodNumber - 1] = kpiData["CM CY"];
                }
              }
            }

            return series;
          });
        }

        // replace category names
        if (hcConfig.xAxis && hcConfig.xAxis.categories) {
          hcConfig.xAxis.categories = hcConfig.xAxis.categories.map(function (categoryName) {
            return categoryName.replace(/<=PY=>/g, previousYearLabel);
          });
        }

        // build the chart
        $(getChartId(chartId)).highcharts(extendChartConfig(hcConfig));
      }



      function getDisplayPeriods(dataPoints) {
        var currentPeriod = my.period_functions.getCurrentPeriod();
        var currentMonth = currentPeriod.periodShortName;
        var dataPoint = dataPoints.filter(function (dataPoint) {
          return dataPoint.months.indexOf(currentMonth) !== -1;
        })[0];

        return dataPoint ? dataPoint.displayPeriods : [];
      }

      function getChartId(chartName) {
        return '#' + containerDiv + chartName;
      }

      function extendChartConfig(chartConfig) {
        return $.extend(true, {}, {
          chart: {
            spacingBottom: 10
          },
          title: {
            text: ''
          },
          subtitle: {
            text: ''
          },
          exporting: {
            enabled: false
          },
          credits: {
            enabled: false
          },
          xAxis: {
            title: {
              text: ''
            },
            labels: {
              staggerLines: 1,
              style: {
                fontSize: '9px'
              }
            },
            tickWidth: 0,
            lineWidth: 1,
            lineColor: '#999'
          },
          yAxis: [{
            plotLines: [{
              value: 0,
              color: 'black',
              width: 1,
              zIndex: 15
            }]
          }],
          plotOptions: {
            series: {
              animation: true,
              dataLabels: {
                enabled: false,
                style: {
                  textShadow: false
                }
              }
            },
            column: {
              pointPadding: 0,
              groupPadding: 0.1,
              borderWidth: 1
            }
          },
          tooltip: {
            enabled: true,
            shared: true,
            crosshairs: [false, false]
          },
          legend: {
            enabled: false
          }
        }, chartConfig);
      }
    }
  };

  return my;
})(shell.app.execdb.dashboard);

//####src/execdb/dashboard/mod_utils.js
shell.app.execdb.dashboard = ( function (my) {

  // check for mobile thingies
  my.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  my.eventTrigger = (my.isMobile) ? "touchstart" : "click";


  my.getSourceValue = function(businessKey, kpiKey, periodKey) {
    var foundItems = [];

    var $queries = $("body").data("customData");
    Object.keys($queries).forEach(function(query) {
      var queryResults = $queries[query].filter(function(obj){
        return (obj.businessKey === businessKey && obj.extKey === kpiKey && obj.extPeriodKey === periodKey);
      });

      if (queryResults.length) {
        var foundItem = {};
        foundItem[query] = queryResults;
        foundItems.push(foundItem);
      }
    });

    return foundItems;
  };


  // disable hover in jsTree
  jQuery.jstree.plugins.nohover = function () { this.hover_node = jQuery.noop; };


  my._formatNumber = function (m, v) {
    if (!m || isNaN(+v)) {
      return v; //return as it is.
    }
    //convert any string to number according to formation sign.
    var v = m.charAt(0) == '-' ? -v : +v;
    var isNegative = v < 0 ? v = -v : 0; //process only abs(), and turn on flag.

    //search for separator for grp & decimal, anything not digit, not +/- sign, not #.
    var result = m.match(/[^\d\-\+#]/g);
    var Decimal = (result && result[result.length - 1]) || '.'; //treat the right most symbol as decimal
    var Group = (result && result[1] && result[0]) || ',';  //treat the left most symbol as group separator

    //split the decimal for the format string if any.
    var m = m.split(Decimal);
    //Fix the decimal first, toFixed will auto fill trailing zero.
    v = v.toFixed(m[1] && m[1].length);
    v = +(v) + ''; //convert number to string to trim off *all* trailing decimal zero(es)

    //fill back any trailing zero according to format
    var pos_trail_zero = m[1] && m[1].lastIndexOf('0'); //look for last zero in format
    var part = v.split('.');
    //integer will get !part[1]
    if (!part[1] || part[1] && part[1].length <= pos_trail_zero) {
      v = (+v).toFixed(pos_trail_zero + 1);
    }
    var szSep = m[0].split(Group); //look for separator
    m[0] = szSep.join(''); //join back without separator for counting the pos of any leading 0.

    var pos_lead_zero = m[0] && m[0].indexOf('0');
    if (pos_lead_zero > -1) {
      while (part[0].length < (m[0].length - pos_lead_zero)) {
        part[0] = '0' + part[0];
      }
    }
    else if (+part[0] == 0) {
      part[0] = '';
    }

    v = v.split('.');
    v[0] = part[0];

    //process the first group separator from decimal (.) only, the rest ignore.
    //get the length of the last slice of split result.
    var pos_separator = ( szSep[1] && szSep[szSep.length - 1].length);
    if (pos_separator) {
      var integer = v[0];
      var str = '';
      var offset = integer.length % pos_separator;
      for (var i = 0, l = integer.length; i < l; i++) {

        str += integer.charAt(i); //ie6 only support charAt for sz.
        //-pos_separator so that won't trail separator on full length
        if (!((i - offset + 1) % pos_separator) && i < l - pos_separator) {
          str += Group;
        }
      }
      v[0] = str;
    }

    v[1] = (m[1] && v[1]) ? Decimal + v[1] : "";
    return (isNegative ? '-' : '') + v[0] + v[1]; //put back any negation and combine integer and fraction.

  };


  return my;


}(shell.app.execdb.dashboard));

//####src/execdb/dashboard/mod_view.js
shell.app.execdb.dashboard = (function (my) {
  my._buildView = function (menuId) {
    var $jbi_content = $("#jbi_content");

    // get the selected menuId
    menuId = getSelectedMenuId(menuId);
    if (!menuId) {
      $jbi_content.fadeOut("fast", function () {
        $jbi_content.html("");
        $jbi_content.fadeIn("slow");
      });
      $("body").data("currentView", "");
      return;
    }

    // get the selected business
    var businessId = null;
    var $jbi_businesses = $("#jbi_businesses");
    if ($jbi_businesses.jstree && $jbi_businesses.jstree("get_selected")) {
      businessId = $jbi_businesses.jstree("get_selected")[0];
    }

    if (!businessId) {
      return;
    }

    // get the ID of the view to be loaded
    var viewConfig = getViewConfig(menuId, businessId);
    if (!viewConfig) {
      $jbi_content.fadeOut("fast", function () {
        $jbi_content.html("");
        $jbi_content.fadeIn("slow");
      });
      $("body").data("currentView", "");
      return;
    }

    // check if an update is required
    if (!viewUpdateRequired(viewConfig, businessId)) {
      return;
    }

    // update the view
    my._updateView(viewConfig);
  };

  /**
   * GET SELECTED MENU ID
   **/
  function getSelectedMenuId(menuId) {
    var $menuActive = $(".menuActive");

    if (!menuId) {
      if ($menuActive.length === 1) {
        return $menuActive.data("menuid");
      } else {
        return;
      }
    }
    return menuId;
  }

  /**
   * CHECK IF VIEW REQUIRES UPDATE
   * If the ID of the view has not changed, no update is
   * required.
   **/
  function viewUpdateRequired(cfg, businessId) {
    var updateRequired = false,
      $body = $("body");

    if ($body.data("currentBusiness") !== businessId) {
      updateRequired = true;
      $body.data("currentBusiness", businessId);
    }

    // only proceed if the view has changed
    if ($body.data("currentView") !== JSON.stringify(cfg)) {
      updateRequired = true;
      $body.data("currentView", JSON.stringify(cfg));
    }

    return updateRequired;
  }

  /**
   * RETRIEVE VIEW ID
   * The configuration id for the view depends on the selected menu-item
   * and could be based on selected filter items as well. Function below
   * is to get the right view configuration id
   **/
  function getViewConfig(menuId, businessId) {
    var customData = $("body").data("customConfig"),
      viewsConfig = customData["VIEWS"];

    if (!viewsConfig) {
      return null;
    }

    // extract the relevant filters for the current menu
    var filters = my._getValidMenuFilters(menuId);

    // if no filters are provided, get retrieve the view config ID for the
    // option with the menuId only
    var viewConfig;

    if (filters.length > 0) {
      // check per views config for the current menuId which
      // one fits best (meaning, has the most correct filters)
      //viewConfig = getConfigIdBasedOnFilters(menuId, filters, viewsConfig);
      viewConfig = my._getViewConfigIdBasedOnFilters(
        menuId,
        filters,
        viewsConfig
      ).config;
    }

    // if none of the filter matches a specific viewConfig, pick the default
    // viewConfig assigned to the menu;
    if (!viewConfig) {
      for (var i = 0; i < viewsConfig.length; i++) {
        if (viewsConfig[i].menuId === menuId) {
          var allAllowed = true;
          for (var y = 0; y < viewsConfig[i].filterItems.length; y++) {
            if (viewsConfig[i].filterItems[y].filterValue !== "*") {
              allAllowed = false;
              break;
            }
          }
          if (allAllowed) {
            viewConfig = viewsConfig[i];
            break;
          }
        }
      }
    }

    return viewConfig;
  }

  //function getConfigIdBasedOnFilters(menuId, filters, viewsConfig, businessId) {
  //}

  /**
   * SET THE VIEW
   * By setting the view, the configuration of a specific view is set via code. This means
   * that the appropriate menu items are selected, the correct filters are shown and
   * eventually the view is updated.
   * @param cfg
   */
  my._setView = function (cfg, businessId) {
    // update the menu item
    my._setMenuItem(cfg.menuId);

    // update the relevant filters
    var validFilters = [],
      i,
      y,
      z,
      customConfig = $("body").data("customConfig"),
      menuItems = customConfig["MENU_ITEMS"],
      filterItems = customConfig["FILTER_ITEMS"];

    // update the current view
    viewUpdateRequired(cfg, businessId);

    for (i = 0; i < menuItems.length; i++) {
      if (menuItems[i].id === cfg.menuId) {
        for (y = 0; y < menuItems[i].filters.length; y++) {
          var filterValue = null;
          for (z = 0; z < cfg.filterItems.length; z++) {
            if (cfg.filterItems[z].filterId === menuItems[i].filters[y]) {
              filterValue = cfg.filterItems[z].filterValue;
              break;
            }
          }
          var filterType = null;
          for (z = 0; z < filterItems.length; z++) {
            if ("FILTER_" + filterItems[z].id === menuItems[i].filters[y]) {
              filterType = filterItems[z].type;
              break;
            }
          }

          validFilters.push({
            id: menuItems[i].filters[y].substring(7),
            value: filterValue,
            type: filterType
          });
        }
        break;
      }
    }
    my._setSelectedFilterValues(validFilters, true);

    // update the view
    my._updateView(cfg);
  };

  /**
   * UPDATE THE VIEW
   * Remove the current view and build the new view
   **/
  my._updateView = function (cfg) {
    // get the configuration of the view
    var viewConfig = $("body").data("customConfig")[cfg.viewId],
      $jbi_content = $("#jbi_content");

    // get the comment
    my._addViewCommentary();

    // remove the current view
    $jbi_content.fadeOut("fast", function () {
      $jbi_content.html("");

      if (viewConfig && viewConfig.view) {
        // create the new layout
        my._createViewLayout(viewConfig.view);

        // create the containers
        my._buildContainers(viewConfig.containers, cfg.containerData);
      }

      if ($jbi_content.html() !== "") {
        $jbi_content.fadeIn("slow", function () {
          // fade in the menu icon bar (only relevant for startup)
          $("#jbi_filter_icons").fadeIn("slow", function () {
            // add scrolling capabilities (mobile only)
            // if ( my.isMobile ) {
            //   var myScroll = new IScroll('#jbi_content', {mouseWheel: true});
            // }
          });
        });
      }
    });
  };

  my._getViewConfigIdBasedOnFilters = function (
    menuId,
    filters,
    viewsConfig,
    businessId
  ) {
    // check per views config if there is one that meets all conditions
    var menuAndFilterViews = [];
    for (var i = 0; i < viewsConfig.length; i++) {
      var validView = true;

      // at least the menuId must be right
      if (
        viewsConfig[i].menuId !== menuId ||
        viewsConfig[i].filterItems.length === 0
      ) {
        continue;
      }

      // then all the valid filters for the menuId must be right
      for (var y = 0; y < filters.length; y++) {
        var filterPassed = false;

        // if no selection is made, no filters can be met
        if (filters[y].selectedValues.length === 0) {
          break;
        }

        // check for each filtervalue in the views if that is correct
        for (
          var idxViewsFilter = 0; idxViewsFilter < viewsConfig[i].filterItems.length; idxViewsFilter++
        ) {
          if (
            viewsConfig[i].filterItems[idxViewsFilter].filterId ===
            filters[y].filter
          ) {
            // check if the value is correct
            if (
              viewsConfig[i].filterItems[idxViewsFilter].filterValue === "*"
            ) {
              filterPassed = true;
              break;
            }

            if (
              viewsConfig[i].filterItems[idxViewsFilter].filterValue.substring(
                0,
                1
              ) === "!" &&
              viewsConfig[i].filterItems[idxViewsFilter].filterValue.substring(
                1
              ) !== filters[y].selectedValues[0]
            ) {
              filterPassed = true;
              break;
            }

            if (
              viewsConfig[i].filterItems[idxViewsFilter].filterValue ===
              filters[y].selectedValues[0]
            ) {
              filterPassed = true;
              break;
            }
          }
        }

        // if the filter did not pass, proceed to the next viewConfig
        if (!filterPassed) {
          validView = false;
          break;
        }
      }

      if (validView) {
        menuAndFilterViews.push({
          id: i,
          config: viewsConfig[i]
        });
      }
    }

    // check if there is a specific view for the selected business
    // if only one report is valid, don't look further
    var currentBusiness;
    if (businessId) {
      currentBusiness = businessId;
    } else {
      var $jbiBusinesses = $("#jbi_businesses");
      if (
        $jbiBusinesses.jstree()._cnt === 0 ||
        !$jbiBusinesses.jstree().get_selected(true).length
      ) {
        return null;
      }
      currentBusiness = $jbiBusinesses.jstree().get_selected(true)[0].id;
    }

    var bestView = null;
    if (menuAndFilterViews.length === 1) {
      bestView = menuAndFilterViews[0];
    } else {
      // check for a specific report
      var hasSpecificReport = false;
      for (i = 0; i < menuAndFilterViews.length; i++) {
        var businesses = menuAndFilterViews[i].config.businessId.split(";");
        if (businesses.indexOf(currentBusiness) > -1) {
          hasSpecificReport = true;
          bestView = menuAndFilterViews[i];
          break;
        }
      }

      // get the 'general' report
      if (!hasSpecificReport) {
        for (i = 0; i < menuAndFilterViews.length; i++) {
          if (menuAndFilterViews[i].config.businessId === "*") {
            bestView = menuAndFilterViews[i];
            break;
          }
        }
      }
    }

    return bestView;
  };

  my._navToView = function (menuItemId, filters, businessId) {
    var customConfig = $("body").data("customConfig");

    if (hasValidMenuItemId(menuItemId)) {
      my._setMenuItem(menuItemId);
    } else {
      my._setMenuItem(customConfig.MENU_ITEMS[0].id);
    }

    if (businessId !== undefined && businessId !== null) {
      setInitialBusiness(businessId);
    }

    if (filters === undefined || filters === null || !filters.length) {
      return;
    }

    if (!customConfig ||
      !customConfig.FILTER_ITEMS ||
      !customConfig.FILTER_ITEMS.length
    ) {
      return;
    }

    var filterDefinitions = customConfig.FILTER_ITEMS;
    var activeFilters = filters
      .filter(isValidFilter(filterDefinitions))
      .map(addTypeToFilter(filterDefinitions));

    my._setSelectedFilterValues(activeFilters, false);

    function hasValidMenuItemId(menuItemId) {
      if (menuItemId === undefined || menuItemId === null) {
        return false;
      }

      var customConfig = $("body").data("customConfig");

      if (
        customConfig &&
        customConfig.MENU_ITEMS &&
        customConfig.MENU_ITEMS.length
      ) {
        return customConfig.MENU_ITEMS.some(function (menuItem) {
          return menuItem.id === menuItemId;
        });
      }

      return false;
    }

    function isValidFilter(filterDefinitions) {
      return function (filter) {
        return filterDefinitions.some(function (filterDefinition) {
          if (filterDefinition.id !== filter.id) {
            return false;
          }

          return filterDefinition.filterValues.some(function (filterValue) {
            return filterValue.key === filter.value;
          });
        });
      };
    }

    function addTypeToFilter(filterDefinitions) {
      return function (filter) {
        var type = filterDefinitions.filter(function (filterDefinition) {
          return filterDefinition.id === filter.id;
        })[0].type;

        return jQuery.extend({}, filter, {
          type: type
        });
      };
    }

    function setInitialBusiness(businessId) {
      var $body = $("body");
      var $businessTree = $("#jbi_businesses").jstree();
      var datasets = ($body.data("customDataApp") && $body.data("customDataApp").datasets) || {};
      var currentNode = datasets[businessId];
      var parentNodes = [];

      while (currentNode !== undefined) {
        var parentNode = currentNode.parentNode;

        if (parentNode) {
          parentNodes.unshift($businessTree.get_node(parentNode));
        }

        currentNode = datasets[parentNode];
      }

      parentNodes.forEach(function (node) {
        $businessTree.open_node(node);
      });

      $("#" + businessId + "_anchor").trigger("click");
    }
  };

  my._navToInitialView = function () {
    var $body = $("body");
    var uri = window.location.search;
    var bodyData = $body.data();
    var initialView = bodyData.initialView || {
      menuItemId: null,
      filters: [],
      businessId: null
    };

    if (uri) {
      var uriParams = uri
        .substr(1)
        .split("&")
        .map(function (uriParam) {
          return uriParam.split("=");
        });

      var hasValidUriParams = uriParams.some(function (uriParam) {
        return (
          uriParam[0] === "menuItemId" ||
          uriParam[0].substr(6) === "filter" ||
          uriParam[0] === "businessId"
        );
      });

      if (hasValidUriParams) {
        uriParams.forEach(function (uriParam) {
          var name = uriParam[0];
          var value = uriParam[1];

          if (name === "menuItemId") {
            initialView.menuItemId = value;
          } else if (name.indexOf("filter") !== -1) {
            initialView.filters.push({
              id: name.substr(6),
              value: value
            });
          } else if (name === "businessId") {
            initialView.businessId = value;
          }
        });

        $body.data("initialView", initialView);

        initialView = $body.data("initialView");
      }
    }

    my._navToView(
      initialView.menuItemId,
      initialView.filters.length ? initialView.filters : null,
      initialView.businessId
    );
  };

  return my;
})(shell.app.execdb.dashboard);
//####src/execdb/dataparser/app.js
var shell = shell || {};
shell.app = shell.app || {};
shell.app.execdb = shell.app.execdb || {};
shell.app.execdb.dataparser = ( function (my) {



  return my;
}(shell.app.execdb.dataparser || {}));

//####src/execdb/dataparser/mod_queryDesignStudio.js
shell.app.execdb.dataparser = ( function (my) {

  my.parseQueryDesignStudio = function (config) {
    var businessConfig = {};
    if (config["BUSINESS"]) {
      businessConfig = config["BUSINESS"];
    }

    var hierarchyMetadata = _getHierarchyMetadata(businessConfig),
      comments = _getComments(),
      htmlComments = _getHTMLComments(),
      parsedData = _createDatasets(hierarchyMetadata, config),
      hierarchy = _createHierarchy(parsedData.datasets, hierarchyMetadata),
      fullDataset = $.extend(true, {}, hierarchy.datasets),
      dataset;

    // remove all the kpis from the hierarchy dataset
    for (dataset in hierarchy.datasets) {
      if (hierarchy.datasets.hasOwnProperty(dataset)) {
        delete hierarchy.datasets[dataset].kpis;
      }
    }

    // remove all the children from the kpi dataset
    for (dataset in fullDataset) {
      if (fullDataset.hasOwnProperty(dataset)) {
        var childrenIds = [];
        if (fullDataset[dataset].children && fullDataset[dataset].children.length) {
          for (var i = 0; i < fullDataset[dataset].children.length; i++) {
            childrenIds.push(fullDataset[dataset].children[i].id);
          }
        }
        fullDataset[dataset].children = childrenIds;
      }
    }

    return ({
      businessHierarchy: hierarchy.businessHierarchy,
      datasets: fullDataset,
      comments: comments,
      htmlComments: htmlComments,
      periods: parsedData.headerLabels
    });


    function _getHTMLComments() {
      var $customDataApp = $("body").data("customDataApp");
      return (!$customDataApp || !$customDataApp.htmlComments) ? [] : $customDataApp.htmlComments;
    }



    function _getComments() {
      // get the data
      var customData = $("body").data("customData");
      if (!customData) {
        return [];
      }

      // structure holding the comment relevant infoobjects
      var iobj = {
        ReportName: "XX100134",   // not provided by the query
        Period: "XX100135",       // not provided by the query
        Menu: "XX100136",
        Business: "XX100137",
        Container: "XX100138",
        Filter1: "XX100139",
        Filter2: "XX100140",
        Filter3: "XX100141",
        Filter4: "XX100142",
        Filter5: "XX100143",
        Filter6: "XX100144",
        Filter7: "XX100145",
        Text1: "XX100146",
        Text2: "XX100147",
        Text3: "XX100148",
        Text4: "XX100149"
      };

      // get the query that provides the comments
      var comments = [];
      for (var property in customData) {
        if (customData.hasOwnProperty(property)) {
          var data = customData[property];
          if (!data.length) {
            continue;
          }

          // a characteristic that identifies the comment query is the
          // comment text (XX100146)
          if (!data[0][iobj.Text1 + "_TEXT"]) {
            continue;
          }

          // go over each line of the query and create a set for the application
          for (var i = 0; i < data.length; i++) {
            var commentText = "";
            for (var y = 1; y <= 4; y++) {
              if (data[i][iobj["Text" + y] + "_KEY"] !== "#") {
                if (data[i][iobj["Text" + y] + "_KEY"] === data[i][iobj["Text" + y] + "_TEXT"]) {
                  commentText += data[i][iobj["Text" + y] + "_KEY"];
                } else {
                  commentText += data[i][iobj["Text" + y] + "_KEY"] + " ";
                  commentText += data[i][iobj["Text" + y] + "_TEXT"];
                }
              }
            }

            comments.push({
              Menu: data[i][iobj.Menu + "_KEY"],
              Business: data[i][iobj.Business + "_KEY"],
              Container: data[i][iobj.Container + "_KEY"],
              Filter1: data[i][iobj.Filter1 + "_KEY"],
              Filter2: data[i][iobj.Filter2 + "_KEY"],
              Filter3: data[i][iobj.Filter3 + "_KEY"],
              Filter4: data[i][iobj.Filter4 + "_KEY"],
              Filter5: data[i][iobj.Filter5 + "_KEY"],
              Filter6: data[i][iobj.Filter6 + "_KEY"],
              Filter7: data[i][iobj.Filter7 + "_KEY"],
              Comment: commentText
            });
          }
        }
      }
      return comments;
    }


    function _createDatasets(hierarchyMetadata, config) {
      var datasets = {},
        headerLabels = {},
        settypes = {
          standard: [],
          exception: []
        };

      // Add data in Design studio is stored in the body of the
      // document in a property called "customData". This is done
      // by the DATA components.
      var customData = $("body").data("customData");
      var bexQueriesConfig = (config && config["CONFIG"] && config["CONFIG"]["bw"] && config["CONFIG"]["bw"]["bex_queries"] && config["CONFIG"]["bw"]["bex_queries"].length)
        ? config["CONFIG"]["bw"]["bex_queries"]
        : [];

      if (customData) {
        for (var property in customData) {
          if (customData.hasOwnProperty(property)) {
            var data = customData[property];

            // check if the current query result is holding the
            // report data. This is true if two structures can
            // be found, of which one contains the CM period
            var metaStructures = getStructureIds(data);
            if (!metaStructures) {
              continue;
            }

            // some periods need to be removed (business logic), populate an array with the texts of these periods
            var ignorePeriodsWithText = [];
            for (i=0; i<bexQueriesConfig.length; i++) {
              if (bexQueriesConfig[i].query === property) {
                if ( bexQueriesConfig[i].ignore_periodtexts ) {
                  ignorePeriodsWithText = bexQueriesConfig[i].ignore_periodtexts.split(";");
                }
                break;
              }
            }

            // pre-process the data
            var enhancedData = enhanceData(metaStructures, data, hierarchyMetadata, ignorePeriodsWithText);
            var dataLabels = getHeaderlabels(metaStructures, data);

            // store the headerLabels
            for (var i = 0; i < dataLabels.length; i++) {
              headerLabels[dataLabels[i].id] = headerLabels[dataLabels[i].id] || dataLabels[i].label;
            }


            // because the standard queries needs to be processed before the exception
            // queries, we need to store the values for later processing
            var setObject = {
              data: enhancedData,
              metaStructures: metaStructures,
              dataLabels: dataLabels
            };

            // separate the standard datasets from the exception datasets
            if (enhancedData && enhancedData.length) {
              if (enhancedData[0].isException) {
                settypes.exception.push(setObject);
              } else {
                settypes.standard.push(setObject);
              }
            }
          }
        }

        // first process the standard queries
        // extract the kpi data
        var setIndex;
        if (settypes.standard.length) {
          for (setIndex = 0; setIndex < settypes.standard.length; setIndex++) {
            $.extend(
              true,
              datasets,
              buildDatasets(
                settypes.standard[setIndex].data,
                settypes.standard[setIndex].metaStructures,
                settypes.standard[setIndex].dataLabels
              ),
              datasets);
          }
        }

        // now process the exception queries
        if (settypes.exception.length) {
          for (setIndex = 0; setIndex < settypes.exception.length; setIndex++) {
            $.extend(
              true,
              datasets,
              buildDatasets(
                settypes.exception[setIndex].data,
                settypes.exception[setIndex].metaStructures,
                settypes.exception[setIndex].dataLabels
              ),
              datasets);
          }
        }

        return {
          datasets: datasets,
          headerLabels: headerLabels
        }
      }

      /**
       * Gets the generated BEx query structure Ids
       *
       * The IDs of the structures used in the BEx query are generated by SAP and
       * can be different per system. The query consists of two structures. One
       * for the PERIODS and one for the GROUPINGS.
       *
       * This function extracts the generated IDs and returns an object holding
       * the metadata (key and text).
       *
       * NOTE:
       * The first GROUPING text in the BEx query should always start with the
       * following four characters : ' ---'
       *
       * @param data   the query resultset
       * @return       object holding the ids of the BEx query structures or
       *               null in case the IDs could not be determined
       */
      function getStructureIds(data) {

        // prepare the result object
        var metaStructures = {
          periodStructureKey: null,
          periodStructureText: null,
          sectorKey: "SH000470_KEY",
          sectorText: "SH000470_TEXT",
          miSectorKey: "SH100098_KEY",
          miSectorText: "SH100098_TEXT",
          businessEntityKey: "SH100242_KEY",
          businessEntityText: "SH100242_TEXT",
          kpiStructureKey: null,
          kpiStructureText: null,
          value: "VALUE"
        };

        if (!data || !data[0]) {
          return null;
        }

        // determine the ID for the GROUPING structure based on the property name of the first
        // data item (starting with ' ---').
        var property;
        for (property in data[0]) {
          if (data[0].hasOwnProperty(property)) {

            // get the structure key and name
            if (( ("" + data[0][property]).substring(0, 4) === " ---" || ("" + data[0][property]).substring(0, 3) === "---" ) && property.substring(property.length - 4) !== "_KEY") {
              metaStructures.kpiStructureText = property;
              metaStructures.kpiStructureKey = property.substring(0, (property.length - 5)) + "_KEY";
              break;
            }
          }
        }

        // get the structure id for the PERIODS structure (the 'other' structure)
        for (property in data[0]) {
          if (data[0].hasOwnProperty(property)) {
            if (property !== metaStructures.kpiStructureKey &&
              property !== metaStructures.kpiStructureText &&
              property !== metaStructures.businessEntityKey &&
              property !== metaStructures.businessEntityText &&
              property !== metaStructures.sectorKey &&
              property !== metaStructures.sectorText &&
              property !== metaStructures.miSectorKey &&
              property !== metaStructures.miSectorText &&
              property !== metaStructures.value) {
              if (property.substring(property.length - 4) === "_KEY") {
                metaStructures.periodStructureKey = property;
                metaStructures.periodStructureText = property.substring(0, (property.length - 4)) + "_TEXT";
              }
              break;
            }
          }
        }

        // only proceed if the metadata is known
        if (!metaStructures.periodStructureKey || !metaStructures.periodStructureText || !metaStructures.kpiStructureText || !metaStructures.kpiStructureKey) {
          return null;
        }

        return metaStructures;
      }


      /**
       * Extract the KEY and TEXT used in the Structures
       *
       * The GROUPING structure has one leading row that describes a specific
       * grouping in the BEx query (called VIEW name). This leading row will
       * be followed with rows that hold the data for this specifi VIEW. These
       * rows start with the VIEW ID followed with a space and then the GROUP
       * NAME.
       *
       * Example:
       *  --- 100.01 My Description
       * 100.01 Group Name 1
       * 100.01 Another Group Name
       *
       * This function is used to add the following information to each data
       * record based on the GROUPING structure:
       * - viewName       --> i.e. 100.01 My Description
       * - extKey         --> i.e. 100.01
       * - extText        --> i.e. Group Name 1
       *
       *
       * Also this function extracts the KEY and TEXT for the period structure
       * which is required as the TEXTS of the periods are determined in SAP
       * via a text variable.
       *
       * Example:
       * CM CY - FEB 2015
       *
       * The following data will be extracted based on this property:
       * - extPeriodKey   --> i.e. CM CY
       * - extPeriodText  --> i.e. FEB 2015
       *
       * This function extracts the generated IDs and returns an object holding
       * the metadata (key and text).
       *
       *
       * @param metaStructures        the Ids of the BEx query structures
       * @param data                  the query resultset
       * @param hierarchyMetadata     the meta data for the hierarchy nodes
       * @param ignorePeriodsWithText Array holding period labels that should be ignored
       * @return {Array}              the query resultset enhanced with the viewName, grouping
       *                              key, grouping text, period key and period text
       */
      function enhanceData(metaStructures, data, hierarchyMetadata, ignorePeriodsWithText) {
        var enhancedData = [],
          keySeparator;

        for (var i = 0; i < data.length; i++) {

          // check if the GROUPING property holds the VIEW DESCRIPTION (starts with ' ---')
          try {
            if (data[i][metaStructures.kpiStructureText].substring(0, 4) === " ---"
              || data[i][metaStructures.kpiStructureText].substring(0, 3) === "---") {
              continue;
            }
          } catch (err) {
            continue;
          }

          // add the grouping key and text
          try {
            // search for the - in the kpi description
            var sepIndex = data[i][metaStructures.kpiStructureText].indexOf("-");
            data[i].extKey = data[i][metaStructures.kpiStructureText].substring(0, sepIndex - 1);
            data[i].extText = data[i][metaStructures.kpiStructureText].substring(sepIndex + 2);
          } catch (err) {
            // do nothing if an error occurs
          }

          // the sector exception query contains the sector key in brackets
          var sectorExceptionOpeningBracket = data[i].extKey.indexOf("(");
          var sectorExceptionClosingBracket = data[i].extKey.indexOf(")");
          if (sectorExceptionOpeningBracket > -1 && sectorExceptionClosingBracket > sectorExceptionOpeningBracket) {
            data[i][metaStructures.sectorKey] = "/" + data[i].extKey.substring(sectorExceptionOpeningBracket + 1, sectorExceptionClosingBracket);
            data[i].extKey = data[i].extKey.substring(0, sectorExceptionOpeningBracket);
            data[i].isException = true;
          }

          // add the period key and text to the data
          try {
            var fullPeriod = data[i][metaStructures.periodStructureText];
            data[i].extPeriodKey = fullPeriod.substring(0, fullPeriod.indexOf(" - "));
            data[i].extPeriodText = fullPeriod.substring(fullPeriod.indexOf(" - ") + 3);
          } catch (err) {
            // do nothing if an error occurs
          }

          // check if the period is in the 'ignore' list
          if (ignorePeriodsWithText.indexOf(data[i].extPeriodText) > -1) {
            continue;
          }

          // move the Mi sector data to the sector
          if (data[i][metaStructures.miSectorKey]) {
            data[i][metaStructures.sectorKey] = data[i][metaStructures.miSectorKey];
            data[i][metaStructures.sectorText] = data[i][metaStructures.miSectorKey];
          }


          // add the sector to the data
          if (data[i][metaStructures.sectorKey]) {

            var sectorKey = data[i][metaStructures.sectorKey] || data[i][metaStructures.miSectorKey];
            keySeparator = sectorKey.lastIndexOf("/");
            if (keySeparator > -1) {
              sectorKey = sectorKey.substring(keySeparator + 1);
            } else {
              // only hierarchy nodes are permitted for sector
              continue;
            }

            data[i].businessKey = "SE-" + sectorKey;

            // read the business text from the hierarchy meta data
            if (hierarchyMetadata && hierarchyMetadata.nodeMetadata && hierarchyMetadata.nodeMetadata["SE-" + sectorKey]) {
              data[i].businessText = hierarchyMetadata.nodeMetadata["SE-" + sectorKey].name;
            } else if (data[i][metaStructures.sectorText]) {
              data[i].businessText = data[i][metaStructures.sectorText];
            } else {
              data[i].businessText = sectorKey;
            }


          } else if (data[i][metaStructures.businessEntityKey]) {
            var businessEntityKey = data[i][metaStructures.businessEntityKey];
            keySeparator = businessEntityKey.lastIndexOf("/");
            if (keySeparator > -1) {
              businessEntityKey = businessEntityKey.substring(keySeparator + 1);
            }

            data[i].businessKey = "BE-" + businessEntityKey;
            data[i].businessText = data[i][metaStructures.businessEntityText];
          }

          // change null to undefined for the merge of datasets
          if (data[i].VALUE === null) {
            data[i].VALUE = undefined;
          }

          enhancedData.push(data[i]);
        }

        return enhancedData;
      }


      /**
       * Get the header labels from the dataset
       *
       * The periods are provided as key and text. The provided periods are equal
       * to all the datasets within the data. This generic function is determining
       * the headerlabels only one time.
       *
       * NOTE:
       * The first GROUPING text in the BEx query should always start with the
       * following four characters : ' ---'
       *
       * @param metaStructures    the Ids of the BEx query structures
       * @param data              the query resultset
       * @return {Array}          the header labels (both id and label)
       */
      function getHeaderlabels(metaStructures, data) {

        // result object
        var headerLabels = [{
          id: "Group",
          label: ""
        }];

        // the first row in the dataset should have a value for each period and can therefore
        // be used to determine the periods.
        var curStr = null;
        for (var i = 0; i < data.length; i++) {

          // proceed as long as we are still on the first row
          if ("" + data[i][metaStructures.kpiStructureText].substring(0, 4) === " ---" || "" + data[i][metaStructures.kpiStructureText].substring(0, 3) === "---") {
            if (curStr !== data[i][metaStructures.kpiStructureText] && curStr !== null) {
              break;
            } else {
              curStr = data[i][metaStructures.kpiStructureText];
            }


            try {
              var fullPeriod = data[i][metaStructures.periodStructureText];
              headerLabels.push({
                id: fullPeriod.substring(0, fullPeriod.indexOf(" - ")),
                label: fullPeriod.substring(fullPeriod.indexOf(" - ") + 3)
              });
            } catch (err) {
              // do nothing
            }
          } else {
            // break the loop in case the second row is processed
            break;
          }
        }

        return headerLabels;
      }


      /**
       * Get the header labels from the dataset
       *
       * The periods are provided as key and text. The provided periods are equal
       * to all the datasets within the data. This generic function is determining
       * the headerlabels only one time.
       *
       * NOTE:
       * The first GROUPING text in the BEx query should always start with the
       * following four characters : ' ---'
       *
       * @param enhancedData      the query resultset enhanced with the viewName, grouping
       *                          key, grouping text, period key and period text
       * @param metaStructures    the Ids of the BEx query structures
       */
      function buildDatasets(enhancedData, metaStructures) {
        var datasets = {};

        for (var i = 0; i < enhancedData.length; i++) {

          // every row must have a business key assigned
          if (!enhancedData[i].businessKey) {
            continue;
          }

          // check if the dataset id is already defined
          if (!datasets[enhancedData[i].businessKey]) {
            datasets[enhancedData[i].businessKey] = {
              text: enhancedData[i].businessText,
              kpis: {},
              parentNode: enhancedData[i]["businessParent"],
              id: enhancedData[i].businessKey,
              color: enhancedData[i].color
            }
          }

          // add the kpi if not already defined
          if (!datasets[enhancedData[i].businessKey].kpis[enhancedData[i].extKey]) {
            datasets[enhancedData[i].businessKey].kpis[enhancedData[i].extKey] = {
              text: enhancedData[i].extText,
              data: {
                'Group': enhancedData[i].extText
              }
              //headerLabels: headerLabels
            };
          }

          // add the value
          datasets[enhancedData[i].businessKey].kpis[enhancedData[i].extKey].data[enhancedData[i].extPeriodKey] = enhancedData[i][metaStructures.value];
        }

        return datasets;
      }
    }


    function _createHierarchy(datasets, hierarchyMetadata) {

      // next: create the datasets and the hierarchy
      return {
        businessHierarchy: addHierarchyMetaToDatasets(hierarchyMetadata, datasets),
        datasets: datasets
      };


      // add the hierarchy metadata to the report data (actual data)
      function addHierarchyMetaToDatasets(hierarchyMetadata, datasets) {

        var arrData = [];
        for (var property in datasets) {
          if (datasets.hasOwnProperty(property)) {
            var mapIndex;

            // add the node metadata
            if (hierarchyMetadata.nodeMetadata && hierarchyMetadata.nodeMetadata[property]) {
              $.extend(true, datasets[property], datasets[property], hierarchyMetadata.nodeMetadata[property]);
            }

            // check if the node should be removed
            if (hierarchyMetadata && hierarchyMetadata.mappingTable && hierarchyMetadata.mappingTable.to) {
              mapIndex = hierarchyMetadata.mappingTable.to.indexOf(datasets[property].parentNode);
              if (mapIndex > -1) {
                continue;
              }
            }

            // check if the parent node needs to be re-mapped
            if (hierarchyMetadata && hierarchyMetadata.mappingTable && hierarchyMetadata.mappingTable.from) {
              mapIndex = hierarchyMetadata.mappingTable.from.indexOf(datasets[property].parentNode);
              if (mapIndex > -1) {
                datasets[property].parentNode = hierarchyMetadata.mappingTable.to[mapIndex];
              }
            }

            arrData.push(datasets[property]);
          }
        }


        function buildHierarchy(arry, hierarchyMetadata) {

          var roots = [],
            children = {},
            customRoots = (hierarchyMetadata.topNodes && hierarchyMetadata.topNodes.length) ? hierarchyMetadata.topNodes : [],
            x, z;

          // find the top level nodes and hash the children based on parent
          for (x = 0; x < arry.length; x++) {
            var item = arry[x],
              p = item.parentNode;

            // check the roots
            if (customRoots.length
              && customRoots.length > 0
            ) {
              // roots may only be of type sector
              if (customRoots.indexOf(item.id) === -1 || (!customRoots.length && item.id.substring(0, 3) !== "SE-") ) {
                if (!p) {
                  continue;
                }
              } else {
                delete(item.parentNode);
                p = null;

                item.state = {
                  'opened': true
                }
              }
            }
            // if no topnodes are specified, the rootnodes are the items without a parent
            else if (!p) {
              // roots may only be of type sector
              if (item.id.substring(0, 3) !== "SE-") {
                continue;
              } else {
                item.state = {
                  'opened': true
                }
              }
            }

            var target = !p ? roots : (children[p] || (children[p] = []));
            target.push(item);
          }

          // function to recursively build the tree
          var findChildren = function (parent) {
            if (children[parent.id]) {
              parent.children = children[parent.id];
              for (var y = 0; y < parent.children.length; y++) {
                findChildren(parent.children[y]);
              }
            }
          };

          // enumerate through to handle the case where there are multiple roots
          for (z = 0; z < roots.length; z++) {
            findChildren(roots[z]);
          }
          return roots
        }

        /**
         * Sort the hierarchy nodes, first by the order defined in the configuration
         * next alphabetically
         * @param arrData
         * @param hierarchyMetadata
         */
        function sortHierNodes(arrData, hierarchyMetadata) {

          // read the sorting configuration
          var hierOrder = hierarchyMetadata.nodeOrder;

          // split the nodes:
          // - group A: items defined in the hierOrder array (will be sorted by hierOrder)
          // - group B: items not defined in the array (will be sorted alphabetically)
          var groupA = [],
            groupB = [];
          for (var x = 0; x < arrData.length; x++) {
            if (!arrData[x].id || !arrData[x].name) {
              // don't do anything...
            } else if (hierOrder.indexOf(arrData[x].id) > -1) {
              groupA.push(arrData[x]);
            } else {
              groupB.push(arrData[x]);
            }
          }

          // sort group A
          groupA.sort(function (a, b) {
            return hierOrder.indexOf(a.id) - hierOrder.indexOf(b.id);
          });

          // sort group B
          groupB.sort(function (a, b) {
            if (a.name && b.name && a.name < b.name) return -1;
            if (a.name && b.name && a.name > b.name) return 1;
            return 0;
          });

          return groupA.concat(groupB);
        }

        // create the hierarchy object for jsTree
        var sortedHierNodes = sortHierNodes(arrData, hierarchyMetadata);
        return buildHierarchy(sortedHierNodes, hierarchyMetadata);
      }

    }

    function _getHierarchyMetadata(config) {
      var cfg = {
        iobjMappingFrom: "SH100534",
        iobjMappingTo: "SH100535",
        iobjBusinessElement: "SH100242",
        iobjBusinessElementParent: "SH100438",
        iobjBusinessElementParent2: "SH100439",
        iobjBusinessElementType: "SH100277",
        iobjSector: "SH000470",
        iobjMiSector: "SH100098",
        iobjSectorParent: "XX000304",
        iobjColorCode: "SH100546",
        iobjHierarchyNodeId: "SHXXXXX0",
        iobjHierarchyOrder: "SHXXXXX1"
      };

      // get the topnodes
      // if the topnodes configuration parameter is set, use this
      var $body = $("body");
      var $customAppFilters = $body.data("customAppFilters");
      var topNodes = [];
      if (config["top_nodes"] && config["top_nodes"].length) {
        for (var i=0; i<config["top_nodes"].length; i++) {
          var topNode = config["top_nodes"][i];

          if ($customAppFilters) {
            topNode = topNode.replace("%SECTOR%", "SE-" + $customAppFilters.sector.toString());
            topNode = topNode.replace("%BUSINESS_ELEMENT%", "BE-" + $customAppFilters.businessElement.toString());
          }
          topNodes.push(topNode);
        }
      }

      var metadata = {
        mappingTable: null,
        nodeMetadata: null,
        nodeOrder: config["node_order"],
        topNodes: topNodes
      };

      var sectorNodeMetadata;
      var businessElementMetadata;

      var customData = $body.data("customData");
      if (customData) {
        for (var property in customData) {
          if (customData.hasOwnProperty(property)) {
            var data = customData[property];
            if (!data || !data.length) {
              continue;
            }

            // is mapping table query?
            if (data[0][cfg.iobjMappingFrom + "_KEY"] !== undefined
              && data[0][cfg.iobjMappingTo + "_KEY"] !== undefined) {
              metadata.mappingTable = getMappingtable(cfg, data);
            }

            // is sector metadata?
            if (data[0][cfg.iobjSector + "_KEY"] !== undefined
              && data[0][cfg.iobjSectorParent + "_KEY"] !== undefined) {
              sectorNodeMetadata = getSectorNodeMeta(cfg, data, config);
            }

            // is business element metadata?
            if (data[0][cfg.iobjBusinessElement + "_KEY"] !== undefined
              && (data[0][cfg.iobjBusinessElementParent + "_KEY"] !== undefined || data[0][cfg.iobjBusinessElementParent2 + "_KEY"] !== undefined ) ) {
              businessElementMetadata = getBusinessElementNodeMeta(cfg, data, config);
            }
          }
        }

        metadata.nodeMetadata = $.extend(true, sectorNodeMetadata, businessElementMetadata);
      }
      return metadata;


      function getMappingtable(cfg, data) {
        var mappingTable = {
          from: [],
          to: []
        };
        for (var i = 0; i < data.length; i++) {
          mappingTable.from.push(data[i][cfg.iobjMappingFrom + "_TEXT"]);
          mappingTable.to.push(data[i][cfg.iobjMappingTo + "_TEXT"]);
        }
        return mappingTable;
      }


      function getSectorNodeMeta(cfg, data, userConfig) {
        var nodeMeta = {};

        for (var i = 0; i < data.length; i++) {
          var parentNodeId = data[i][cfg.iobjSectorParent + "_KEY"];
          var hierNode = "SE-" + data[i][cfg.iobjSector + "_KEY"];
          var parentNode = data[i][cfg.iobjSectorParent + "_KEY"] ? "SE-" + data[i][cfg.iobjSectorParent + "_KEY"] : null;
          var color = (data[i][cfg.iobjColorCode + "_KEY"] !== "#") ? data[i][cfg.iobjColorCode + "_KEY"] : null;
          var name = data[i][cfg.iobjSector + "_TEXT"];

          // check if the name needs to be overwritten due to the configuration
          if (userConfig && userConfig.renaming && userConfig.renaming[hierNode]) {
            name = userConfig.renaming[hierNode];
          }

          nodeMeta[hierNode] = {
            parentNode: (parentNode !== hierNode && parentNodeId !== '#') ? parentNode : null,
            color: color,
            name: name
          }
        }
        return nodeMeta;
      }

      function getBusinessElementNodeMeta(cfg, data, userConfig) {
        var nodeMeta = {};
        for (var i = 0; i < data.length; i++) {
          var hierNode = "BE-" + data[i][cfg.iobjBusinessElement + "_KEY"];
          var parentNode;
          var color = (data[i][cfg.iobjColorCode + "_KEY"] !== "#") ? data[i][cfg.iobjColorCode + "_KEY"] : null;
          var name = data[i][cfg.iobjBusinessElement + "_TEXT"];

          // determine the parent node
          if (data[i][cfg.iobjBusinessElementParent + "_KEY"]) {
            parentNode = "BE-" + data[i][cfg.iobjBusinessElementParent + "_KEY"];
          } else if (data[i][cfg.iobjBusinessElementParent2 + "_KEY"]) {
            parentNode = "BE-" + data[i][cfg.iobjBusinessElementParent2 + "_KEY"];
          } else {
            parentNode = null;
          }

          // check if the name needs to be overwritten due to the configuration
          if (userConfig && userConfig.renaming && userConfig.renaming[hierNode]) {
            name = userConfig.renaming[hierNode];
          }

          nodeMeta[hierNode] = {
            parentNode: parentNode,
            color: color,
            name: name
          };

          // if a business element type is provided, add it to the metadata
          if (data[i][cfg.iobjBusinessElementType + "_KEY"]) {
            nodeMeta[hierNode].nodetype = data[i][cfg.iobjBusinessElementType + "_KEY"];
          }

        }
        return nodeMeta;
      }

    }
  };

  return my;

}(shell.app.execdb.dataparser));

//####src/execdb/dataparser/mod_queryJson.js
shell.app.execdb.dataparser = ( function (my) {

  my.parseQueryJSON = function (service, queries) {
    return getAllQueries(service, queries);

    // get data from BEx query using JSON
    function getAllQueries() {
      var deferred = $.Deferred();
      var promises = [];
      for (var i = 0; i < queries.length; i++) {
        promises.push(getQueryDataFromJSONHandler(service, queries[i]));
      }
      $.when.apply($, promises).then(function () {
        for (var i = 0; i < arguments.length; i++) {
          deferred.resolve(arguments);
        }
      });
      return deferred.promise();
    }

    // get query data
    function getQueryDataFromJSONHandler(service, query) {
      var deferred = $.Deferred();
      $.ajax({
        type: "POST",
        url: service,
        xhrFields: {
          withCredentials: true
        },
        async: true,
        dataType: "json",
        contentType: "text/plain",
        data: JSON.stringify(query),
        success: function (data) {
          if (data.RESULT) {
            $("body").trigger("query_done");
            deferred.resolve(data.RESULT);
          } else {
            $("body").trigger("query_done");
            deferred.resolve(parseQueryResults(data))
          }
        },
        error: function (e) {
          $("body").trigger("query_done");
          deferred.reject(e)
        }
      });
      return deferred.promise();
    }


    /**
     * Convert the flat "Xcelsius like" structure to the Design Studio structure
     * @param data {Array}  Query Results as flat structure
     * @returns {Object}    Object holding the query name and the DS structure
       */
    function parseQueryResults(data) {
      var queryData = (data["QUERY_RESULT"] && data["QUERY_RESULT"].length) ? data["QUERY_RESULT"] : [];
      var queryStructure = getQueryStructure(queryData);
      var dataElements = createQueryElements(queryData, queryStructure);

      // store the data in the customData object
      var queryName = data["QUERY_META"]["QUERY_TECHN_NAME"];
      var obj = {};
      obj[queryName] = dataElements;
      var customData = $("body").data("customData");
      customData = $.extend(true, customData, obj);

      $("body").data("customData", customData);


      return {
        query: queryName,
        data: dataElements
      }
    }


    function getQueryStructure(queryData) {
      var queryStructure = {
        dimensions: [],
        keyfigures: []
      };

      for (var i = 1; i <= 50; i++) {

        // get the column id (COL_01 to COL_50)
        var colNum = ("0" + i);
        colNum = colNum.substring(colNum.length - 2);

        // check if the column has data
        var rowZeroValue = queryData[0]["COL_" + colNum];
        if (rowZeroValue === "") {
          continue;
        }

        // split the characteristics and the key figures
        if (rowZeroValue.substring(0, 5) !== 'VALUE') {
          queryStructure.dimensions.push({
            col: "COL_" + colNum,
            iobj: queryData[0]["COL_" + colNum]
          });
        } else {
          queryStructure.keyfigures.push({
            col: "COL_" + colNum,
            name: queryData[1]["COL_" + colNum]
          });
        }
      }
      return queryStructure;
    }


    function createQueryElements(queryData, queryStructure) {
      var dataElements = [],
        parsedHierNodes = [],
        i, y;

      for (i = 2; i < queryData.length; i++) {
        var element = {};

        // add the dimensions
        for (y=0; y<queryStructure.dimensions.length; y++) {
          var dimValue = queryData[i][queryStructure.dimensions[y].col];
          var dimKey = dimValue;
          var dimText = dimValue;

          // split key and text (if not structure)
          if (queryStructure.dimensions[y].iobj.length < 25) {
            var splitAt = dimValue.indexOf(" ");
            if (splitAt > -1) {
              dimKey = dimValue.substring(0, splitAt);
              dimText = dimValue.substring(splitAt + 1);
            }
          }

          element[queryStructure.dimensions[y].iobj + "_KEY"] = dimKey;
          element[queryStructure.dimensions[y].iobj + "_TEXT"] = dimText;
        }

        if (element["SH000470_KEY"] && queryStructure.keyfigures.length > 1) {
            element["SH000470_KEY"] = "/" + element["SH000470_KEY"];
        }
        if (element["SH100098_KEY"] && queryStructure.keyfigures.length > 1) {
          element["SH100098_KEY"] = "/" + element["SH100098_KEY"];
        }


        // TODO: CHANGE THIS LOGIC. SHOULD BE HANDLED IN BEX QUERY
        // query contains both the hierarchy nodes and the InfoObjects
        if (parsedHierNodes.indexOf(JSON.stringify(element)) > -1) {
          continue;
        } else {
          parsedHierNodes.push(JSON.stringify(element));
        }

        // create an entry for each key-figure
        for (y=0; y<queryStructure.keyfigures.length; y++) {
          var newElement = JSON.parse(JSON.stringify(element));
          newElement["STR_KF_KEY"] = "DUMMY_STRUCTURE_FOR_KF";
          newElement["STR_KF_TEXT"] = queryStructure.keyfigures[y].name;

          var value = queryData[i][queryStructure.keyfigures[y].col];
          newElement["VALUE"] = (value === "") ? null : parseFloat(value);
          dataElements.push(newElement);
        }
      }
      return dataElements;
    }
  };


  return my;

}(shell.app.execdb.dataparser));

//####src/execdb/readers/offline/app.js
var shell = shell || {};
shell.app = shell.app || {};
shell.app.execdb = shell.app.execdb || {};
shell.app.execdb.offlinereader = ( function (my) {

  my.build = function(elementId, dashboard, sector, businessElement, period) {

    //var data = shell.app.execdblp.dataprovider.getData(),
      var data,$body = $("body"),
      currentVersion, currentSnapshot, arrPeriod, currentPeriod, i;

      data = $body.data("offline_data");

    $body.unbind("dashboardLoaded");
    $body.on("dashboardLoaded", function () {
      shell.app.execdb.developerbuttons_offline.buildDeveloperButtons();
    });

    // check if the mandatory parameters are provided
    if (!dashboard || !period || !sector || !businessElement) {
      my.showMessage("Error", "Mandatory parameters not provided (dashboard, period, sector, businessElement).");
      return;
    }

    // store the report parameters
    $body.data("customAppFilters", {
      sector : sector,
      businessElement: businessElement,
      dashboard: dashboard
    });

    // transform the period from yyyy.mm to mm.yyyy
    arrPeriod = period.split('.');
    currentPeriod = arrPeriod[1] + "." + arrPeriod[0];

    // get the data
    if (!data || !data.length) {
      my.showMessage("No Data", "No data available.");
      return;
    }

    // loop over the data and find the launchpad report name
    for (i=0; i<data.length; i++) {
      if (data[i]["dashboard"] === dashboard
        && data[i]["period"] === currentPeriod) {

        currentVersion = data[i]["version"];
        if (data[i]["status"] && data[i]["status"].toString() === "10") {
          currentVersion += " - Draft";
        }

        try{
          currentSnapshot = JSON.parse(data[i]["snapshot"]);
        } catch(e) {
        }
        break;
      }
    }
    if (!currentSnapshot) {
      my.showMessage("No Data", "No data available.");
      return;
    }

    // create the dashboard
    //try {
      shell.app.execdb.dashboard.build(
        elementId,
        JSON.parse(LZString.decompressFromEncodedURIComponent(currentSnapshot.config)),
        JSON.parse(LZString.decompressFromEncodedURIComponent(currentSnapshot.data))
      );

    //}catch (err) {
    //  console.error("Unable to read the dashboard configuration.");
    //}

    // set the version
    my._addVersion(currentVersion);

  };

  return my;
}(shell.app.execdb.offlinereader || {}));

//####src/execdb/readers/offline/mod_addversion.js
shell.app.execdb.offlinereader = ( function (my) {

  my._addVersion = function(versionNumber) {

    // first remove the div
    $("#jbi_version").remove();

    $("body").data("currentVersion", versionNumber);

    if (!versionNumber) {
      return;
    }

    // get the configuration for the styles
    var customConfig = $("body").data("customConfig"),
      headerConfig = (customConfig && customConfig["CONFIG"] && customConfig["CONFIG"]["header"]) ? customConfig["CONFIG"]["header"] : {},
      posX = headerConfig["VersionXPositionPixels"] || 10,
      posY = headerConfig["VersionYPositionPixels"] || 10,
      fontColor = headerConfig["VersionFontColor"] || "black",
      fontSize = headerConfig["VersionFontSizePixels"] || 12;

    var html = "";
//@formatter:off
    html += "<div id='jbi_version'";
    html += "   style='position:absolute;font-family:tahoma;left:" + posX + "px;top:" + posY + "px;color:" + fontColor + ";font-size:" + fontSize + "px;'>";
    html += "Version " + versionNumber;
    html += "</div>";
//@formatter:on

    $("#jbi_app").append(html);


  };


  return my;
}(shell.app.execdb.offlinereader || {}));

//####src/execdb/readers/offline/mod_messagedisplayer.js
shell.app.execdb.offlinereader = ( function (my) {

  /**
   * Show a message in the front-end
   * @param title {string} the title of the message
   * @param message {string} the contents of the message
     */
  my.showMessage = function (title, message) {
//@formatter:off
    var s = "";
    s += "<div id='loadingContainer' style='width:330px;padding:5px;position:fixed;top:50%;left:50%;margin:-70px 0 0 -170px;background-color:#EEEEEE;border-radius:5px;font-family: Verdana, Geneva, sans-serif;font-size: 16px;'>";
      s += "<div class=\"loadingTitle\" style='font-weight:bold;text-align:center;line-height:30px;border-bottom:1px solid white;'>" + title + "</div>";
      s += "<div class=\"loadingText\" style='padding:16px;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;font-size:14px;line-height: 20px;'>" + message + "</div>";
    s += "</div>";
//@formatter:on
    $("body").append(s);

  };

  return my;
}(shell.app.execdb.offlinereader || {}));

//####src/execdb/readers/offline/mod_urlparams.js
shell.app.execdb.offlinereader = ( function (my) {

  /**
   * Helper function for retrieving the URL parameters
   * @param {Array} params Holding the URL parameter names to be retrieved
   * @returns {object} the URL parameters as properties of an object
   */
  my._getURLParams = function (params) {
    var pars = {};
    for (var i = 0; i < params.length; i++) {
      pars[params[i]] = getUrlParameter(params[i]);
    }
    return pars;

    function getUrlParameter(sParam) {
      var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;
      for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] === sParam) {
          return sParameterName[1] === undefined ? true : sParameterName[1];
        }
      }
    }
  };

  return my;
}(shell.app.execdb.offlinereader || {}));

//####src/execdb/devbuttons/offline/app.js
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

//####src/execdb/devbuttons/offline/mod_utilities.js
shell.app.execdb.developerbuttons_offline = ( function (my) {
  
  // check for mobile thingies
  my.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  my.eventTrigger = (my.isMobile) ? "touchstart" : "click";

  return my;

}(shell.app.execdb.developerbuttons_offline));
