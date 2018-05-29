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
