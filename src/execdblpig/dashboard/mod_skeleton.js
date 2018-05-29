shell.app.execdblp.dashboard = ( function (my) {

  my._buildSkeleton = function (elementId) {

    // Set the application CSS and HTML
    my._applyStyles();
    setHTML();

    /**
     * HTML
     * Add the framework specific HTML
     **/
    function setHTML( ){
      var s = "";
//@formatter:off
      s += "<div id='jbi_container'>"
           + "<div id='jbi_app'>"
             + "<div id='jbi_header'></div>"
             + "<div id='jbi_summary'></div>"
             + "<div id='jbi_reports'></div>"
             + "<div id='jbi_trend'></div>"
           + "</div>"
         + "</div>";
//@formatter:on
      // add the HTML placeholders to the component
      $("#" + elementId).html(s);
    }

  };

  return my;

}(shell.app.execdblp.dashboard));
