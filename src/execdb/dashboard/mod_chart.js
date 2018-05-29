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
