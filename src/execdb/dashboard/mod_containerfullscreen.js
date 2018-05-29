shell.app.execdb.dashboard = ( function (my) {

  my._buildContainersFullscreen = function (currentContainer) {

    // add the CSS and HTML
    addCSS();
    buildHTML();

    // get the container information
    getViewContainers();
    setNavigation(currentContainer);


    function setNavigation(currentContainer) {
      var $zoomContainerViewContent = $("#zoomContainerViewContent"),
        $zoomContainerViewTitle = $("#zoomContainerViewTitle"),
        $zoomContainerBackButton = $("#zoomContainerBackButton"),
        $zoomContainerForwardButton = $("#zoomContainerForwardButton");


      $zoomContainerViewContent.fadeOut("slow", function () {

        $("[data-group='LAYOUT']").remove();
        $zoomContainerViewContent.html("");

        // get the configuration of all containers for this view
        var containersConfig = $("#zoomContainer").data("containers");

        // get the configuration of the current container
        var idxCurrentContainer = -1;
        for (var i = 0; i < containersConfig.length; i++) {
          if (containersConfig[i].containerId === currentContainer) {
            idxCurrentContainer = i;
            break;
          }
        }
        if (idxCurrentContainer === -1) {
          return;
        }

        // set the view title
        var viewTitle = ( containersConfig[idxCurrentContainer].name === undefined) ? "" : containersConfig[idxCurrentContainer].name;
        $zoomContainerViewTitle.find("span").html(viewTitle);


        // if there is only one container, let the navigation buttons hidden
        if (containersConfig.length > 1) {

          // previous config
          var previousContainerConfig, nextContainerConfig;
          if (idxCurrentContainer === 0) {
            previousContainerConfig = containersConfig[containersConfig.length - 1];
          } else {
            previousContainerConfig = containersConfig[idxCurrentContainer - 1];
          }
          $zoomContainerBackButton.find("span").html(previousContainerConfig.name);
          $zoomContainerBackButton.data("currentContainer", previousContainerConfig.containerId);

          // next config
          if (idxCurrentContainer === containersConfig.length - 1) {
            nextContainerConfig = containersConfig[0];
          } else {
            nextContainerConfig = containersConfig[idxCurrentContainer + 1];
          }
          $zoomContainerForwardButton.find("span").html(nextContainerConfig.name);
          $zoomContainerForwardButton.data("currentContainer", nextContainerConfig.containerId);

          // show the buttons
          $zoomContainerBackButton.show();
          $zoomContainerForwardButton.show();
        }

        // get the dataset for the selected business
        var businessData = null,
          $jbiBusiness = $("#jbi_businesses");
        if ($jbiBusiness.jstree) {
          var businessId = $jbiBusiness.jstree('get_selected')[0];
          var customData = $("body").data("customDataApp");
          if (customData.datasets && customData.datasets[businessId]) {
            businessData = customData.datasets[businessId];
          }
        }

        // populate the container
        var contentCfg;
        var currentConfig = containersConfig[idxCurrentContainer];
        switch (currentConfig.config.config.ContainerObject) {
          case 'FreeFormat' :
            contentCfg = currentConfig.config.free;
            my._createFreeformat("zoomContainerView", contentCfg, currentConfig.dataId, businessData);
            break;

          case 'Grid' :
            contentCfg = currentConfig.config.grid;
            my._createGrid("zoomContainerView", contentCfg, currentConfig.dataId, businessData);
            break;

          case 'Table' :
            contentCfg = currentConfig.config.table;
            my._createTable("zoomContainerView", contentCfg, currentConfig.dataId, businessData);
            break;

          case 'Chart' :
            contentCfg = currentConfig.config.chart;
            my._createChart("zoomContainerView", contentCfg, currentConfig.dataId, businessData);
            break;

          //case 'HTML' :
          //  contentCfg = currentConfig.config.html;
          //  break;

          case 'BulletChart':
            contentCfg = currentConfig.config.bullet;
            my._createBulletChart("zoomContainerView", contentCfg, currentConfig.dataId, businessData);
            break;

          case 'BulletChartContainer':
            contentCfg = currentConfig.config.bullet;
            my._createBulletChartContainer("zoomContainerView", contentCfg, currentConfig.dataId, currentContainer);
            break;

          case 'TrendChart':
            contentCfg = currentConfig.config.trendchart;
            my._createTrendChart("zoomContainerView", contentCfg, currentConfig.dataId, businessData);
            break;

          case 'HTMLCommentary':
            contentCfg = currentConfig.config.htmlcommentary;
            my._createHTMLCommentary("zoomContainerView", contentCfg, currentConfig.dataId, businessData);
            break;
        }

        $("#zoomContainerViewContent").fadeIn("slow");

      });
    }


    function getViewContainers() {
      var currentView = JSON.parse($("body").data("currentView")),
        containers = getContainersForMenuAndFilters(currentView.menuId),
        $zoomContainer = $("#zoomContainer");

      // store the container information in the DIV
      $zoomContainer.data("containers", containers);
    }


    function addCSS() {

      var cfg = $("body").data("customConfig")["CONFIG"].zoomContainer || {};
      var titleHeaderColor = (cfg.TitleBackgroundColor && cfg.TitleBackgroundColor !== "") ? cfg.TitleBackgroundColor  : "#F0F0F0";

      // make sure that the CSS is loaded once only
      var cssCheck = $("#CSS_ZOOMCONTAINER");
      if (cssCheck.length && cssCheck.length > 0) {
        return;
      }

      // create the CSS
      var s = "";
      s += "<style type='text/css' id='CSS_ZOOMCONTAINER' data-repstyle='execdb'>";
      s += "#zoomContainer{";
      s += " position:fixed;";
      s += " z-index: 99999999;";
      s += " left: 0;";
      s += " right: 0;";
      s += " top: 0;";
      s += " bottom: 0;";
      s += " background-color: white;";
      s += " font-family: Tahoma,Arial,Helvetica,sans-serif;";
      s += "}";
      s += "#zoomContainerClose{";
      s += " position:absolute;";
      s += " display:inline-block;";
      s += " float:right;";
      s += " right:20px;";
      s += " width:40px;";
      s += " text-align:center;";
      s += " font-size: 40px;";
      s += " cursor:pointer;";
      s += "}";
      s += "#zoomContainerReportName{";
      s += " position:absolute;";
      s += " top:10px;";
      s += " left:20px;";
      s += " font-size:20px;";
      s += " color: #333;";
      s += "}";
      s += "#zoomContainerFilters{";
      s += " position:absolute;";
      s += " top:40px;";
      s += " right:20px;";
      s += " left:20px;";
      s += " font-size:16px;";
      s += " color: #333;";
      s += "}";
      s += "#zoomContainerFilters i:not(:first-of-type) {";
      s += " margin-left:30px;";
      s += "}";
      s += "#zoomContainerView{";
      s += " position:absolute;";
      s += " top:70px;";
      s += " right:20px;";
      s += " left:20px;";
      s += " bottom:20px;";
      s += " border:1px solid lightgrey;";
      s += "}";
      s += "#zoomContainerBackButton{";
      s += " position:absolute;";
      s += " top:7px;";
      s += " left:5px;";
      s += " font-size:12px;";
      s += " color: darkgrey;";
      s += " display:inline-block;";
      s += "}";
      if (!my.isMobile) {
        s += "#zoomContainerBackButton:hover{";
        s += " color: #333;";
        s += " cursor: pointer;";
        s += "}";
      }
      s += "#zoomContainerForwardButton{";
      s += " position:absolute;";
      s += " top:7px;";
      s += " right:5px;";
      s += " color: darkgrey;";
      s += " font-size:12px;";
      s += " display:inline-block;";
      s += "}";
      if (!my.isMobile) {
        s += "#zoomContainerForwardButton:hover{";
        s += " color: #333;";
        s += " cursor: pointer;";
        s += "}";
      }
      s += "#zoomContainerViewTitle{";
      s += " position:absolute;";
      s += " top:0;";
      s += " text-align:center;";
      s += " font-size:16px;";
      s += " display:inline-block;";
      s += " color:#333;";
      s += " width: 100%;";
      s += " line-height: 30px;";
      s += " height: 30px;";
      s += " background-color: " + titleHeaderColor + ";";
      s += "}";
      s += "#zoomContainerViewContent{";
      s += " position:absolute;";
      s += " top:30px;";
      s += " left:0;";
      s += " right:0;";
      s += " bottom:0;";
      s += " display:block;";
      s += " background-color: white;";
      s += " overflow: auto;";
      s += "}";
      s += "</style>";
      $(s).appendTo("head");
    }


    function buildHTML() {

      // get the report title, menu title and the selected filters
      var $body = $("body"),
        cfg = $body.data("customConfig"),
        i, y,
        currentView = JSON.parse($body.data("currentView")),
        reportTitle = "",
        menuTitle = "",
        filtersText = $('#jbi_businesses').jstree().get_selected(true)[0].text;

      // report title
      if (cfg && cfg["CONFIG"] && cfg["CONFIG"].header && cfg["CONFIG"].header["Title"]) {
        reportTitle = cfg["CONFIG"].header["Title"];
      }

      // menu title
      if (currentView && currentView.menuId && cfg && cfg["MENU_ITEMS"] && cfg["MENU_ITEMS"].length) {
        for (i = 0; i < cfg["MENU_ITEMS"].length; i++) {
          if (cfg["MENU_ITEMS"][i].id === currentView.menuId) {
            menuTitle = cfg["MENU_ITEMS"][i].text;
            break;
          }
        }


        // filters
        var filters = my._getValidMenuFilters(currentView.menuId);
        if (filters && filters.length && cfg["FILTER_ITEMS"] && cfg["FILTER_ITEMS"].length) {

          // loop over the filters for the current menu item
          for (i = 0; i < filters.length; i++) {
            var filterName = "",
              filterValues = [];

            // get the text of the filter and the selected filter value
            for (y = 0; y < cfg["FILTER_ITEMS"].length; y++) {
              if (filters[i].filter === "FILTER_" + cfg["FILTER_ITEMS"][y].id) {
                filterName = cfg["FILTER_ITEMS"][y].name;

                if (cfg["FILTER_ITEMS"][y].type === "IconFilter") {
                  break;
                }

                // get the filter values
                if (!filters[i].selectedValues || !filters[i].selectedValues.length || filters[i].selectedValues.length === 0) {
                  filterValues.push("-");
                } else {
                  for (var x = 0; x < filters[i].selectedValues.length; x++) {
                    for (var z = 0; z < cfg["FILTER_ITEMS"][y].filterValues.length; z++) {
                      if (filters[i].selectedValues[x] === cfg["FILTER_ITEMS"][y].filterValues[z].key) {
                        filterValues.push(cfg["FILTER_ITEMS"][y].filterValues[z].text);
                      }
                    }
                  }
                }
                break;
              }
            }

            // add the filter text
            if (filtersText !== "") {
              filtersText += "; ";
            }
            if (filterName !== "") {
              filtersText += "<i class=\"fa fa-filter\"></i> " + filterName.toUpperCase() + " : " + filterValues.join();
            }

          }
        }
      }

//@formatter:off
      var s = "";
      s += "<div style='display:none;' id='zoomContainer'>";
        s += "<div id='zoomContainerClose'>";
          s += "<svg width='42px' height='42px' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'><path d='M1225 1079l-146 146q-10 10-23 10t-23-10l-137-137-137 137q-10 10-23 10t-23-10l-146-146q-10-10-10-23t10-23l137-137-137-137q-10-10-10-23t10-23l146-146q10-10 23-10t23 10l137 137 137-137q10-10 23-10t23 10l146 146q10 10 10 23t-10 23l-137 137 137 137q10 10 10 23t-10 23zm215-183q0-148-73-273t-198-198-273-73-273 73-198 198-73 273 73 273 198 198 273 73 273-73 198-198 73-273zm224 0q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z'/></svg>";
        s += "</div>";
        s += "<div id='zoomContainerReportName'>";
          s += "<span>" + reportTitle + " - " + menuTitle.toUpperCase() + "</span>";
        s += "</div>";
        s += "<div id='zoomContainerFilters'>";
          s += "<span>" + filtersText + "</span>";
        s += "</div>";
        s += "<div id='zoomContainerView'>";
          s += "<div id='zoomContainerViewTitle'>";
            s += "<span></span>";
          s += "</div>";
          s += "<div style='display:none;' id='zoomContainerBackButton' class='zoomNavButton'>";
            s += "<svg style='margin-top:0px;' width='16px' height='16px' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'><path d='M1363 141q19-19 32-13t13 32v1472q0 26-13 32t-32-13l-710-710q-9-9-13-19v678q0 26-19 45t-45 19h-128q-26 0-45-19t-19-45v-1408q0-26 19-45t45-19h128q26 0 45 19t19 45v678q4-11 13-19z' fill='darkgrey'/></svg>";
            s += "<span style='vertical-align:top;'></span>";
          s += "</div>";
          s += "<div style='display:none;' id='zoomContainerForwardButton' class='zoomNavButton'>";
            s += "<span style='vertical-align:top;'></span>";
            s += "<svg style='margin-top:0px;' width='16px' height='16px' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'><path d='M429 1651q-19 19-32 13t-13-32v-1472q0-26 13-32t32 13l710 710q8 8 13 19v-678q0-26 19-45t45-19h128q26 0 45 19t19 45v1408q0 26-19 45t-45 19h-128q-26 0-45-19t-19-45v-678q-5 10-13 19z' fill='darkgrey'/></svg>";
          s += "</div>";
          s += "<div id='zoomContainerViewContent'></div>";
        s += "</div>";
      s += "</div>";
//@formatter:on

      $body.append(s);

      $("#zoomContainer").fadeIn('slow', function () {
        addEventHandlers();
      });

    }


    function addEventHandlers() {
      var $zoomContainerClose = $("#zoomContainerClose");
      $zoomContainerClose.unbind(my.eventTrigger);
      $zoomContainerClose.on(my.eventTrigger, function (e) {
        e.preventDefault();

        $("#zoomContainer").fadeOut('fast', function () {

          // show the menu
          $("#jbi_application").show();

          // reload the view
          $("#zoomContainer").hide("fast", function () {
            var viewConfig = JSON.parse($("body").data("currentView"));
            my._updateView(viewConfig);

            $("#zoomContainer").remove();

            $("#jbi_content").children().fadeIn("slow");
          });

        });
      });


      var $zoomNavButton = $(".zoomNavButton");
      $zoomNavButton.unbind(my.eventTrigger);
      $zoomNavButton.on(my.eventTrigger, function (e) {
        e.preventDefault();
        var currentContainer = $(this).data("currentContainer");

        setNavigation(currentContainer);
      });
    }


    function getContainersForMenuAndFilters(menuId) {
      var validViews = [],
        $body = $("body"),
        customData = $body.data("customConfig"),
        viewsConfig = customData["VIEWS"],
        filters,
        filtersConfig = customData["FILTER_ITEMS"],
        businessData,
        kpiName, businessName, dataIds, dataId,
        i, y;

      if (!viewsConfig) {
        return null;
      }

      // extract the relevant filters for the current menu
      filters = my._getValidMenuFilters(menuId);


      // check per views config if there is one that meets all conditions
      for (i = 0; i < viewsConfig.length; i++) {
        var validView = true;

        // at least the menuId must be right
        if (viewsConfig[i].menuId !== menuId || viewsConfig[i].filterItems.length === 0) {
          continue;
        }

        // then all the valid filters for the menuId must be right
        for (y = 0; y < filters.length; y++) {
          var filterPassed = false;

          // if no selection is made, no filters can be met
          if (filters[y].selectedValues.length === 0) {
            break;
          }

          // check for each filtervalue in the views if that is correct
          for (var idxViewsFilter = 0; idxViewsFilter < viewsConfig[i].filterItems.length; idxViewsFilter++) {
            if (viewsConfig[i].filterItems[idxViewsFilter].filterId === filters[y].filter) {

              // check if the value is correct
              if (viewsConfig[i].filterItems[idxViewsFilter].filterValue === "*") {
                filterPassed = true;
                break;
              }

              // skip the filters of type IconFilter
              for (var z = 0; z < filtersConfig.length; z++) {
                if (filters[y].filter === "FILTER_" + filtersConfig[z].id) {
                  if (filtersConfig[z].type === "IconFilter") {
                    filterPassed = true;
                  }
                  break;
                }
              }


              if (viewsConfig[i].filterItems[idxViewsFilter].filterValue.substring(0, 1) === "!" &&
                viewsConfig[i].filterItems[idxViewsFilter].filterValue.substring(1) !== filters[y].selectedValues[0]) {
                filterPassed = true;
                break;
              }

              if (viewsConfig[i].filterItems[idxViewsFilter].filterValue === filters[y].selectedValues[0]) {
                filterPassed = true;
                break;
              }
            }
          }

          // if the filter did not pass, proceed to the next viewConfig
          if (!filterPassed) {
            validView = false;
            break;
          }
        }

        if (validView) {
          validViews.push(viewsConfig[i]);
        }
      }

      // filter by business
      var selectedBusinessId = $('#jbi_businesses').jstree().get_selected(true)[0].id;

      // extract the reports (based on the filters)
      var business_reports = {};
      for (i = 0; i < validViews.length; i++) {
        var filterItems = validViews[i].filterItems;
        var reportId = "";
        var reportFilters = [];
        for (y = 0; y < filterItems.length; y++) {
          if (filterItems[y].filterValue !== "*") {
            reportId += filterItems[y].filterId + filterItems[y].filterValue;
            reportFilters.push(filterItems[y]);
          }
        }
        business_reports[reportId] = business_reports[reportId] || {
            id: reportId,
            filters: reportFilters,
            views: [],
            viewIndices: []
          };
        business_reports[reportId]["views"].push(validViews[i]);
        //business_reports[reportId]["viewIndices"].push(viewIndicesForPrint[i]);
      }

      // determine which view to use for which report
      var businessViews = [];
      if (Object.keys(business_reports).length < (validViews.length + 1)) {

        // check if one of the reports is specifically for the business
        for (var report in business_reports) {
          if (business_reports.hasOwnProperty(report)) {
            var currentReport = business_reports[report];

            // if only one report is valid, don't look further
            if (currentReport["views"].length === 1) {
              businessViews.push(currentReport["views"][0]);
            } else {

              // check for a specific report
              var hasSpecificReport = false;
              for (i = 0; i < currentReport["views"].length; i++) {
                var businesses = currentReport["views"][i].businessId.split(";");
                if (businesses.indexOf(selectedBusinessId) > -1) {
                  hasSpecificReport = true;
                  businessViews.push(currentReport["views"][i]);
                  break;
                }
              }

              // get the 'general' report
              if (!hasSpecificReport) {
                for (i = 0; i < currentReport["views"].length; i++) {
                  if (currentReport["views"][i].businessId === "*") {
                    businessViews.push(currentReport["views"][i]);
                    break;
                  }
                }
              }
            }
          }
        }
      } else {
        businessViews = validViews;
      }

      var containers = [];
      for (i = 0; i < businessViews.length; i++) {
        if (!businessViews[i].viewId
          || !customData[businessViews[i].viewId]
          || !businessViews[i].containerData
          || !businessViews[i].containerData.length) {
          continue;
        }

        var viewConfig = customData[businessViews[i].viewId];
        for (y = 0; y < businessViews[i].containerData.length; y++) {

          // replace the placeholders in the titlelabel
          var containerConfig = (viewConfig.containers["container" + businessViews[i].containerData[y].containerId])
            ? viewConfig.containers["container" + businessViews[i].containerData[y].containerId].config
            : null;

          var titleLabel = (containerConfig) ? containerConfig.TitleLabel : "";
          try {
            if (titleLabel) {
              // business name
              businessData = $body.data("customDataApp").datasets[$body.data("currentBusiness")];
              businessName = (businessData && businessData.text) ? businessData.text : "Business";
              titleLabel = titleLabel.replace(/<=business=>/g, businessName);

              // KPI name (first)
              dataIds = (businessViews[i].containerData[y].containerData) ? businessViews[i].containerData[y].containerData.split(";") : null;
              dataId = (dataIds && dataIds.length) ? dataIds[0] : null;
              kpiName = (dataId && businessData && businessData.kpis && businessData.kpis[dataId] )
                ? businessData.kpis[dataId].text
                : "KPI";
              titleLabel = titleLabel.replace(/<=kpi=>/g, kpiName);
            }
          } catch(err) {}

          containers.push({
            containerId: businessViews[i].viewId + "container" + businessViews[i].containerData[y].containerId,
            name: titleLabel,
            dataId: businessViews[i].containerData[y].containerData,
            config: viewConfig.containers["container" + businessViews[i].containerData[y].containerId]
          });
        }
      }
      return containers;
    }
  };


  return my;


}(shell.app.execdb.dashboard));
