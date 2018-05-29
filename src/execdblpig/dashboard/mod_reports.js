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
