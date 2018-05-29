shell.app.execdb.dashboard = ( function (my) {

  my._buildPDF = function () {

    // get the menu config parameters
    var customData = $("body").data("customConfig");
    if (!(_checkPDFEnabled(customData.CONFIG)) || my.isMobile) {
      return;
    }

    _addHTML();
    _addCSS();
    _addEventlisteners();


    /**
     * Check if the PDF functionality is activated
     * @param cfg {object} Application configuration object
     * @returns {boolean} true in case the PDF Export functionality is active
     * @private
     */
    function _checkPDFEnabled(cfg) {
      return ( cfg && cfg.pdf && cfg.pdf.Enabled && cfg.pdf.Enabled === "True");
    }


    /**
     * Add the PDF button to the placeholder
     * @private
     */
    function _addHTML() {
      var s = "";
//@formatter:off
            s += "<div id='jbi_downloadPDFButton' class='jbi_downloadPDFButton'>";
              s += "<ul style='margin:0;padding:0;list-style: none;'>";
                s += "<li>";
                  //s += "<span><svg style=\"width:20px;height:20px;\" width=\"1792\" height=\"1792\" viewBox=\"0 0 1792 1792\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M1344 1344q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm256 0q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm128-224v320q0 40-28 68t-68 28h-1472q-40 0-68-28t-28-68v-320q0-40 28-68t68-28h465l135 136q58 56 136 56t136-56l136-136h464q40 0 68 28t28 68zm-325-569q17 41-14 70l-448 448q-18 19-45 19t-45-19l-448-448q-31-29-14-70 17-39 59-39h256v-448q0-26 19-45t45-19h256q26 0 45 19t19 45v448h256q42 0 59 39z\" fill=\"#CC0000\"/></svg></span>";
                  s += "<span title='Print'><svg style=\"width:20px;height:20px;\" width=\"1792\" height=\"1792\" viewBox=\"0 0 1792 1792\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M448 1536h896v-256h-896v256zm0-640h896v-384h-160q-40 0-68-28t-28-68v-160h-640v640zm1152 64q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm128 0v416q0 13-9.5 22.5t-22.5 9.5h-224v160q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-160h-224q-13 0-22.5-9.5t-9.5-22.5v-416q0-79 56.5-135.5t135.5-56.5h64v-544q0-40 28-68t68-28h672q40 0 88 20t76 48l152 152q28 28 48 76t20 88v256h64q79 0 135.5 56.5t56.5 135.5z\" fill=\"#CC0000\"/></svg></span>";
                  s += "<ul id='jbi_downloadOptions' style='display:none;'>";
                  s += "</ul>";
                s += "</li>";
              s += "</ul>";
            s += "</div>";
//@formatter:on

      $("#jbi_pdf").html(s);
    }


    /**
     * Add the event listener for the PDF button
     * @private
     */
    function _addCSS() {
      var cfg = $("body").data("customConfig");

      var s = "";
      s += "<style type='text/css' id='CSS_PDF' data-repstyle='execdb'>";
      s += ".jbi_downloadPDFButton{";
      s += " cursor: pointer;";
      s += " padding: 0 4px 0 4px;";
      s += " display:inline-block;";
      s += "}";
      s += "#jbi_downloadOptions{";
      s += " position: absolute;";
      s += " padding: 0;";
      s += " margin: 0;";
      s += " z-index: 9999999;";
      s += " right: -1px;";
      s += " list-style: none;";
      s += " background: white;";
      s += " line-height: 40px;";
      s += " border-style: solid;";
      s += " border-color: lightgrey;";
      s += " border-width: 2px;";
      s += " min-width: 130px;";
      s += "}";
      s += "#jbi_downloadOptions li{";
      s += " border-bottom: 1px solid #EEEEEE;";
      s += "}";
      if (!my.isMobile) {
        s += "#jbi_downloadOptions > :not(:first-child):hover{";
        s += " background: #EEEEEE;";
        s += " color: #4A4A4A;";
        s += "}";
      }
      s += "#jbi_downloadOptions > :first-child {";
      s += "background-color: " + cfg.CONFIG.pdf.ListTitleBackgroundColor + ";";
      s += "color: " + cfg.CONFIG.pdf.ListTitleFontColor + ";";
      s += "font-size: 11px;";
      s += "font-family: Verdana;";
      s += "text-align: center;";
      s += "font-weight: bold;";
      s += "line-height: 23px;";
      s += "cursor: default;";
      s += "}";
      s += "#jbi_downloadOptions li span{";
      s += " display: inline-block;";
      s += " line-height: 20px;";
      s += " padding: 5px;";
      s += " color: #4A4A4A;";
      s += " font-family: Verdana;";
      s += " font-size: 12px;";
      s += "}";

      s += "</style>";
      $(s).appendTo("head");
    }


    function createPDFOptions() {

      var $body = $("body"),
        cfg = $body.data("customConfig"),
        cfgView = JSON.parse($body.data("currentView")),
        i, j, y, z, a;

      // current menu item
      var currentMenuItem = null;
      for (i = 0; i < cfg["MENU_ITEMS"].length; i++) {
        if (cfg["MENU_ITEMS"][i].id === cfgView.menuId) {
          currentMenuItem = cfg["MENU_ITEMS"][i];
          break;
        }
      }

      // get all available icons
      var allIcons = [],
        iconNames  = [];
      for (i=0; i< cfg["FILTER_ITEMS"].length; i++) {
        var filterItem = cfg["FILTER_ITEMS"][i];
        if (filterItem.type === "IconFilter") {
          for (y = 0; y<filterItem.filterValues.length; y++) {
            if (iconNames.indexOf(filterItem.filterValues[y].key) === -1 ){
              iconNames.push(filterItem.filterValues[y].key);
              allIcons.push(filterItem.filterValues[y].icon);
            }
          }
        }
      }


      // current container types
      var availableIcons = [],
        availableFilters = [],
        currentIcon = null;
      for (i = 0; i < currentMenuItem.filters.length; i++) {
        var filterId = currentMenuItem.filters[i].substring(7);
        for (y = 0; y < cfg["FILTER_ITEMS"].length; y++) {
          if (cfg["FILTER_ITEMS"][y].id === filterId) {

            // available icons current menu item;
            if (cfg["FILTER_ITEMS"][y].type === "IconFilter") {
              for (z = 0; z < cfg["FILTER_ITEMS"][y].filterValues.length; z++) {
                availableIcons.push(cfg["FILTER_ITEMS"][y].filterValues[z].icon)
              }

              // current selected icon
              for (z = 0; z < cfgView.filterItems.length; z++) {
                if (cfgView.filterItems[z].filterId === currentMenuItem.filters[i]) {
                  for (j = 0; j < cfg["FILTER_ITEMS"][y].filterValues.length; j++) {
                    if (cfg["FILTER_ITEMS"][y].filterValues[j].key === cfgView.filterItems[z].filterValue) {
                      currentIcon = cfg["FILTER_ITEMS"][y].filterValues[j].icon;
                      break;
                    }
                  }
                  break;
                }
              }
            } else {

              // current selected filter value
              var currentFilterValue = null;
              for (z = 0; z < cfgView.filterItems.length; z++) {
                if (cfgView.filterItems[z].filterId === currentMenuItem.filters[i]) {

                  // find the text for the current filter value
                  for (a = 0; a < cfg["FILTER_ITEMS"][y].filterValues.length; a++) {
                    if (cfg["FILTER_ITEMS"][y].filterValues[a].key === cfgView.filterItems[z].filterValue) {
                      currentFilterValue = cfg["FILTER_ITEMS"][y].filterValues[a].text.trim();
                      break;
                    }
                  }
                }
              }

              // all other filters are not icon filters
              availableFilters.push({
                name: cfg["FILTER_ITEMS"][y].name,
                textNoSelection: cfg["FILTER_ITEMS"][y].textNoSelection || "No filter on " + cfg["FILTER_ITEMS"][y].name,
                currentSelection: currentFilterValue
              });
            }
          }
        }
      }


      // create the HTML for each of the options
      var htmlString = "";

      // businesses
      var htmlPartialAllBusinesses = "<br>All businesses";
      var htmlPartialCurrentBusiness = "<br>" + $('#jbi_businesses').jstree().get_selected(true)[0].text;

      // filters
      var htmlPartialAllFilters = "";
      var htmlPartialCurrentFilters = "";
      for (i = 0; i < availableFilters.length; i++) {
        htmlPartialCurrentFilters += "<br>" + availableFilters[i].currentSelection;
      }
      if (availableFilters.length) {
        htmlPartialAllFilters = "<br>All Filters";
      }

      // icons
      var htmlPartialCurrentMenuAllIcons = "";
      var htmlPartialAllIcons = "";
      var htmlPartialCurrentIcon = currentIcon.toLowerCase();
      for (i = 0; i < availableIcons.length; i++) {
        if (i > 0) {
          htmlPartialCurrentMenuAllIcons += " / ";
        }
        htmlPartialCurrentMenuAllIcons += availableIcons[i];
      }
      for (i = 0; i < allIcons.length; i++) {
        if (i > 0) {
          htmlPartialAllIcons += " / ";
        }
        htmlPartialAllIcons += allIcons[i];
      }

      htmlString += "<li>PRINT TO PDF</li>";
      htmlString += "<li data-menus='current' data-icons='current' data-business='current' data-filters='current'><span>" + currentMenuItem.text + htmlPartialCurrentBusiness + htmlPartialCurrentFilters + "<br>" + htmlPartialCurrentIcon + "</span></li>";
      htmlString += "<li data-menus='current' data-icons='all' data-business='current' data-filters='current'><span>" + currentMenuItem.text + htmlPartialCurrentBusiness + htmlPartialCurrentFilters + "<br>" + htmlPartialCurrentMenuAllIcons + "</span></li>";
      htmlString += "<li data-menus='all' data-icons='current' data-business='current' data-filters='all'><span>" + 'All Menu Items' + htmlPartialCurrentBusiness + "<br>" + htmlPartialCurrentIcon + "</span></li>";
      htmlString += "<li data-menus='all' data-icons='all' data-business='current' data-filters='all'><span>" + 'All Menu Items' + htmlPartialCurrentBusiness + "<br>" + htmlPartialAllIcons + "</span></li>";
      htmlString += "<li data-menus='current' data-icons='current' data-business='all' data-filters='all'><span>" + currentMenuItem.text + htmlPartialAllBusinesses + htmlPartialAllFilters + "<br>" + htmlPartialCurrentIcon + "</span></li>";
      htmlString += "<li data-menus='current' data-icons='all' data-business='all' data-filters='all'><span>" + currentMenuItem.text + htmlPartialAllBusinesses + htmlPartialAllFilters + "<br>" + htmlPartialCurrentMenuAllIcons + "</span></li>";

      var $jbi_downloadOptions = $("#jbi_downloadOptions");
      $jbi_downloadOptions.empty();
      $jbi_downloadOptions.append(htmlString);


      // add an event listener for the options
      var $jbi_downloadOptionsNotFirst = $("#jbi_downloadOptions > :not(:first-child)");
      $jbi_downloadOptionsNotFirst.unbind(my.eventTrigger);
      $jbi_downloadOptionsNotFirst.on(my.eventTrigger, function () {
        _createPDF({
          menuId: $(this).data("menus") === "all" ? "all" : cfgView.menuId,
          businessId: $(this).data("business") === "all" ? "all" : $('#jbi_businesses').jstree('get_selected')[0],
          icons: $(this).data("icons"),
          filters: $(this).data("filters")
        });
      });
    }


    /**
     * Add the event listener for the PDF button
     * @private
     */
    function _addEventlisteners() {
      var $jbi_downloadPDFButton = $("#jbi_downloadPDFButton");
      $jbi_downloadPDFButton.unbind(my.eventTrigger);
      $jbi_downloadPDFButton.on(my.eventTrigger, function () {
        createPDFOptions();
        $('#jbi_downloadOptions').toggle();
      });
    }


    /**
     * Generate the PDF
     * @private
     */
    function _createPDF(selection) {
      var $body = $("body"),
        cfg = $body.data("customConfig"),
        cfgView = JSON.parse($body.data("currentView")),
        pdfSettings = _getPDFSettings();


      // get the pages that need to be PDF'd based on the selection
      var businessReports = _getBusinessReports(selection);
      if (!businessReports || !businessReports.length) {
        alert("Something went wrong during the PDF printing.");
        return;
      }


      // setup a new PDF document
      var doc = _initializePDF();

      // create a cover page and an index page
      createCoverPage();


      // add the pages
      _addPages(businessReports).then(
        function () {
          _saveDocument();
        }
      );


      function _getPDFSettings() {
        var pdfSettingsLandscape = {
            imageQuality: 0.9,
            orientation: "landscape",     // portrait / landscape
            unit: "mm",                  // pt / mm / cm / in
            format: "a4",                // a3 / a4 / a5 / letter / legal
            structure: {
              pageSize: [290, 210],
              header: [12.5, 12.5, 271.2, 8],
              pageComments: [12.5, 20.8, 271.2, 15],
              contents: [12.5, 36.5, 271.2, 161],
              footer: [12.5, 198.5, 271.2, 8]
            }
          },
          pdfSettingsPortrait = {
            imageQuality: 0.9,
            orientation: "portrait",
            unit: "mm",                  // pt / mm / cm / in
            format: "a4",                // a3 / a4 / a5 / letter / legal
            structure: {
              pageSize: [210, 290],
              header: [25.4, 10, 159.2, 8],
              pageComments: [25.4, 20.6, 159.2, 15],
              contents: [25.4, 37, 159.2, 240.2],
              footer: [25.4, 280, 159.2, 8]
            }
          };

        return (cfg["CONFIG"].pdf["Orientation"] && cfg["CONFIG"].pdf["Orientation"].toUpperCase() === "PORTRAIT")
          ? pdfSettingsPortrait
          : pdfSettingsLandscape;
      }


      function _initializePDF() {
        return new jsPDF(
          pdfSettings.orientation,
          pdfSettings.unit,
          pdfSettings.format
        );
      }


      function createCoverPage() {
        var base64Logo = shell.app.execdb.dashboard._getLogoBase64();
        doc.addImage(
          base64Logo,
          'png',
          pdfSettings.structure.header[0],
          pdfSettings.structure.header[1] - 2.5,
          12,
          12
        );


        // add the title of the project
        doc.setTextColor("#dd1d21");
        doc.setFontSize(15);
        doc.setFontType("bold");
        doc.textEx(
          "EXECUTIVE REPORTING",
          pdfSettings.structure.pageSize[0] - 10,
          (pdfSettings.structure.pageSize[1] / 4 * 3) - 18,
          'right'
        );

        // report title
        doc.setFontSize(11);
        doc.textEx(
          cfg.CONFIG.header.Title.toUpperCase(),
          pdfSettings.structure.pageSize[0] - 10,
          (pdfSettings.structure.pageSize[1] / 4 * 3) - 10,
          'right'
        );

        // report version
        var currentPeriod = shell.app.execdb.dashboard.period_functions.getCurrentPeriod();
        var period;
        if (currentPeriod) {
          period = currentPeriod.periodFullName + " " + currentPeriod.year;

          // check if there is a version
          var version = $("body").data("currentVersion");
          if (!version || version === '') {
            version = "UNPUBLISHED";
          }
          doc.textEx(
            period.toUpperCase() + " / " + version.toUpperCase(),
            pdfSettings.structure.pageSize[0] - 10,
            (pdfSettings.structure.pageSize[1] / 4 * 3) - 4,
            'right'
          );
        }

        // KPIs
        var kpiText = "All Key Performance Indicators";
        if (selection.menuId !== 'all') {
          kpiText = getMenuText(selection.menuId);

          // add the filters if required
          if (selection.filters !== "all") {
            var filterText = getCurrentFilterText(selection.menuId);
            if (filterText && filterText !== "") {
              kpiText += " / " + filterText;
            }
          }


        }
        doc.textEx(
          kpiText.toUpperCase(),
          pdfSettings.structure.pageSize[0] - 10,
          (pdfSettings.structure.pageSize[1] / 4 * 3) + 2,
          'right'
        );

        // Businesses
        var businessText = "All Businesses";
        if (selection.businessId !== 'all') {
          businessText = getBusinessText(selection.businessId);
        }
        doc.textEx(
          businessText.toUpperCase(),
          pdfSettings.structure.pageSize[0] - 10,
          (pdfSettings.structure.pageSize[1] / 4 * 3) + 8,
          'right'
        );


        // Most confidential
        doc.textEx(
          "MOST CONFIDENTIAL",
          pdfSettings.structure.pageSize[0] - 10,
          (pdfSettings.structure.pageSize[1] / 4 * 3) + 20,
          'right'
        );


        // add a line between the project title and the report title
        doc.setDrawColor(221, 29, 33);
        doc.setLineWidth(0.5);
        doc.line(
          pdfSettings.structure.pageSize[0] - 73,           // left
          (pdfSettings.structure.pageSize[1] / 4 * 3) - 17, // top
          pdfSettings.structure.pageSize[0] - 10,           // right
          (pdfSettings.structure.pageSize[1] / 4 * 3) - 17  // bottom
        );

      }


      function getMenuText(menuId) {
        var $customConfig = $("body").data("customConfig");
        var menuItems = $customConfig["MENU_ITEMS"];

        for (var i=0; i<menuItems.length; i++) {
          if (menuItems[i].id === menuId) {
            return menuItems[i].text;
          }
        }
        return menuId;
      }


      function getBusinessText(businessId) {
        var $customDataApp = $("body").data("customDataApp");
        if ($customDataApp && $customDataApp.datasets && $customDataApp.datasets[businessId]) {
          return $customDataApp.datasets[businessId].text;
        }
        return businessId;
      }


      function getCurrentFilterText(menuId) {
        var cfg = $("body").data("customConfig"),
          $menuItems = cfg["MENU_ITEMS"],
          $filterItems = cfg["FILTER_ITEMS"],
          cfgView = JSON.parse($body.data("currentView")),
          currentMenuItem,
          currentFilters = [],
          i, y, z, a;

        // get the current menu item
        for (i=0; i<$menuItems.length; i++) {
          if ($menuItems[i].id === menuId) {
            currentMenuItem = $menuItems[i];
            break;
          }
        }

        // get the valid filters for the menu item
        for (i = 0; i < currentMenuItem.filters.length; i++) {
          var filterId = currentMenuItem.filters[i].substring(7);
          for (y = 0; y < cfg["FILTER_ITEMS"].length; y++) {
            if ($filterItems[y].id === filterId) {
              if ($filterItems[y].type !== "IconFilter") {
                var currentFilterValue = null;
                for (z = 0; z < cfgView.filterItems.length; z++) {
                  if (cfgView.filterItems[z].filterId === currentMenuItem.filters[i]) {
                    for (a = 0; a < $filterItems[y].filterValues.length; a++) {
                      if ($filterItems[y].filterValues[a].key === cfgView.filterItems[z].filterValue) {
                        currentFilters.push($filterItems[y].filterValues[a].text.trim());
                        break;
                      }
                    }
                  }
                }
              }
            }
          }
        }

        return currentFilters.join(" / ");
      }



      function _getBusinessReports(selection) {
        var i, y, z,
         businessReports = [],
         menusWithFilters = getMenusWithFilters(selection.menuId, selection),
         businesses = getBusinesses(selection.businessId),
         availableViews = $("body").data("customConfig")["VIEWS"];

        for (i=0; i<businesses.length; i++) {
          var businessView = {
            business: businesses[i],
            viewIndices: []
          };

          for (y=0; y<menusWithFilters.length; y++) {
            for (z=0; z<menusWithFilters[y].filterCombinations.length; z++) {
              var viewSetting = shell.app.execdb.dashboard._getViewConfigIdBasedOnFilters(
                menusWithFilters[y].id,
                menusWithFilters[y].filterCombinations[z],
                availableViews,
                businesses[i]
              );
              businessView.viewIndices.push(viewSetting.id);
            }
          }
          businessReports.push(businessView);
        }

        return businessReports;


        function getMenusWithFilters(menuId, selection) {
          var menuItems = cfg["MENU_ITEMS"],
            menuItem;

          var menuIds = [];
          for (var i = 0; i < menuItems.length; i++) {

            // check if the menuItem is available for the selected business
            if (selection.businessId !== "all"
              && menuItems[i].businesses
              && menuItems[i].businesses.length
              && menuItems[i].businesses.indexOf(selection.businessId) === -1) {
              continue;
            }

            menuItem = menuItems[i];
            if (menuItem.id === menuId || menuId === 'all') {

              menuIds.push({
                id: menuItem.id,
                filterCombinations: getFiltersCombinationsForMenu(menuItem.filters, selection)
              });
            }
          }
          return menuIds;
        }

        function getFiltersCombinationsForMenu(filterIds, selection) {
          var filterItems = cfg["FILTER_ITEMS"],
            currentFilters = $("body").data("filters"),
            availableFilters = [],
            i, y, z;

          // get the icon filter
          for (i = 0; i < filterIds.length; i++) {
            for (y = 0; y < filterItems.length; y++) {
              if (filterIds[i] === "FILTER_" + filterItems[y].id) {
                var filterItem = {
                  filter: filterIds[i],
                  filterValues: [],
                  type: filterItems[y].type
                };

                if (filterItems[y].type === "IconFilter" && selection.icons === "current") {

                  // get the current selection
                  for (z=0; z<currentFilters.length; z++) {
                    if (currentFilters[z].filter === filterIds[i]) {
                      filterItem.filterValues.push(currentFilters[z].selectedValues[0]);
                      break;
                    }
                  }
                } else {
                  for (z = 0; z < filterItems[y].filterValues.length; z++) {
                    filterItem.filterValues.push(filterItems[y].filterValues[z].key);
                  }
                }

                availableFilters.push(filterItem);
              }
            }
          }

          // generate all unique combinations of the filters
          var filterCombo = [];
          for (i=0; i<availableFilters.length; i++) {
            var filterKeys = [];
            for (y=0; y<availableFilters[i].filterValues.length; y++) {
              filterKeys.push(availableFilters[i].filterValues[y]);
            }
            filterCombo.push(filterKeys);
          }
          var filterValueCombinations = cartesian(filterCombo);


          function cartesian(arguments) {
            var r = [], arg = arguments, max = arg.length-1;
            function helper(arr, i) {
              for (var j=0, l=arg[i].length; j<l; j++) {
                var a = arr.slice(0); // clone arr
                a.push(arg[i][j]);
                if (i==max)
                  r.push(a);
                else
                  helper(a, i+1);
              }
            }
            helper([], 0);
            return r;
          }

          // create the different menu with filter selection options
          var filterCombinations = [];
          for (i=0; i<filterValueCombinations.length; i++) {
            var filters = [];
            for (y=0; y<availableFilters.length; y++) {
              var filter = {
                filter: availableFilters[y].filter,
                selectedValues : [filterValueCombinations[i][y]]
              };
              filters.push(filter);
            }
            filterCombinations.push(filters);
          }
          return filterCombinations;
        }


        function getBusinesses(businessId) {
          var $jbiBusinesses = $('#jbi_businesses');
          var businessToPrint = [$jbiBusinesses.jstree().get_selected(true)[0].id];
          if (businessId === "all") {
            var childNodes = $jbiBusinesses.jstree()._model.data[businessToPrint[0]].children;

            // only visible nodes may be printed
            for (i = 0; i < childNodes.length; i++) {
              var childNode = $jbiBusinesses.jstree()._model.data[childNodes[i]];
              if (childNode.state && !childNode.state.hidden) {
                businessToPrint.push(childNode.id);
              }
            }
          }
          return businessToPrint;
        }
      }


      function addPDFStyles() {
        var s = "";
        s += "<style type='text/css' id='CSS_PDF_TEMP' data-repstyle='execdb'>";
        s += ".zoomButton{";
        s += " display: none !important;";
        s += "}";
        s += "</style>";
        $(s).appendTo("head");
      }

      function deletePDFStyles() {
        $("#CSS_PDF_TEMP").remove();
      }

      function _addPages(businessReports) {
        var deferred = $.Deferred();
        var originalConfig = JSON.parse($("body").data("currentView"));
        var originalBusiness = $('#jbi_businesses').jstree('get_selected')[0];
        var pageNumber = 1;
        var $jbiPdf = $("#jbi_pdf");

        // switch off highcharts animations
        Highcharts.setOptions({
          plotOptions: {
            series: {
              animation: false
            }
          }
        });

        // add specific pdf styles
        addPDFStyles();

        $jbiPdf.unbind("showNextFilter");
        $jbiPdf.on("showNextFilter", function (evt, prop) {
          if (prop.nextIndex < prop.viewIndices.length) {
            cfgView = cfg["VIEWS"][prop.viewIndices[prop.nextIndex]];

            my._setView(cfgView, businessReports[prop.currentBusinessIndex].business);

            setTimeout(function () {
              $.when(
                _addNewPage(pageNumber),
                _addPageHeader(pageNumber),
                _addCommentaryImageToPDF(),
                _addContentImageToPDF(),
                _addPageFooter()
              ).then(
                function () {
                  pageNumber += 1;
                  $("#jbi_pdf").trigger("showNextFilter", {
                    nextIndex: prop.nextIndex + 1,
                    currentBusinessIndex: prop.currentBusinessIndex,
                    viewIndices: businessReports[prop.currentBusinessIndex].viewIndices
                  });
                }
              )
            }, 1000);

          } else {
            $("#jbi_pdf").trigger("showNextBusiness", {
              nextIndex: prop.currentBusinessIndex + 1
            });
          }
        });


        $jbiPdf.unbind("showNextBusiness");
        $jbiPdf.on("showNextBusiness", function (evt, prop) {
          if (prop.nextIndex < businessReports.length) {

            // select the next business
            if (businessReports.length > 1) {
              var $jbiBusinesses = $('#jbi_businesses');
              $jbiBusinesses.jstree().deselect_all();
              $jbiBusinesses.jstree().select_node(businessReports[prop.nextIndex].business);
            }

            // loop over the filters
            $("#jbi_pdf").trigger("showNextFilter", {
              nextIndex: 0,
              currentBusinessIndex: prop.nextIndex,
              viewIndices: businessReports[prop.nextIndex].viewIndices
            });


          } else {

            // printing done, reset everything to original state
            Highcharts.setOptions({
              plotOptions: {
                series: {
                  animation: true
                }
              }
            });

            var $jsTree = $('#jbi_businesses').jstree();
            $jsTree.deselect_all();
            $jsTree.select_node(originalBusiness);

            my._setView(originalConfig, originalBusiness);
            deletePDFStyles();
            deferred.resolve();
          }
        });


        $jbiPdf.trigger("showNextBusiness", {nextIndex: 0});

        return deferred.promise();
      }


      function _addNewPage(pageNumber) {
        var deferred = $.Deferred();

        if (pageNumber > 0) {
          doc.addPage();
        }

        deferred.resolve();
        return deferred.promise();
      }


      function _addDocumentProperties() {
        var deferred = $.Deferred();

        // add the title of the selected menu
        var menuTitle = "";
        for (var i = 0; i < cfg.MENU_ITEMS.length; i++) {
          if (cfg.MENU_ITEMS[i].id === cfgView.menuId) {
            menuTitle = cfg.MENU_ITEMS[i].text;
            break;
          }
        }

        // get the period
        var period = "";
        if (cfg && cfg.CONFIG && cfg.CONFIG.period && cfg.CONFIG.period.long) {
          period = cfg.CONFIG.period.long;
        }

        doc.setProperties({
          title: "SHELL - GROUP MI - " + cfg.CONFIG.header.Title,
          subject: menuTitle + " " + period,
          author: "Shell Group MI",
          keywords: 'shell, group mi, report, ' + menuTitle + ', ' + cfg.CONFIG.header.Title,
          creator: 'Generated from a Group MI report'
        });

        deferred.resolve();
        return deferred.promise();
      }

      /**
       * Adds the page header to the PDF document
       * @returns {object} promise
       * @private
       */
      function _addPageHeader(pageNumber) {
        var deferred = $.Deferred();

        // add the logo
        var base64Logo = shell.app.execdb.dashboard._getLogoBase64();
        doc.addImage(
          base64Logo,
          'png',
          pdfSettings.structure.header[0],
          pdfSettings.structure.header[1] - 2.5,
          7,
          7
        );


        // add the title of the report as text
        doc.setTextColor("#dd1d21");
        doc.setFontSize(8);
        doc.setFontType("bold");
        doc.textEx(
          cfg.CONFIG.header.Title.toUpperCase(),
          pdfSettings.structure.header[0] + 10,
          pdfSettings.structure.header[1],
          'left'
        );


        // add the title of the selected menu
        var menuTitle = "",
          validFilters = [],
          validFilterTexts = [],
          menuItems = cfg["MENU_ITEMS"],
          filterItems = cfg["FILTER_ITEMS"],
          i;
        for (i = 0; i < menuItems.length; i++) {
          if (menuItems[i].id === cfgView.menuId) {
            menuTitle = menuItems[i].text;
            validFilters = menuItems[i].filters;
            break;
          }
        }

        // add the selected filters
        validFilterTexts.push(menuTitle);
        validFilterTexts.push($('#jbi_businesses').jstree().get_selected(true)[0].text);
        for (i = 0; i < validFilters.length; i++) {
          for (var y = 0; y < cfgView.filterItems.length; y++) {
            if (validFilters[i] === cfgView.filterItems[y].filterId) {
              var selectedItemKey = cfgView.filterItems[y].filterValue;

              for (var x = 0; x < filterItems.length; x++) {
                if ("FILTER_" + filterItems[x].id === validFilters[i]) {
                  for (var z = 0; z < filterItems[x].filterValues.length; z++) {
                    if (filterItems[x].filterValues[z].key === selectedItemKey) {
                      validFilterTexts.push(filterItems[x].filterValues[z].text.trim());
                      break;
                    }
                  }
                  break;
                }
              }
              break;
            }
          }
        }

        doc.setFontType("normal");
        doc.setFontSize(8);
        doc.textEx(
          validFilterTexts.join(" / "),
          pdfSettings.structure.header[0] + 10,
          pdfSettings.structure.header[1] + 4,
          'left'
        );


        // add the period and the version
        var currentPeriod = shell.app.execdb.dashboard.period_functions.getCurrentPeriod();
        var period;
        if (currentPeriod) {
          period = currentPeriod.periodFullName + " " + currentPeriod.year;

          // check if there is a version
          var version = $("body").data("currentVersion");
          if (!version || version === '') {
            version = "UNPUBLISHED";
          }

          doc.setFontType("bold");
          doc.setFontSize(8);
          doc.textEx(
            period.toUpperCase() + " / " + version.toUpperCase(),
            pdfSettings.structure.header[0] + pdfSettings.structure.header[2],
            pdfSettings.structure.header[1],
            'right'
          );

          doc.setFontType("normal");
          doc.setFontSize(8);
          doc.textEx(
            "Page " + pageNumber,
            pdfSettings.structure.header[0] + pdfSettings.structure.header[2],
            pdfSettings.structure.header[1] + 4,
            'right'
          );
        }


        // draw a line under the header section
        doc.setDrawColor(238, 238, 238);
        doc.setLineWidth(0.5);
        doc.line(
          pdfSettings.structure.header[0],    // margin left
          ( pdfSettings.structure.header[1] + pdfSettings.structure.header[3] ),  // margin top + height
          ( pdfSettings.structure.header[0] + pdfSettings.structure.header[2] ),  // margin left  + width
          ( pdfSettings.structure.header[1] + pdfSettings.structure.header[3] )   // margin top + height
        );

        deferred.resolve();
        return deferred.promise()
      }


      /**
       * Adds the page commentary to the PDF
       * @returns {object} promise
       * @private
       */
      function _addCommentaryImageToPDF() {
        var deferred = $.Deferred();

        // cfgView.commentKey
        var noCommentsText = "No comments.";
        var text = $(decodeURIComponent( my._getCommentText() )).text();
        if (!text || text === '') {
          text = noCommentsText;
        }

        try {
          text = doc.splitTextToSize(pdfSettings.structure.pageComments[2]);
        } catch (err) {
        }

        // add a background for the comments
        //doc.setDrawColor(0.95);

        doc.setDrawColor(238, 238, 238);
        //doc.setFillColor(220, 220, 220);
        doc.rect(
          pdfSettings.structure.pageComments[0],
          pdfSettings.structure.pageComments[1],
          pdfSettings.structure.pageComments[2],
          pdfSettings.structure.pageComments[3]
        );

        // only show the comments big if they are available
        if (text === noCommentsText) {
          doc.setTextColor(220, 220, 220);
          doc.setFontSize(8);
          doc.setFontType("italic");
        } else {
          doc.setTextColor(100);
          doc.setFontSize(8);
          doc.setFontType("bold");
        }

        doc.textEx(
          text,
          pdfSettings.structure.pageSize[0] / 2,
          pdfSettings.structure.pageComments[1] + ( pdfSettings.structure.pageComments[3] / 2  ),
          'center',
          'middle'
        );

        // draw a line below the comment section
        //doc.setDrawColor(180, 180, 180);
        //doc.setLineWidth(0.5);
        //doc.line(
        //  pdfSettings.structure.pageComments[0],    // margin left
        //  ( pdfSettings.structure.pageComments[1] + pdfSettings.structure.pageComments[3] ),  // margin top + height
        //  ( pdfSettings.structure.pageComments[0] + pdfSettings.structure.pageComments[2] ),  // margin left  + width
        //  ( pdfSettings.structure.pageComments[1] + pdfSettings.structure.pageComments[3] )   // margin top + height
        //);

        deferred.resolve();
        return deferred.promise()
      }

      /**
       * Adds the page content to the PDF
       * @returns {object} promise
       * @private
       */
      function _addContentImageToPDF() {
        var deferred = $.Deferred();

        _addDOMElementAsImage(
          $('#jbi_content')[0],
          pdfSettings.structure.contents[0],
          pdfSettings.structure.contents[1]
        ).then(function () {
          deferred.resolve()
        });

        return deferred.promise()
      }

      /**
       * Adds a footer to the PDF
       * @returns {object} promise
       * @private
       */
      function _addPageFooter() {
        var deferred = $.Deferred();

        // add the classification
        doc.setTextColor("#dd1d21");
        doc.setFontSize(8);
        doc.setFontType("normal");
        doc.textEx(
          'MOST CONFIDENTIAL',
          pdfSettings.structure.footer[0],
          pdfSettings.structure.footer[1] + 4,
          'left'
        );

        // add the classification
        var currentDate = new Date;
        doc.setFontType("normal");
        doc.textEx(
          'Generated at: ' + currentDate.toUTCString(),
          pdfSettings.structure.footer[0] + pdfSettings.structure.footer[2],
          pdfSettings.structure.footer[1] + 4,
          'right'
        );

        // draw a line above the footer section
        doc.setDrawColor(238, 238, 238);
        doc.setLineWidth(0.5);
        doc.line(
          pdfSettings.structure.footer[0],    // margin left
          pdfSettings.structure.footer[1],  // margin top + height
          ( pdfSettings.structure.footer[0] + pdfSettings.structure.footer[2] ),  // margin left  + width
          pdfSettings.structure.footer[1]   // margin top + height
        );

        deferred.resolve();
        return deferred.promise()
      }


      /**
       * Add a DOM element as image to the PDF
       * @param element {object} DOM object
       * @param x {int} The x-position in the PDF document
       * @param y {int} the y-position in the PDF document
       * @returns {object} promise
       * @private
       */
      function _addDOMElementAsImage(element, x, y) {
        var deferred = $.Deferred();
        var imageData;


        // first convert the element to an image
        _elementToImage(element)
          .then(function (imgData) {
            imageData = imgData;
            return _calculateImageSize(imageData);
          })
          .then(function (imageSize) {
            return _addImageToDoc(imageData, x, y, imageSize.fixedWidth, imageSize.fixedHeight, imageSize.actualWidthMM, imageSize.actualHeightMM);
          })
          .then(function () {
            deferred.resolve();
          });

        return deferred.promise();
      }


      /**
       * Calculates the width / height of the images to make sure it fits on
       * the PDF document
       * Upscaling the image will result in a very bad looking PDF page, for that
       * reason we will only shrink the image in case the image is too big for
       * the page. To calculate if the image is too big, we need to convert the
       * PDF units (mm) to pixels;
       * As the image is generated from the HTML Canvas via function toDataURL, we
       * know that the resolution of the image is 96dpi
       * https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
       * With this information, we can calculate the content area in pixels:
       * http://www.dallinjones.com/2008/07/how-to-convert-from-pixels-to-millimeters/
       * @param imageData {string} Base64 encoded image string
       * @returns {object} promise
       * @private
       */
      function _calculateImageSize(imageData) {

        var deferred = $.Deferred(),
          img = new Image();

        img.onload = function () {
          var calculatedSize = {
              fixedWidth: undefined,
              fixedHeight: undefined,
              actualWidthMM: null,
              actualHeightMM: null
            },
            imageWidthInPixels = img.width,
            imageHeightInPixels = img.height,
            dpi = 96,
            pdfContentAreaWidthInPixels = ( pdfSettings.structure.contents[2] * dpi ) / 25.4,
            pdfContentAreaHeightInPixels = ( pdfSettings.structure.contents[3] * dpi ) / 25.4;

          calculatedSize.actualWidthMM = ( imageWidthInPixels * 25.4 ) / dpi;
          calculatedSize.actualHeightMM = ( imageHeightInPixels * 25.4 ) / dpi;

          // if both the image width and height are within the limits, there is no need to shrink it
          if (imageWidthInPixels > pdfContentAreaWidthInPixels ||
            imageHeightInPixels > pdfContentAreaHeightInPixels) {

            // reset the actual width
            calculatedSize.actualWidthMM = pdfSettings.structure.contents[2];
            calculatedSize.actualHeightMM = pdfSettings.structure.contents[3];

            // shrink the image
            var ratio = Math.min(pdfSettings.structure.contents[2] / img.width, pdfSettings.structure.contents[3] / img.height);
            calculatedSize.fixedWidth = img.width * ratio;
            calculatedSize.fixedHeight = img.height * ratio;
          }

          deferred.resolve(calculatedSize);
        };

        // add an dummy image to retrieve its size
        img.src = imageData;

        return deferred.promise()
      }


      /**
       * Add an image to the PDF document
       * @param img {string} Base64 encoded image string
       * @param x {int} The x-position in the PDF document
       * @param y {int} the y-position in the PDF document
       * @param fixedWidth {int} the width of the image in mm that is rendered. If this
       *                         value is undefined, the library picks the actual width
       * @param fixedHeight {int} the height of the image in mm that is rendered. If this
       *                         value is undefined, the library picks the actual height
       * @param actualWidthMM {int} the width of the image in mm
       * @param actualHeightMM {int} the height of the image in mm
       * @returns {object} promise
       * @private
       */
      function _addImageToDoc(img, x, y, fixedWidth, fixedHeight, actualWidthMM, actualHeightMM) {
        var deferred = $.Deferred();

        doc.addImage(
          img,
          x + ( ( pdfSettings.structure.contents[2] - actualWidthMM ) / 2),
          y + ( ( pdfSettings.structure.contents[3] - actualHeightMM ) / 2),
          fixedWidth,
          fixedHeight
        );

        deferred.resolve();
        return deferred.promise();
      }


      /**
       * Save the PDF file
       * @private
       */
      function _saveDocument() {

        // set the file name
        var currentDate = new Date(),
          yyyy = currentDate.getFullYear().toString(),
          mm = (currentDate.getMonth() + 1).toString(), // getMonth() is zero-based
          dd = currentDate.getDate().toString(),
          yyyymmdd = yyyy + (mm[1] ? mm : "0" + mm[0]) + (dd[1] ? dd : "0" + dd[0]),
          fileName = "report_" + yyyymmdd;

        if (cfg && cfg.CONFIG && cfg.CONFIG.header && cfg.CONFIG.header.Title) {
          fileName = cfg.CONFIG.header.Title + "_" + yyyymmdd;
        }

        doc.save("shell - group mi - " + fileName.toLowerCase() + ".pdf");
      }


      /**
       * Creating a PDF file based on HTML requires the following steps: First
       * a DOM element is converted to a canvas by using the html2canvas library.
       * Next the canvas is converted to an PNG image and then this image is added
       * to a PDF file using the jsPDF library.
       * @param element {object} DOM element that will be converted to image
       * @private
       */
      function _elementToImage(element) {
        var deferred = $.Deferred();

        // create a clone of the target element (because the element requires modifications before being able to print)
        var cloneElement = _createElementClone(element);

        // convert all SVGs in the clone to canvas (as html2canvas lib cannot handle them)
        _convertSVGtoCanvas(cloneElement);

        // convert the HTML of the clone to canvas
        html2canvas(cloneElement, {
          onrendered: function (canvas) {
            document.body.removeChild(cloneElement);
            $("body").css("overflow", "initial");
            deferred.resolve(canvas.toDataURL('image/jpeg', pdfSettings.imageQuality));
          }
        });
        return deferred.promise();


        /**
         * This function creates a clone of the target element and sets its position
         * to relative and uses that in the html2canvas library.
         * @param element {object} DOM element to be cloned
         * @private
         */
        function _createElementClone(element) {

          // create a clone object
          var clone = element.cloneNode(true);

          // Position element relatively within the body but still out of the viewport
          var style = clone.style;
          style.position = 'relative';
          style.top = window.innerHeight + 'px';
          style.left = 0;
          style.maxWidth = $("#jbi_content").width() + 'px';      // change in order to keep control over image size
          $(clone).css("background", "white");

          // Append clone to body and return the clone
          $("body").css("overflow", "hidden");
          document.body.appendChild(clone);
          return clone;
        }


        /**
         * Converts all SVG objects within a certain rootElement to canvas.
         * @param element {object} DOM element for which its SVG children will be converted
         * @private
         */
        function _convertSVGtoCanvas(element) {
          var svgElem = $(element).find("svg");

          svgElem.each(function (index, node) {
            var parentNode = node.parentNode,
              svg = $('<div>').append($(node).clone()).html(), //node.outerHTML,
              canvas = document.createElement('canvas');

            // use the canvg library to replace the svg elements
            try {
              canvg(canvas, svg);
            } catch (err) {
            }

            // remove the svg and add the canvas object
            parentNode.removeChild(node);
            parentNode.appendChild(canvas);
          });
        }
      }
    }


    jsPDF.API.textEx = function (text, x, y, hAlign, vAlign) {
      var splitRegex = /\r\n|\r|\n/g;
      var fontSize = this.internal.getFontSize() / this.internal.scaleFactor;

      // As defined in jsPDF source code
      var lineHeightProportion = 1.15;

      var splittedText = null;
      var lineCount = 1;
      if (vAlign === 'middle' || vAlign === 'bottom' || hAlign === 'center' || hAlign === 'right') {
        splittedText = typeof text === 'string' ? text.split(splitRegex) : text;

        lineCount = splittedText.length || 1;
      }

      // Align the top
      if (vAlign) {
        y += fontSize * (2 - lineHeightProportion);
      }

      if (vAlign === 'middle')
        y -= (lineCount / 2) * fontSize;
      else if (vAlign === 'bottom')
        y -= lineCount * fontSize;

      if (hAlign === 'center' || hAlign === 'right') {
        var alignSize = fontSize;
        if (hAlign === 'center')
          alignSize *= 0.5;

        if (lineCount > 1) {
          for (var iLine = 0; iLine < splittedText.length; iLine++) {
            this.text(splittedText[iLine], x - this.getStringUnitWidth(splittedText[iLine]) * alignSize, y);
            y += fontSize;
          }
          return this;
        }
        x -= this.getStringUnitWidth(text) * alignSize;
      }

      this.text(text, x, y);
      return this;
    };

  };

  return my;

}(shell.app.execdb.dashboard));
