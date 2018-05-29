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
