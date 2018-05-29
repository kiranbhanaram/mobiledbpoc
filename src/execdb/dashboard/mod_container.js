shell.app.execdb.dashboard = ( function (my) {

  my._buildContainers = function (containersConfig, containersData) {

    // add event listeners
    addContainerEventListeners();

    // Create the containers one by one
    for (var container in containersConfig) {
      if (containersConfig.hasOwnProperty(container)) {
        // Get the data
        var dataId = "";
        for (var i = 0; i < containersData.length; i++) {
          if ("container" + containersData[i].containerId === container) {
            dataId = containersData[i].containerData;
            break;
          }
        }

        // Create the container itself
        createContainerDiv(container, containersConfig[container], dataId);

        // Set the comment
        my._addContainerCommentary(container);


        // Add the content
        addContainerContent(container, containersConfig[container], dataId);
      }
    }

    function addContainerEventListeners() {
      var $body = $("body");
      $body.unbind("showContainerMessage");
      $body.on("showContainerMessage", function(evt, message) {
        var msgType = "";
        switch (message.type) {
          case "E" :
            msgType = "error";
            break;
          case "W" :
            msgType = "warning";
            break;
        }

        var html = "<div class='message-placeholder'><div class='message " + msgType + "'>" + message.message + "</div></div>";
        $("#" + message.container + "Content").append(html);
      })
    }


    /**
     * Create the HTML elements and the CSS
     *
     * Add the CSS for the specific container and the HTML
     *
     * @param containerDiv      the DIV element in which the container needs to be rendered
     * @param cfg               the configuration settings for the DIV
     * @param containerDataIds  the dataId for the container
     */
    function createContainerDiv(containerDiv, cfg, containerDataIds) {

      var titleEnabled = (cfg.config["TitleEnabled"] === "True"),
        footerEnabled = (cfg.config["FooterEnabled"] === "True"),
        $body = $("body"),
        businessData,
        kpiName, businessName, dataIds, dataId;

      // get the CSS values based on the parameters
      var titleDisplay = titleEnabled ? "block" : "none",
        titleHeightPixels = (titleEnabled && cfg.config["TitleHeightPixels"]) ? cfg.config["TitleHeightPixels"] : 0,
        titleLabel = (titleEnabled && cfg.config["TitleLabel"]) ? cfg.config["TitleLabel"] : "",
        titleMarginTop = (titleEnabled && cfg.config["TitleMarginTop"]) ? cfg.config["TitleMarginTop"] : "0",
        footerLabel = (footerEnabled && cfg.config["FooterLabel"]) ? cfg.config["FooterLabel"] : "",
        footerDisplay = footerLabel !== "" ? "block" : "none";

      // replace placeholders in the title
      try {
        if (titleLabel) {
          // business name
          businessData = $body.data("customDataApp").datasets[$body.data("currentBusiness")];
          businessName = (businessData && businessData.text) ? businessData.text : "Business";
          titleLabel = titleLabel.replace(/<=business=>/g, businessName);

          // KPI name (first)
          dataIds = (containerDataIds) ? containerDataIds.split(";") : null;
          dataId = (dataIds && dataIds.length) ? dataIds[0] : null;
          kpiName = (dataId && businessData && businessData.kpis && businessData.kpis[dataId] )
            ? businessData.kpis[dataId].text
            : "KPI";
          titleLabel = titleLabel.replace(/<=kpi=>/g, kpiName);
        }
      } catch(err) {}

      // CSS
      var s = "";
      s += "<style type='text/css' id='CSS_Layout_1_" + containerDiv + "' data-group='LAYOUT'  data-repstyle='execdb'>";
      s += "#" + containerDiv + "ContentBox{";
      if (cfg.config["BorderEnabled"] && cfg.config["BorderEnabled"] === 'False') {
        s += "    border-style:none;";
      }
      if (cfg.config["MaxContentWidth"] !== undefined && cfg.config["MaxContentWidth"] !== null && cfg.config["MaxContentWidth"] !== "") {
        s += "    max-width:" + cfg.config["MaxContentWidth"] + "px;";
        //s += "    margin: 0 auto;"
      }
      s += "}";
      s += "#" + containerDiv + "Title{";
      s += "    display: " + titleDisplay + ";";
      s += "    margin-top:" + titleMarginTop + "px;";
      s += "}";
      s += "#" + containerDiv + "ZoomButton{";
      s += "    float: right;";
      s += "    position: absolute;";
      s += "    font-size: 14px;";
      s += "    text-align : center;";
      s += "    height: " + titleHeightPixels + "px;";
      s += "    width : 25px;";
      s += "    right: 0;";
      s += "    top: 0;";
      s += "    color: #333;";
      s += "    line-height: " + titleHeightPixels + "px;";
      s += "}";
      if (!my.isMobile) {
        s += "#" + containerDiv + "ZoomButton:hover{";
        s += "    background-color: #D8D8D8;";
        s += "    cursor: pointer;";
        s += "}";
      }
      s += "#" + containerDiv + "Content{";
      s += "    background-color: white;";
      s += "    position: relative;";
      s += "    overflow: auto;";
      if (cfg.config["MinContentHeight"])
        s += "    min-height : " + cfg.config["MinContentHeight"] + ";";
      if (cfg.config["MaxContentHeight"])
        s += "    max-height : " + cfg.config["MaxContentHeight"] + ";";
      if (cfg.config["Height"])
        s += "    height : " + cfg.config["Height"] + ";";
      s += "}";
      s += "#" + containerDiv + "Titlebar{";
      if (titleEnabled) {
        s += "    display: " + titleDisplay + ";";
      } else {
        s += "    display: none;";
      }
      s += "}";
      s += "#" + containerDiv + "Footer{";
      s += "    display: " + footerDisplay + ";";
      s += "}";
      s += "</style>";
      $(s).appendTo("head");

      // HTML
      var strHTML = "";
      strHTML += "<div id=\"" + containerDiv + "ContentBox\" class='container-content-box'>";
      strHTML += "   <div id=\"" + containerDiv + "Titlebar\" class='container-titlebar'>";
      strHTML += "      <div id=\"" + containerDiv + "Title\" class='container-title'>" + titleLabel + "</div>";

      if (!cfg.config["ShowExpandButton"] || cfg.config["ShowExpandButton"] !== "False") {
        strHTML += "      <div id=\"" + containerDiv + "ZoomButton\" class='zoomButton'><svg style='margin-top:3px;' width=\"16px\" height=\"16px\" viewBox=\"0 0 1792 1792\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M883 1056q0 13-10 23l-332 332 144 144q19 19 19 45t-19 45-45 19h-448q-26 0-45-19t-19-45v-448q0-26 19-45t45-19 45 19l144 144 332-332q10-10 23-10t23 10l114 114q10 10 10 23zm781-864v448q0 26-19 45t-45 19-45-19l-144-144-332 332q-10 10-23 10t-23-10l-114-114q-10-10-10-23t10-23l332-332-144-144q-19-19-19-45t19-45 45-19h448q26 0 45 19t19 45z\"/></svg></div>";
      }
      strHTML += "   <\/div>";
      strHTML += "   <div id=\"" + containerDiv + "Content\" class=\"containerContent\"></div>";
      strHTML += "   <div id=\"" + containerDiv + "Footer\" class='container-footer'>" + footerLabel + "</div>";
      strHTML += "<\/div>";
      $("#" + containerDiv).html(strHTML);


      // Event handlers
      var $zoomButton = $("#" + containerDiv + "ZoomButton");
      $zoomButton.unbind(my.eventTrigger);
      $zoomButton.on(my.eventTrigger, function (e) {
        e.preventDefault();

        var currentViewObject = JSON.parse($("body").data("currentView"));

        $("#jbi_content").fadeOut("fast", function () {
          $("#jbi_content").empty();
          $("#jbi_application").hide();

          my._buildContainersFullscreen(currentViewObject.viewId + containerDiv);
        });
      });
    }


    /**
     * Add the container content
     *
     * Based on the settings add the content (is FN_OBJECT_*) to the
     * container.
     *
     * @param containerDiv  the DIV element in which the container needs to
     *                      be rendered
     * @param cfg           the configuration settings for the DIV
     * @param dataId        the dataId for the container
     */
    function addContainerContent(containerDiv, cfg, dataId) {

      // check if the containerDiv is existing
      if ($("#" + containerDiv).length === 0) {
        return;
      }

      // check if a configuration is avaible
      if (!cfg || !cfg.config["ContainerObject"]) {
        return;
      }

      // get the dataset for the selected business
      var businessData = null;
      var $jbi_businesses = $('#jbi_businesses');
      if ($jbi_businesses.jstree) {
        var businessId = $jbi_businesses.jstree('get_selected')[0];
        var customData = $("body").data("customDataApp");
        if (customData.datasets && customData.datasets[businessId]) {
          businessData = customData.datasets[businessId];
        }
      }

      // check which object needs to be displayed
      var contentCfg;
      switch (cfg.config["ContainerObject"]) {
        case 'FreeFormat' :
          contentCfg = cfg.free;
          my._createFreeformat(containerDiv, contentCfg, dataId, businessData);
          break;

        case 'Grid' :
          contentCfg = cfg.grid;
          my._createGrid(containerDiv, contentCfg, dataId, businessData);
          break;

        case 'Table' :
          contentCfg = cfg.table;
          my._createTable(containerDiv, contentCfg, dataId, businessData);
          break;

        case 'Chart' :
          contentCfg = cfg.chart;
          my._createChart(containerDiv, contentCfg, dataId, businessData);
          break;

        case 'BulletChart':
          contentCfg = cfg.bullet;
          my._createBulletChart(containerDiv, contentCfg, dataId, businessData);
          break;

        case 'TrendChart':
          contentCfg = cfg.trendchart;
          my._createTrendChart(containerDiv, contentCfg, dataId, businessData);
          break;

        case 'HTMLCommentary':
          contentCfg = cfg.htmlcommentary;
          my._createHTMLCommentary(containerDiv, contentCfg, dataId, businessData);
      }

      // check if there is a content configuration available
      if (!contentCfg) {
        $("body").trigger("showContainerMessage", {
          container: containerDiv,
          message: "No configuration found for the current selection.",
          type: "E"
        });
      }
    }

  };


  return my;


}(shell.app.execdb.dashboard));
