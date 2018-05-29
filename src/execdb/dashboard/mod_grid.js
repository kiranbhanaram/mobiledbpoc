shell.app.execdb.dashboard = (function (my) {

  /**
   * Generates grid
   *
   * This is a generic function that is used to generate the HTML for a table
   *
   * @param containerDiv   the ID of the HTML div element in which the object
   *                       needs to be rendered
   * @param config         the configuration settings for the grid
   * @param dataId         the ID of the data for the object
   * @param businessData   the data for the selected business
   */
  my._createGrid = function (containerDiv, config, dataId, businessData) {
    config = $.extend(true, {}, config);

    addCSS(containerDiv, config);
    addHTML(containerDiv);
    checkGridDivRendered(containerDiv, config, dataId, businessData, 0);

    function checkGridDivRendered(containerDiv, config, dataId, businessData, time) {
      var $containerDiv = $('#' + containerDiv + 'Content');

      if ($containerDiv.outerWidth() === 0 && time < 100) {
        setTimeout(function () {
          checkGridDivRendered(containerDiv, config, dataId, businessData, ++time);
        }, 100);
        return;
      }

      setTimeout(function () {
        createGrid(config, dataId, businessData);
      }, 200);
    }


    /**
     * Add the CSS for the container to the page
     * @param containerDiv  The DIV Id in which the grid needs to be rendered
     * @param config        The configuration object as defined in the MS Excel
     */
    function addCSS(containerDiv, config) {

      if (!config.css) {
        return;
      }
      var s = "";
      s += "<style type='text/css' id='CSS_GRID_" + containerDiv + "' data-group='LAYOUT' data-repstyle='execdb'>";
      for (var i = 0; i < config.css.length; i++) {
        s += "#" + containerDiv + "Content ." + config.css[i].className + "{" + config.css[i].classValue + "}";
      }
      s += "</style>";
      $(s).appendTo("head");
    }


    /**
     * Add a placeholder for the grid
     */
    function addHTML(containerDiv) {
      $("#" + containerDiv + "Content").html("<table class='grid'></table>");
    }


    /**
     * Create the grid
     * @param config
     * @param dataId
     * @param businessData
     */
    function createGrid(config, dataId, businessData) {
      var $grid = $("#" + containerDiv + "Content .grid"),
        $body = $("body"),
        appData = $body.data("customDataApp"),
        periods = appData.periods,
        gridConfig = {};

      // get the configuration for the entire grid
      if (config["Config"]) {
        $.extend(gridConfig, eval("(" + config["Config"] + ")"));
      }

      //START: @MobileDBFix
      //For mobile devices space out the table columns
      if (my.isMobile && (gridConfig.mobileSettings != undefined)) {
        gridConfig.shrinkToFit = (gridConfig.mobileSettings.shrinkToFit != undefined) ? gridConfig.mobileSettings.shrinkToFit : true;
        gridConfig.forceFit = (gridConfig.mobileSettings.forceFit != undefined) ? gridConfig.mobileSettings.forceFit : false;
      }
      //END: @MobileDBFix

      // add the colModel (if provided)
      if (config && config.columns && config.columns.length) {
        gridConfig.colModel = getColModel(config, periods);
      }

      // add the data (if provided)
      if (config && config["GridData"]) {
        gridConfig.data = eval(config["GridData"]);
      } else {
        gridConfig.data = getGridData(dataId, businessData);
      }

      // show no data in case no data is available
      if (!gridConfig.data || !gridConfig.data.length) {
        $body.trigger("showContainerMessage", {
          container: containerDiv,
          message: "No data available.",
          type: "W"
        });
        return;
      }

      $grid.jqGrid(gridConfig);
      //Added to resolve JQGrid column issue in mobile dashboard
      //if (my.isMobile) {
      $grid.jqGrid('setFrozenColumns'); //@MobileDBFix
      //}
      addGroupHeaders($grid, config, periods, dataId, businessData);


      function firstToUpperCase(str) {
        str = str.toLowerCase();
        return str.substr(0, 1).toUpperCase() + str.substr(1);
      }


      /**
       * Generate the colModel based on the configuration
       * @param config    The configuration as defined in the MS Excel
       * @param periods   The periods and its texts
       * @returns {Array} An array holding the column configuration (so called, colModel)
       */
      function getColModel(config, periods) {
        var colModel = [],
          colModelObject,
          currentPeriod = my.period_functions.getCurrentPeriod(),
          i, replaceBy;

        for (i = 0; i < config.columns.length; i++) {
          colModelObject = config.columns[i];

          //START: @MobileDBFix
          //Adjust the table columns to have horizontal scrolling
          if (my.isMobile && config.columns[i].mobileSettings != undefined) {
            var gridMobileConfig = JSON.parse(config.columns[i].mobileSettings);
            if (gridMobileConfig) {
              colModelObject.frozen = (gridMobileConfig.frozen != undefined) ? gridMobileConfig.frozen : false;
              colModelObject.hidden = (gridMobileConfig.hidden != undefined) ? gridMobileConfig.hidden : false;
            }
          }
          //END: @MobileDBFix

          if (config.columns[i].displayPeriods.indexOf(currentPeriod.periodShortName) === -1) {
            colModelObject.hidden = true;
          }

          // convert function strings to actual functions
          for (var property in colModelObject) {
            if (colModelObject.hasOwnProperty(property) && property != "others" && property != "period") {
              if (typeof colModelObject[property] === "string" && /(\s*function\s*\(|^shell\.)/.test(colModelObject[property])) {
                colModelObject[property] = eval("(" + colModelObject[property] + ")")
              }

            }
          }

          // replace the placeholders
          if (colModelObject.label) {
            var placeholders = [
              [/<=CY=>/g, currentPeriod.year],
              [/<=CYShort=>/g, currentPeriod.year.substring(2)],
              [/<=PY=>/g, parseInt(currentPeriod.year) - 1],
              [/<=PYShort=>/g, (parseInt(currentPeriod.year) - 1).toString().substring(2)],
              [/<=CMShort=>/g, firstToUpperCase(currentPeriod.periodShortName)],
              [/<=CM-1Short=>/g, firstToUpperCase(getPreviousMonth())],
              [/<=CQ=>/g, getCurrentQuarter()],
              [/<=CQ-1=>/g, getPreviousQuarter()]
            ];

            placeholders.forEach(function (placeholderTuple) {
              var placeholderRegex = placeholderTuple[0];
              var replacementValue = placeholderTuple[1];

              colModelObject.label = colModelObject.label.replace(placeholderRegex, replacementValue);
            });
          }

          // set the column names of the data columns
          if (colModelObject.period && !colModelObject.label) {
            colModelObject.label = periods[colModelObject.period]
          }

          // add the 'others' configuration to the colModel
          if (config.columns[i].others) {
            $.extend(colModelObject, eval("(" + config.columns[i].others + ")"));
          }

          colModel.push(colModelObject);
        }

        return colModel;
      }


      /**
       * Get the data for the grid
       * Note: very specific format based on the requirements for IG and Upstream (Shell)
       * @param dataId        DataIds (semicolon separated)
       * @param businessData  The data for the selected business
       * @returns {Array}     Array holding the data for the grid.
       */
      function getGridData(dataId, businessData) {
        var gridData = [],
          kpis = dataId.split(";");

        if (businessData && businessData.kpis && dataId) {
          for (var i = 0; i < kpis.length; i++) {
            var kpi = kpis[i];

            // the ++ indicate the children which will be processed later
            if (kpi === "++") {
              alert("Display of children in a grid is not (yet) supported.");
              return [];
            }

            // try to read the dataset
            if (kpi === "EMPTY") {
              gridData.push({});

            } else if (businessData.kpis[kpi] && businessData.kpis[kpi].data && Object.keys(businessData.kpis[kpi].data).length > 1) {
              gridData.push($.extend({
                kpi: kpi
              }, businessData.kpis[kpi].data, true));
            }
          }
        }

        // check if the mandatory parameters are provided
        return gridData;
      }


      /**
       * Add grouping headers to the Grid
       * @param $grid         Reference to the grid object (jQuery)
       * @param config        The configuration object as provided in the MS Excel
       * @param periods       The periods and its texts
       * @param dataId        Data Identifier
       * @param businessData  Business Data
       */
      function addGroupHeaders($grid, config, periods, dataId, businessData) {
        var groupHeaders,
          headerConfig,
          groupHeaderConfig,
          periodId, periodIdPlaceholder, predefinedPlaceholder,
          uniqueRowNumbers = [],
          i, rowNumber, kpiName,
          cqShortName = getCurrentQuarter(),
          prevQuarterName = getPreviousQuarter(),
          currentPeriod = my.period_functions.getCurrentPeriod(),
          dataIds = dataId.split(";");

        kpiName = (dataIds.length && businessData.kpis[dataIds[0]]) ? businessData.kpis[dataIds[0]].text : "";

        if (config.groupHeaders && config.groupHeaders.length) {

          // get the unique rownumbers
          for (i = 0; i < config.groupHeaders.length; i++) {
            if (uniqueRowNumbers.indexOf(config.groupHeaders[i].row) === -1) {
              uniqueRowNumbers.push(config.groupHeaders[i].row);
            }
          }

          for (rowNumber = 0; rowNumber < uniqueRowNumbers.length; rowNumber++) {
            groupHeaders = [];
            groupHeaderConfig = {};

            for (i = 0; i < config.groupHeaders.length; i++) {
              headerConfig = config.groupHeaders[i];

              if (uniqueRowNumbers[rowNumber] !== headerConfig.row) {
                continue;
              }

              // replace texts based on period labels
              for (periodId in periods) {
                if (periods.hasOwnProperty(periodId)) {
                  periodIdPlaceholder = "<%" + periodId + "%>";
                  headerConfig.titleText = headerConfig.titleText.toString().replace(new RegExp(periodIdPlaceholder, "g"), periods[periodId]);
                }
              }

              // replace pre-defined placeholders
              predefinedPlaceholder = "<=CMShort=>";
              headerConfig.titleText = headerConfig.titleText.toString().replace(new RegExp(predefinedPlaceholder, "g"), firstToUpperCase(currentPeriod.periodShortName));

              predefinedPlaceholder = "<=CM-1Short=>";
              headerConfig.titleText = headerConfig.titleText.toString().replace(new RegExp(predefinedPlaceholder, "g"), firstToUpperCase(getPreviousMonth()));

              predefinedPlaceholder = "<=CQShort=>";
              headerConfig.titleText = headerConfig.titleText.toString().replace(new RegExp(predefinedPlaceholder, "g"), cqShortName);

              predefinedPlaceholder = "<=PQ=>";
              headerConfig.titleText = headerConfig.titleText.toString().replace(new RegExp(predefinedPlaceholder, "g"), prevQuarterName);

              predefinedPlaceholder = "<=CY=>";
              headerConfig.titleText = headerConfig.titleText.toString().replace(new RegExp(predefinedPlaceholder, "g"), (currentPeriod.year).toString());

              predefinedPlaceholder = "<=PY=>";
              headerConfig.titleText = headerConfig.titleText.toString().replace(new RegExp(predefinedPlaceholder, "g"), (currentPeriod.year - 1).toString());

              predefinedPlaceholder = "<=KPI=>";
              headerConfig.titleText = headerConfig.titleText.toString().replace(new RegExp(predefinedPlaceholder, "g"), kpiName);

              groupHeaders.push(headerConfig);
            }

            groupHeaderConfig.groupHeaders = groupHeaders;

            if (config["GroupHeaderConfig"]) {
              $.extend(groupHeaderConfig, eval("(" + config["GroupHeaderConfig"] + ")"));
            }

            $grid.jqGrid('setGroupHeaders', groupHeaderConfig);
          }
        }
      }
    }
  };

  function _getCurrentQuarterNumber() {
    var currentMonth = my.period_functions.getCurrentPeriod().periodShortName;

    switch (currentMonth) {
      case "JAN":
      case "FEB":
      case "MAR":
        return 1;

      case "APR":
      case "MAY":
      case "JUN":
        return 2;

      case "JUL":
      case "AUG":
      case "SEP":
        return 3;

      case "OCT":
      case "NOV":
      case "DEC":
        return 4;
    }
  }

  function getCurrentQuarter() {
    return 'Q' + _getCurrentQuarterNumber();
  }

  function getPreviousQuarter() {
    var currentQuarterNumber = _getCurrentQuarterNumber();
    if (currentQuarterNumber === 1) {
      return 'Q' + (currentQuarterNumber - 1 || 4) + "'" + (my.period_functions.getCurrentPeriod().year - 1);
    }
    return 'Q' + (currentQuarterNumber - 1 || 4);
  }


  function getPreviousMonth() {
    var currentMonth = my.period_functions.getCurrentPeriod().periodShortName;
    var months = ["JAN", "FEB", "MAR", "APR", "MAR", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    var currentMonthIndex = months.indexOf(currentMonth);

    // provide the year as well in case the previous month is DEC
    if (currentMonthIndex === 0) {
      return "DEC '" + ((my.period_functions.getCurrentPeriod().year - 1).toString()).substr(2)
    }

    return months[currentMonthIndex - 1];
  }



  /**
   * Some of the dashboards have very specific requirements which cannot be set in the Excel configuration without
   * coding. Instead of having the code in the MS Excel spreadsheet, these functions are described below and can be
   * called from the MS Excel configuration.
   */

  my.grid = my.grid || {};


  /**
   * Allows to configure styles for the last visible column of a groupingHeader
   *
   * Used to draw vertical lines below the grouping headers in order to better display the columns in the grid
   * that belong together.
   * @param config          The configuration of the grid
   * @param groupHeaderRow  The number of the groupHeader for which the last visible columns are found
   * @param cssStyle        The styling object that is set on the td-tags of the column
   */
  my.grid.setClassEndGroupColumn = function (config, groupHeaderRow, cssStyle) {
    var currentPeriod = shell.app.execdb.dashboard.period_functions.getCurrentPeriod().periodShortName;
    var column;

    config.groupHeaders
      .filter(function (item) {
        return item.row === groupHeaderRow;
      })
      .map(function (groupColumn) {
        var startColumnIndex = null;
        var lastColumnIndex = null;
        for (var i = 0; i < config.columns.length; i++) {
          column = config.columns[i];
          if (column.name === groupColumn.startColumnName) {
            startColumnIndex = i;
            break;
          }
        }

        for (
          var j = startColumnIndex; j < startColumnIndex + groupColumn.numberOfColumns; j++
        ) {
          column = config.columns[j];
          if (column.displayPeriods.indexOf(currentPeriod) !== -1) {
            lastColumnIndex = j;
          }
        }

        return lastColumnIndex;
      })
      .filter(function (item) {
        return item !== null;
      })
      .forEach(function (endColumnIndex) {
        $(".grid td:nth-child(" + (endColumnIndex + 1) + ")").css(cssStyle);
      });
  };


  /**
   * Gets the data for the Business Element Hierarchy.
   *
   * The upstream and the integrated gas dashboards requires the table to display the entire sector data
   * including the line of business data and the performance unit data. This function is used to generate
   * the data structure in the right format and uses the business hierarchy nodetype to determine the
   * levels of the hierarchy.
   *
   * @param dataId        The dataId that needs to be displayed
   * @param columnConfig  The configuration of the columns
   * @param appData       The data for all businesses
   * @param businessData  The data for the selected business
   * @returns {Array}   The array holding all data that needs to be displayed in the grid
   */
  my.grid.getBEHierarchyData = function (dataId, columnConfig, appData, businessData, showPUforBusiness) {
    var businessId = (businessData && businessData.nodetype && (businessData.nodetype === "B" || businessData.nodetype === "LOB" || businessData.nodetype === "PU")) ? businessData.id : null;
    var kpis = (dataId) ? dataId.split(";") : [];
    var kpi = kpis[0];
    var gridData = [];
    var flattenedHierarchy;

    showPUforBusiness = showPUforBusiness || false;

    // get a flattened hierarchy
    flattenedHierarchy = flattenBusinessHierarchy(appData, businessId);

    // Add the grid rows
    if (businessData.nodetype === "PU") {
      addGridRows(flattenedHierarchy.pu, "pu", appData, kpi, columnConfig, gridData);
    } else if (businessData.nodetype === "LOB") {
      addGridRows(flattenedHierarchy.pu, "pu", appData, kpi, columnConfig, gridData);
      addGridRows(flattenedHierarchy.total, "total", appData, kpi, columnConfig, gridData);
    } else if (businessData.nodetype === "B") {
      addGridRows(flattenedHierarchy.lob, "lob", appData, kpi, columnConfig, gridData);
      addGridRows(flattenedHierarchy.total, "total", appData, kpi, columnConfig, gridData);
      if (showPUforBusiness) {
        gridData.push({
          type: "empty"
        });
        addGridRows(flattenedHierarchy.pu, "pu", appData, kpi, columnConfig, gridData);
        addGridRows(flattenedHierarchy.total, "total", appData, kpi, columnConfig, gridData);
      }
    } else {
      addGridRows(flattenedHierarchy.lob, "lob", appData, kpi, columnConfig, gridData);
      addGridRows(flattenedHierarchy.total, "total", appData, kpi, columnConfig, gridData);
      gridData.push({
        type: "empty"
      });
      addGridRows(flattenedHierarchy.pu, "pu", appData, kpi, columnConfig, gridData);
      addGridRows(flattenedHierarchy.total, "total", appData, kpi, columnConfig, gridData);
    }

    return gridData;


    /**
     * Flatten the business hierarchy into three arrays
     * @param appData     All application data (not specific for the current business)
     * @param businessId  The identifier of the business that needs to be displayed
     * @returns {{
     *    total: Array,
     *    lob:   Array,
     *    pu:    Array
     * }}
     */
    function flattenBusinessHierarchy(appData, businessId) {
      var i,
        $datasets = $("body").data("customDataApp").datasets,
        flattenedHierarchy = {
          total: [], // node type S
          lob: [], // node type LOB
          pu: [] // node type PU
        };

      // return if no data
      if (!appData.businessHierarchy.length) {
        return flattenedHierarchy;
      }

      function flat(array) {
        var result = [];
        array.forEach(function (a) {
          result.push(a);
          if (Array.isArray(a.children)) {
            result = result.concat(flat(a.children));
          }
        });
        return result;
      }

      var flatHier = flat(appData.businessHierarchy);
      if (!flatHier.length) {
        return flattenedHierarchy;
      }

      // populate a list of LOBs that are related to the 'B'
      var filteredLOBs = [];
      if (businessData.nodetype === "B") {
        for (i = 0; i < flatHier.length; i++) {
          if (flatHier[i].parentNode === businessId) {
            filteredLOBs.push(flatHier[i].id)
          }
        }
      }

      for (i = 0; i < flatHier.length; i++) {
        switch (flatHier[i].nodetype.toUpperCase()) {
          case "S":
            if (businessData.nodetype === "LOB" || businessData.nodetype === "B") {
              continue;
            }

            flattenedHierarchy.total.push({
              rowDataBusinessId: flatHier[i].id,
              col1: {
                id: flatHier[i].id,
                text: "Total " + flatHier[i].text
              },
              col2: {
                id: null,
                text: null
              }
            });
            break;

          case "B":
            if (businessData.nodetype === "LOB") {
              continue;
            }

            if (businessData.nodetype === "B" && flatHier[i].id === businessId) {
              flattenedHierarchy.total.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].id,
                  text: "Total " + flatHier[i].text
                },
                col2: {
                  id: null,
                  text: null
                }
              });
              continue;
            }
            break;


          case "LOB":
            if (businessData.nodetype === "LOB" && flatHier[i].id === businessId) {
              flattenedHierarchy.total.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].id,
                  text: "Total " + flatHier[i].text
                },
                col2: {
                  id: null,
                  text: null
                }
              });
              continue;
            }

            if (!businessId || (businessData.nodetype === "B" && flatHier[i].parentNode === businessId)) {
              flattenedHierarchy.lob.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].id,
                  text: flatHier[i].text
                },
                col2: {
                  id: null,
                  text: null
                }
              });
            }
            break;

          case "PU":
            if (businessData.nodetype === "B" && filteredLOBs.indexOf(flatHier[i].parentNode) > -1) {
              flattenedHierarchy.pu.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].parentNode,
                  text: $datasets[flatHier[i].parentNode].text
                },
                col2: {
                  id: flatHier[i].id,
                  text: flatHier[i].text
                }
              });
            } else if (!businessId || flatHier[i].parentNode === businessId || flatHier[i].id === businessId) {
              flattenedHierarchy.pu.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].parentNode,
                  text: $datasets[flatHier[i].parentNode].text
                },
                col2: {
                  id: flatHier[i].id,
                  text: flatHier[i].text
                }
              });
            }
            break;
        }
      }

      return flattenedHierarchy;
    }

    /**
     * Add a datarow for the grid
     * @param data          Data for the flattened hierararchy (thus either LOB data or PU data or Total data)
     * @param type          Type of row (same: either LOB, PU or Total)
     * @param appData       All application data (not specific for the current business)
     * @param kpiId         The KPI which needs to be displayed in the grid
     * @param columnConfig  The configuration of the columns as provided in the MS Excel
     * @param gridData      An array holding the grid data (needs to be populated in this function)
     */
    function addGridRows(data, type, appData, kpiId, columnConfig, gridData) {
      var i, y,
        gridObj;

      for (i = 0; i < data.length; i++) {
        gridObj = {
          col1: (i == 0 || data[i].col1.text != data[i - 1].col1.text) ? data[i].col1.text : "",
          col2: data[i].col2.text,
          type: type,
          kpi: kpiId
        };

        // add the data from the KPI
        for (y = 0; y < columnConfig.length; y++) {
          if (columnConfig[y].period &&
            appData.datasets[data[i].rowDataBusinessId] &&
            appData.datasets[data[i].rowDataBusinessId].kpis &&
            appData.datasets[data[i].rowDataBusinessId].kpis[kpiId] &&
            appData.datasets[data[i].rowDataBusinessId].kpis[kpiId].data &&
            appData.datasets[data[i].rowDataBusinessId].kpis[kpiId].data[columnConfig[y].period] !== undefined) {
            gridObj[columnConfig[y].period] = appData.datasets[data[i].rowDataBusinessId].kpis[kpiId].data[columnConfig[y].period];
          }
        }
        if (Object.keys(gridObj).length > 3) {
          gridData.push(gridObj);
        }
      }
    }
  };


  /**
   * Calculates the delta of two values and returns a cell formatter that returns the value
   * @param compare1      value for comparison 1
   * @param compare2      value for comparison 2
   * @param numberFormat  the way the value should be displayed
   * @returns {Function}  formatter function
   */
  my.grid.cellCalculateDelta = function (compare1, compare2, numberFormat) {
    numberFormat = numberFormat || "#,##0.";

    return function (cellvalue, options, rowObject) {
      var calculatedDelta = (rowObject[compare1] - rowObject[compare2]);
      if (!isNaN(calculatedDelta)) {
        return my._formatNumber(numberFormat, calculatedDelta);
      }
      return "";
    };
  };


  /**
   * Calculates the delta of two values and returns a cell attribute function that returns attributes for the cell
   * @param compare1      value for comparison 1
   * @param compare2      value for comparison 2
   * @param invertedKpis  kpis that are inverted (low values are green; high values are red)
   * @returns {Function}  formatter function
   */
  my.grid.cellCalculateDeltaClass = function (compare1, compare2, invertedKpis) {
    return function (rowid, val, rawObject, cm, rdata) {

      var calculatedDelta = (rdata[compare1] - rdata[compare2]);
      var positiveNumberClass = ' class="delta_positive"';
      var negativeNumberClass = ' class="delta_negative"';


      // check if we are dealing with an inverted kpis
      var invertedKpisArray = [];
      if (invertedKpis && invertedKpis !== "") {
        invertedKpisArray = invertedKpis.split(";");
      }
      if (invertedKpisArray.length && rawObject.kpi && invertedKpisArray.indexOf(rawObject.kpi) > -1) {
        positiveNumberClass = ' class="delta_negative"';
        negativeNumberClass = ' class="delta_positive"';
      }

      if (!isNaN(calculatedDelta)) {
        return (calculatedDelta >= 0) ? positiveNumberClass : negativeNumberClass;
      }
    };
  };


  /**
   * Sets the class attribute of the table cell
   * @param className     Name of the class that will be added to the cell
   * @returns {Function}  formatter function
   */
  my.grid.cellAddClass = function (className) {
    return function (rowid, val, rawObject, cm, rdata) {
      return ' class="' + className + '"';
    };
  };


  my.grid.cellDeltaClass = function (inverted) {
    return function (rowid, val, rawObject, cm, rdata) {
      var positiveNumberClass = ' class="delta_positive"';
      var negativeNumberClass = ' class="delta_negative"';

      if (inverted) {
        positiveNumberClass = ' class="delta_negative"';
        negativeNumberClass = ' class="delta_positive"';
      }

      if (!isNaN(val)) {
        return (val >= 0) ? positiveNumberClass : negativeNumberClass;
      }
    };
  };



  /**
   * Enables horizontal hover styles
   *
   * The same style as for the horizontal hovering is used
   */
  my.grid.enableVerticalHover = function () {
    $('.grid td, grid th').hover(function () {
      $('.grid td:nth-child(' + ($(this).index() + 1) + ')').addClass('ui-state-hover');
    }, function () {
      $('.grid td:nth-child(' + ($(this).index() + 1) + ')').removeClass('ui-state-hover');
    });
  };


  /**
   * Set the styling to a group header row
   * @param row         row number
   * @param styleObject CSS style object
   */
  my.grid.addGroupHeaderStyle = function (row, styleObject) {
    setTimeout(function () {
      $(".ui-jqgrid-htable tr:nth-child(" + (row + 1) + ") th").css(styleObject)
    }, 1);
  };


  /**
   * Adds a class to each of the cells of a row based on the attribute of a single cell in the row
   * @param cellAttributeName   name of the cell attribute
   * @param cellAttributeValue  value of the cell attribute
   * @param className           className that needs to be added
   */
  my.grid.addClassToRowCellsBasedOnSingleCellAttr = function (cellAttributeName, cellAttributeValue, className) {
    $("[data-rowtype='" + cellAttributeValue + "']").parent().find("td").addClass(className);
  };



  my.grid.getHeatmapData = function (dataId, config, appData, businessData, showPUforBusiness) {
    var businessId = (businessData && businessData.nodetype && (businessData.nodetype === "B" || businessData.nodetype === "LOB" || businessData.nodetype === "PU")) ? businessData.id : null;
    var kpis = (dataId) ? dataId.split(";") : [];
    var gridData = [];
    var flattenedHierarchy;

    showPUforBusiness = showPUforBusiness || false;

    flattenedHierarchy = flattenBusinessHierarchy(appData, businessId);

    // Add the grid rows
    if (businessData.nodetype === "PU") {
      addGridRows(flattenedHierarchy.pu, "pu", appData, kpis, config, gridData);
    } else if (businessData.nodetype === "B") {
      addGridRows(flattenedHierarchy.lob, "lob", appData, kpis, config, gridData);
      addGridRows(flattenedHierarchy.total, "total", appData, kpis, config, gridData);
      if (showPUforBusiness) {
        gridData.push({
          type: "empty"
        });
        addGridRows(flattenedHierarchy.pu, "pu", appData, kpis, config, gridData);
        addGridRows(flattenedHierarchy.total, "total", appData, kpis, config, gridData);
      }
    } else if (businessData.nodetype === "LOB") {
      addGridRows(flattenedHierarchy.pu, "pu", appData, kpis, config, gridData);
      addGridRows(flattenedHierarchy.total, "total", appData, kpis, config, gridData);
    } else {
      addGridRows(flattenedHierarchy.lob, "lob", appData, kpis, config, gridData);
      addGridRows(flattenedHierarchy.total, "total", appData, kpis, config, gridData);
      gridData.push({
        type: "empty"
      });
      addGridRows(flattenedHierarchy.pu, "pu", appData, kpis, config, gridData);
      addGridRows(flattenedHierarchy.total, "total", appData, kpis, config, gridData);
    }

    return gridData;


    /**
     * Flatten the business hierarchy into three arrays
     * @param appData     All application data (not specific for the current business)
     * @param businessId  The identifier of the business that needs to be displayed
     * @returns {{
     *    total: Array,
     *    lob:   Array,
     *    pu:    Array
     * }}
     */
    function flattenBusinessHierarchy(appData, businessId) {
      var i,
        $datasets = $("body").data("customDataApp").datasets,
        flattenedHierarchy = {
          total: [], // node type S
          lob: [], // node type LOB
          pu: [] // node type PU
        };

      // return if no data
      if (!appData.businessHierarchy.length) {
        return flattenedHierarchy;
      }

      function flat(array) {
        var result = [];
        array.forEach(function (a) {
          result.push(a);
          if (Array.isArray(a.children)) {
            result = result.concat(flat(a.children));
          }
        });
        return result;
      }

      var flatHier = flat(appData.businessHierarchy);
      if (!flatHier.length) {
        return flattenedHierarchy;
      }

      // populate a list of LOBs that are related to the 'B'
      var filteredLOBs = [];
      if (businessData.nodetype === "B") {
        for (i = 0; i < flatHier.length; i++) {
          if (flatHier[i].parentNode === businessId) {
            filteredLOBs.push(flatHier[i].id)
          }
        }
      }

      for (i = 0; i < flatHier.length; i++) {
        switch (flatHier[i].nodetype.toUpperCase()) {
          case "S":
            if (businessData.nodetype === "LOB" || businessData.nodetype === "B") {
              continue;
            }

            flattenedHierarchy.total.push({
              rowDataBusinessId: flatHier[i].id,
              col1: {
                id: flatHier[i].id,
                text: "Total " + flatHier[i].text
              },
              col2: {
                id: null,
                text: null
              }
            });
            break;


          case "B":
            if (businessData.nodetype === "LOB") {
              continue;
            }

            if (businessData.nodetype === "B" && flatHier[i].id === businessId) {
              flattenedHierarchy.total.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].id,
                  text: "Total " + flatHier[i].text
                },
                col2: {
                  id: null,
                  text: null
                }
              });
              continue;
            }
            break;



          case "LOB":
            if (businessData.nodetype === "LOB" && flatHier[i].id === businessId) {
              flattenedHierarchy.total.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].id,
                  text: "Total " + flatHier[i].text
                },
                col2: {
                  id: null,
                  text: null
                }
              });
              continue;
            }

            if (!businessId || (businessData.nodetype === "B" && flatHier[i].parentNode === businessId)) {
              flattenedHierarchy.lob.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].id,
                  text: flatHier[i].text
                },
                col2: {
                  id: null,
                  text: null
                }
              });
            }
            break;

          case "PU":
            if (businessData.nodetype === "B" && filteredLOBs.indexOf(flatHier[i].parentNode) > -1) {
              flattenedHierarchy.pu.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].parentNode,
                  text: $datasets[flatHier[i].parentNode].text
                },
                col2: {
                  id: flatHier[i].id,
                  text: flatHier[i].text
                }
              });
            } else if (!businessId || flatHier[i].parentNode === businessId || flatHier[i].id === businessId) {

              flattenedHierarchy.pu.push({
                rowDataBusinessId: flatHier[i].id,
                col1: {
                  id: flatHier[i].parentNode,
                  text: $datasets[flatHier[i].parentNode].text
                },
                col2: {
                  id: flatHier[i].id,
                  text: flatHier[i].text
                }
              });
            }
            break;
        }
      }

      return flattenedHierarchy;
    }

    /**
     * Add a datarow for the grid
     * @param data          Data for the flattened hierararchy (thus either LOB data or PU data or Total data)
     * @param type          Type of row (same: either LOB, PU or Total)
     * @param appData       All application data (not specific for the current business)
     * @param kpis          Array of the kpis that needs to be displayed
     * @param config        The configuration as provided in the MS Excel
     * @param gridData      An array holding the grid data (needs to be populated in this function)
     */
    function addGridRows(data, type, appData, kpis, config, gridData) {
      var i, y,
        gridObj;

      // check if the periods are delivered in the configuration
      if (!config || !config["ComparePeriods"]) {
        return [];
      }
      var periods = config["ComparePeriods"].split(";");
      if (!periods.length || periods.length !== 2) {
        return [];
      }

      // check if the kpis are delivered
      if (!kpis.length) {
        return [];
      }


      for (i = 0; i < data.length; i++) {
        gridObj = {
          col1: (i == 0 || data[i].col1.text != data[i - 1].col1.text) ? data[i].col1.text : "",
          col2: data[i].col2.text,
          type: type
        };

        kpis.forEach(function (kpi) {
          if (appData.datasets[data[i].rowDataBusinessId].kpis[kpi] &&
            appData.datasets[data[i].rowDataBusinessId].kpis[kpi].data) {

            if (appData.datasets[data[i].rowDataBusinessId].kpis[kpi].data[periods[0]] !== undefined) {
              gridObj[kpi + " - VALUE01"] = appData.datasets[data[i].rowDataBusinessId].kpis[kpi].data[periods[0]];
              if (appData.datasets[data[i].rowDataBusinessId].kpis[kpi].data[periods[1]] !== undefined) {
                gridObj[kpi + " - VALUE02"] = gridObj[kpi + " - VALUE01"] - appData.datasets[data[i].rowDataBusinessId].kpis[kpi].data[periods[1]];
              } else {
                gridObj[kpi + " - VALUE02"] = "";
              }
            } else {
              gridObj[kpi + " - VALUE01"] = "";
              gridObj[kpi + " - VALUE02"] = "";
            }
          }
        });

        if (Object.keys(gridObj).length > 3) {
          gridData.push(gridObj);
        }
      }
    }

  };


  return my;
}(shell.app.execdb.dashboard));