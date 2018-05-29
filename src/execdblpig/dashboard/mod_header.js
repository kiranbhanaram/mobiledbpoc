shell.app.execdblp.dashboard = ( function (my) {

    /**
     * buildHeader
     *
     * This function creates the header of the report. Takes care about the filters
     * that are part in the header. The look and feel of the header is driven from
     * the configuration object.
     *
     * @private
     */
    my._buildHeader = function () {
      var $customConfig = $('body').data('customConfig');
      var headerConfig = $customConfig && $customConfig.CONFIG && $customConfig.CONFIG.header;
      if(headerConfig === undefined) {
        headerConfig = getConfig();
      }

      addCSS(headerConfig);
      addHTML(headerConfig);
      addEventlisteners();


      function addCSS(headerConfig) {
        var $customConfig = $("body").data("customConfig");
        var fontFamily = ($customConfig && $customConfig["CONFIG"] && $customConfig["CONFIG"]["dashboard"] && $customConfig["CONFIG"]["dashboard"]["FontFamily"]) || 'Futura, "Trebuchet MS", Arial, sans-serif';

        // generate the CSS based on the configuration
//@formatter:off
      var s = "";
      s += "<style type='text/css' id='CSS_JBI_HEADER' data-repstyle='execdblp'>" +
            "#jbi_header{" +
              "position: relative;" +
              "display: block;" +
              "height:" + headerConfig["HeightPixels"] + "px;" +
              "background-color: " + headerConfig["BackgroundColor"] + ";" +
            "}" +
            "#jbi_header_title{" +
              "position: absolute;" +
              "display: inline-block;" +
              "line-height: " + headerConfig["HeightPixels"] + "px;" +
              "color: " + headerConfig["FontColor"] + ";" +
              "font-family: Futura, 'Trebuchet MS', Arial, sans-serif;" +
              "font-size: " + headerConfig["FontSizePixels"] + "px;" +
              "font-weight: bold;" +
              "left: " + headerConfig["TitleXPosition"] + "px;" +
              "top: " + headerConfig["TitleYPosition"] + "px;" +
            "}";

      if (headerConfig.SubTitleEnabled === 'True') {
        s += "#jbi_header_subtitle{" +
          "position: absolute;" +
          "display: inline-block;" +
          "line-height: " + headerConfig.HeightPixels + "px;" +
          "color: " + headerConfig.SubTitleFontColor + ";" +
          "font-family: Futura, 'Trebuchet MS', Arial, sans-serif;" +
          "font-size: " + headerConfig.SubTitleFontSize + ";" +
          "left: " + headerConfig.SubTitleXPosition + "px;" +
          "top: " + headerConfig.SubTitleYPosition + "px;" +
        "}";
      }

      s += "#jbi_header_logo{" +
              "width: " + headerConfig["LogoWidthPixels"] + "px;" +
              "height: " + headerConfig["LogoHeightPixels"] + "px;" +
              "position:absolute;" +
              "top: " + headerConfig["LogoYPosition"] + "px;" +
              "left: " + headerConfig["LogoXPosition"] + "px;";
            s += "display: " + (headerConfig["LogoEnabled"] !== "True") ? "block;" : "none;";
            s += "}" +
            "#jbi_header_reports{" +
              "float: right;" +
              "max-height: 35px;" +
              "box-sizing: border-box;" +
              "overflow: hidden;" +
            "}" +
            ".jbi_header_report{" +
              "display:inline-block;" +
              "width:35px;" +
              "height:35px;" +
              "font-family:" + fontFamily + ";" +
              "text-align: center;" +
              "vertical-align:top;" +
              "border-left: 1px solid lightgrey;" +
              "border-bottom: 1px solid lightgrey;" +
              "box-sizing: border-box;" +
            "}" +
            ".jbi_header_report span{" +
              "opacity: 0.2;" +
            "}" +
            ".jbi_header_report.active span{" +
              "opacity: 1;" +
            "}" +
            ".jbi_header_report.active{" +
              "cursor: pointer;" +
            "}";
          if (!my.isMobile) {
            s += ".jbi_header_report.active:hover{" +
              "background-color: " + headerConfig["PublishedReportLinkBackgroundHoverColor"] + ";" +
              "-webkit-transition: background-color 200ms ease-in-out;" +
              "-moz-transition: background-color 200ms ease-in-out;" +
              "-o-transition: background-color 200ms ease-in-out;" +
              "transition: background-color 200ms ease-in-out;" +
            "}" +
            ".jbi_header_glossary:hover{" +
              "background-color: " + headerConfig["PublishedReportLinkBackgroundHoverColor"] + ";" +
              "-webkit-transition: background-color 200ms ease-in-out;" +
              "-moz-transition: background-color 200ms ease-in-out;" +
              "-o-transition: background-color 200ms ease-in-out;" +
              "transition: background-color 200ms ease-in-out;" +
            "}";
          }
         s+= "#jbi_header_glossary{" +
              "float: right;" +
              "margin-right: 160px;" +
              "max-height: 35px;" +
              "box-sizing: border-box;" +
              "overflow: hidden;" +
            "}";




      // General report link styles
      s += "#jbi_header .jbi_header_icon{";
      s += " width: 42px;";
      s += "}";
      s += "#jbi_header .jbi_header_icon i{";
      s += " line-height: " + headerConfig.HeightPixels + "px;";
      s += " color: #FFFFFF;";
      s += " font-size: 25px;";
      s += "}";
      s += "#jbi_header .jbi_header_button{";
      s += " text-align: center;";
      s += " position: absolute;";
      s += " display: inline-block;";
      s += " border-left: 1px solid lightgrey;";
      s += " border-bottom: 1px solid lightgrey;";
      s += "}";
      s += ".jbi_header_period_filter_active{";
      s += " background-color: #E7EFF3;";
      s += "}";

      // Period filter styles
      s += "#jbi_header_period{";
      s += " position: absolute;";
      s += " max-height:35px;";
      s += " display: inline-block;";
      s += " right: 0;";
      s += " color: " + headerConfig["PeriodFilterFontColor"] + ";";
      s += " font-size: " + headerConfig["PeriodFilterFontSizePixels"] + "px;";
      s += " font-family: " + fontFamily + ";";
      s += " text-align: center;";
      s += " width: 160px;";
      s += " line-height: " + headerConfig["HeightPixels"] + "px;";
      s += " text-transform: uppercase;";
      s += " font-weight: bold;";
      s += " list-style: none;";
      s += " margin: 0;";
      s += " padding: 0;";
      s += " z-index: 99;";
      s += " cursor: pointer;";
      s += " box-sizing: border-box;";
      s += "}";
      if (!my.isMobile) {
        s += "#jbi_header_period:hover{";
        s += " background-color: " + headerConfig["PublishedReportLinkBackgroundHoverColor"] + ";";
        s += " -webkit-transition: background-color 200ms ease-in-out;";
        s += " -moz-transition: background-color 200ms ease-in-out;";
        s += " -o-transition: background-color 200ms ease-in-out;";
        s += " transition: background-color 200ms ease-in-out;";
        s += "}";
      }
      s += "#jbi_header_period_filter_items{";
      s += " display: block;";
      s += " color: " + headerConfig["PeriodFilterItemsFontColor"] + ";";
      s += " font-size: " + headerConfig["PeriodFilterItemsFontSizePixels"] + "px;";
      s += " font-family: " + fontFamily + ";";
      s += " background-color: " + headerConfig["PeriodFilterItemsBackground"] + ";";
      s += " text-align: " + headerConfig["PeriodFilterItemsTextAlign"] + ";";
      s += " width: 160px;";
      s += " line-height: 40px;";
      s += " text-transform: uppercase;";
      s += " font-weight: bold;";
      s += " list-style: none;";
      s += " margin: 0;";
      s += " margin-top: -1px;";
      s += " padding: 0;";
      s += " box-sizing: border-box;";
      s += " border: 1px solid lightgrey;";
      s += " max-height:300px;";
      s += " overflow-y:auto;";
      s += " display:none;";
      s += "}";
      s += ".jbi_header_filter_value{";
      s += " border-bottom: 1px solid #D7D7D7;";
      s += " border-left: 1px solid #D7D7D7;";
      s += " line-height: 38px;";
      s += " background-color: white;";
      s += " padding: 0 5px 0 5px;";
      s += "}";
      if (!my.isMobile) {
        s += ".jbi_header_filter_value:hover{";
        s += " background-color: #F2F2F2;";
        s += "}"
      }
      s += "</style>";
//@formatter:on

        // Add the CSS to the head of the HTML page
        $(s).appendTo("head");
      }


      /**
       * addHTML
       *
       * Add the HTML for the header page
       */
      function addHTML(headerConfig) {
        // get the periods for the filters
        var $body = $("body"),
          periods = $body.data("customPeriods"),
          i;

//@formatter:off
      var s = "<div id='jbi_header_title'>" + headerConfig["Title"] + "</div>";

      if (headerConfig.SubTitleEnabled === 'True') {
        s += "<div id='jbi_header_subtitle'>" + (headerConfig.SubTitleContent || '') + "</div>";
      }

      s += "<img id='jbi_header_logo' src='" + shell.app.execdblp.dashboard._getLogoBase64() + "'>"


      // Glossary button
      + "<div id='jbi_header_glossary'>" +
          "<div class='jbi_header_report active' title='Glossary' data-jbiid='glossary'><img style='margin-top:5px;' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4yMfEgaZUAAAKcSURBVFhHzZg9rzFRFIUVCgWhUIgoFBIKlRAKhZJEoVBohEKhVGp8JAqlwg8gIVH6ieeddZNJ5uy95uMO980UT+Qse629Y8zHmZQxJtFQMUlQMUlQMQ7v99vcbjeDT/ndJ1AxCuv12hSLRSch5Qu+X61WTjnPiAIV/Xg8HqbX66lBotButw38MjMMKjIWi4VqGgfkyOwgqCipVCqqkUuz2XRKtKfRaNB6gDxZ7wcVXfCHT6fTqoGXwWDglGovdFbvgtwoJxQVXer1ugqWxB0QIF/6JFQEo9FIBTI+GRCgj/R6oSIuDSyMUavVHIvOqFartJ4RdCmiYiaTUSF/CfrJGVyUsNlsVMD/AH3lLEAJ2WxWmRnD4dAsl0vKbDYLPfsl6CtnAdbicrkoI6NUKjnldpCk3+9TbxDX69Wx2jnWYj6fKxOjUCg45XaQJOpZ7AX9ZY61iBr6VwOyS5a1CHs6cYlyiOMMyHLthTAEMR6Pf06I8/nsWO1QEGdAIHPshSiOAjss4E8GLJfLyhDGNwdEf5ljLbrdrjKF8c0B0V/mWIvpdKpMYXxzQPSXOdZiu90qUxjfHBD9ZY61ALlcThmD+NaA6CszgBJwj2UBElxesM2Ufi/4/ng8Ur8EfaUfKOH5fCqzJMqdxAvqWY4X9JU+oASAjRALccHDqPQEIf0Sv40XoCII2o988xcM25dQEbxeLxXmgnu2rA9C+r2gj6z3QkUXvN5goQCHBWdqGEH7Y+TLnhIqetnv9yafz6vwT8AhR67sxaCi5H6/m1arpRrFATnIkz38oKIfeMT67V7DBb7JZOLE8Gw/qBjG4XAwnU5HDcHAL7bb7RwbzwqDir8Br9ROp9PPwytOCnxiHedVG4OKSYKKSYKKycGk/gFklHOJdFd2YAAAAABJRU5ErkJggg==' width='25px' height='25px' /></div>" +
        "</div>"

      // Reports
      + "<div id='jbi_header_reports'></div>"

     // Period filter
       + "<ul id='jbi_header_period' class='jbi_header_button'>"
         + "<li id='jbi_header_period_filter'>"
          + "<span> </span>"
          + "<ul id='jbi_header_period_filter_items'>";
          for (i = 0; i < periods.length; i++) {

            // show the version and the status in case they are provided.
            if (periods[i].version && periods[i].status) {
              var statusText = "",
                statusTextStyle = 'color:#505050;font-weight:bold;';
              if (periods[i].status === "10") {
                statusText = " (DRAFT)";
                statusTextStyle = "color:red;font-weight:normal;";
              } else if (periods[i].status === "20") {
                statusText = " (INACTIVE)";
                statusTextStyle = "color:red;font-weight:normal;"
              }

              s += "<li";
                s += " data-version='" + periods[i].version + "'";
                s += " data-status='" + periods[i].status + "'";
                s += " data-filterkey='" + periods[i].id + "'";
                s += " data-filtertext='" + periods[i].name + "'";
                s += " style='text-align:left;padding:10px 5px;line-height:normal;box-sizing:border-box;'";
                s += " class='" + ((i === 0) ? "jbi_header_period_filter_active" : "") + "'";
                s += ">";
                  s += "<span>" + periods[i].name + "</span>";
                  s += "<div style='block;font-size:9px;text-transform:initial;font-weight:normal;" + statusTextStyle + "'>Version: " + periods[i].version + statusText + "</div>";
              s += "</li>";
            } else {
              s += "<li data-filterkey='" + periods[i].id + "' data-filtertext='" + periods[i].name + "' class='" + ((i === 0) ? "jbi_header_period_filter_active" : "") + "'>";
                s += "<span>" + periods[i].name + "</span>";
              s += "</li>";
            }
          }
          s += "</ul>"
           + "</li>"
         + "</ul>";
//@formatter:on
        $("#jbi_header").html(s);


        // set the initial selected value
        var initalSelectedText = $("#jbi_header_period_filter_items .jbi_header_period_filter_active").data("filtertext");
        $("#jbi_header_period_filter > span").html(initalSelectedText + " <svg style='position:relative;right:3px;top:8px;float:right;' class='filter_click_down_icon' width='12px' height='12px' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'><path d='M1408 704q0 26-19 45l-448 448q-19 19-45 19t-45-19l-448-448q-19-19-19-45t19-45 45-19h896q26 0 45 19t19 45z'></path></svg>");
      }


      function addEventlisteners() {

        // period filter click (to open the filter values)
        var $jbi_header_period = $("#jbi_header_period");
        $jbi_header_period.unbind(my.eventTrigger);
        $jbi_header_period.on(my.eventTrigger, function () {
          $('#jbi_header_period_filter_items').fadeToggle(300);
        });


        // period click (to select a period)
        var $periodItemButton = $("#jbi_header_period ul li");
        $periodItemButton.unbind(my.eventTrigger);
        $periodItemButton.on(my.eventTrigger, function () {

          // get the selected item
          var filterText = $(this).data("filtertext"),
            filterKey = $(this).data("filterkey"),
            versionNumber = $(this).data("version");
          $("#jbi_header_period_filter > span").html(filterText + " <svg style='position:relative;right:3px;top:10px;float:right;' class='filter_click_down_icon' width='12px' height='12px' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'><path d='M1408 704q0 26-19 45l-448 448q-19 19-45 19t-45-19l-448-448q-19-19-19-45t19-45 45-19h896q26 0 45 19t19 45z'></path></svg>");

          // add the class 'jbi_header_period_filter_active' to the selected item
          $("#jbi_header_period_filter_items li").removeClass("jbi_header_period_filter_active");
          $(this).addClass("jbi_header_period_filter_active");
          $("body").trigger("periodUpdate", [filterKey, versionNumber]);
        });

        var $glossary = $("#jbi_header_glossary");
        $glossary.unbind(my.eventTrigger);
        $glossary.on(my.eventTrigger, function () {
          window.location.href = "glossary.html";
        });
      }

      //Helper function
      /**
       * Read the header configuration
       * @returns {object} Header configuration object
       */
      function getConfig() {
        return {
          "Title": "MI LAUNCHPAD",
          "BackgroundColor": "white",
          "HeightPixels": 35,
          "FontColor": "#dd1d21",
          "FontSizePixels": 14,
          "TitleYPosition": 0,
          "TitleXPosition": 70,
          "LogoEnabled": "True",
          "LogoWidthPixels": 50,
          "LogoHeightPixels": 50,
          "LogoYPosition": 0,
          "LogoXPosition": 4,
          "PeriodFilterFontColor": "#505050",
          "PeriodFilterFontSizePixels": 12,
          "PeriodFilterItemsFontColor": "#505050",
          "PeriodFilterItemsFontSizePixels": 12,
          "PeriodFilterItemsBackground": "white",
          "PeriodFilterItemsTextAlign": "center",
          "UnpublishedReportLinkFontColor": "lightgrey",
          "UnpublishedReportLinkBackground": "white",
          "PublishedReportLinkFontColor": "#505050",
          "PublishedReportLinkBackground": "white",
          "PublishedReportLinkBackgroundHoverColor": "#EFEFEF",
          "GlossaryIcon": "<svg style=\"width:25px;height:25px;padding-top:5px;\" width=\"1792\" height=\"1792\" viewBox=\"0 0 1792 1792\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M1152 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zm-128-896v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zm640 416q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z\"/></svg>"
        }
      }
    };


    return my;

  }(shell.app.execdblp.dashboard)
);
