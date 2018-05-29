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
