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