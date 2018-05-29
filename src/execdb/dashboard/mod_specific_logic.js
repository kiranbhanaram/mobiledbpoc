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
