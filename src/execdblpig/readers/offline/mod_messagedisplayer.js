shell.app.execdblp.offlinereader = ( function (my) {

  /**
   * Show a message in the front-end
   * @param title {string} the title of the message
   * @param message {string} the contents of the message
     */
  my.showMessage = function (title, message) {
//@formatter:off
    var s = "";
    s += "<div id='loadingContainer' style='width:330px;padding:5px;position:fixed;top:50%;left:50%;margin:-70px 0 0 -170px;background-color:#EEEEEE;border-radius:5px;font-family: Verdana, Geneva, sans-serif;font-size: 16px;'>";
      s += "<div class=\"loadingTitle\" style='font-weight:bold;text-align:center;line-height:30px;border-bottom:1px solid white;'>" + title + "</div>";
      s += "<div class=\"loadingText\" style='padding:16px;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;font-size:14px;line-height: 20px;'>" + message + "</div>";
    s += "</div>";
//@formatter:on
    $("body").append(s);

  };

  return my;
}(shell.app.execdblp.offlinereader || {}));
