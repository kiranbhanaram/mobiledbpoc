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
