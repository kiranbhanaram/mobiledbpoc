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