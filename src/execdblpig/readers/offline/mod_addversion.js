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
