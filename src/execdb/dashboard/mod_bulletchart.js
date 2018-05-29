shell.app.execdb.dashboard = ( function (my) {

  /**
   * Generates table
   *
   * This is a generic function that is used to generate the HTML for a table
   *
   * @param containerDiv   the ID of the HTML div element in which the object
   *                       needs to be rendered
   * @param config         the configuration settings for the bullet chart
   * @param dataId         the ID of the data for the object
   * @param businessData   the data for the selected business
   */
  my._createBulletChart = function (containerDiv, config, dataId, businessData) {

    // get the data
    var $body = $("body"),
      customConfig = $body.data("customConfig"),
      dataset = [];
    if (customConfig && businessData && businessData.kpis && dataId) {

      // split the kpis
      var kpis = dataId.split(";");
      for (var i = 0; i < kpis.length; i++) {
        var kpi = kpis[i];

        // check for specific configuration settings
        // config string is build up like 100.01[{'text':'abc'}]
        // find the [ and the ] character in the string to see if a configuration setting exist
        var startConfigIndex = kpi.indexOf("[");
        var endConfigIndex = kpi.lastIndexOf("]");
        var kpiConfig = {};
        if ( (startConfigIndex > -1) && (endConfigIndex > -1)) {
          var cfgString = kpi.substring(startConfigIndex + 1, endConfigIndex);
          kpi = kpi.substring(0, startConfigIndex);
          try{
            kpiConfig = JSON.parse(cfgString)
          } catch(err) {
            console.error("Unable to parse configuration string for kpi " + kpi)
          }
        }

        // the ++ indicate the children which will be processed later
        if (kpi === "++") {
          continue;
        }

        // try to read the dataset
        if (kpi === "EMPTY") {
          dataset.push({
            Group: ''
          });

        } else if (businessData.kpis[kpi] && businessData.kpis[kpi].data) {
          dataset.push($.extend({_kpi: kpi}, businessData.kpis[kpi].data, true));

          // check if the children need to be displayed
          if (i < kpis.length && kpis[i + 1] === '++') {

            // check if the child needs to be hidden due to configuration settings
            var hideChildren = config["HideChildren"] ? config["HideChildren"].split(";") : [];

            dataset[dataset.length - 1].Group = businessData.text;

            // get the children
            var businessDatasets = $body.data("customDataApp").datasets;
            var nodeInfo = $("#jbi_businesses").jstree().get_node(businessData.id);
            if (nodeInfo && nodeInfo.children && nodeInfo.children.length) {
              for (var y = 0; y < nodeInfo.children.length; y++) {

                // check if child is in the 'to hide' table
                if (hideChildren.indexOf(nodeInfo.children[y]) > -1) {
                  continue;
                }

                // check if there is data for the child
                var childKpis = businessDatasets[nodeInfo.children[y]];
                if (childKpis.kpis && childKpis.kpis[kpi] && childKpis.kpis[kpi].data){
                  dataset.push($.extend({}, childKpis.kpis[kpi].data, true));
                } else {
                  dataset.push({})
                }

                dataset[dataset.length - 1].Group = "   " + childKpis.text;
              }
            }
          }
        }
      }
    }


    // fill an array with the column information
    var columnConfig = getColumnConfiguration(config, dataset);
    if (columnConfig.error) {
      $body.trigger("showContainerMessage", {
        container: containerDiv,
        message: columnConfig.message,
        type: columnConfig.message_type
      });
      return;
    }

    if (!columnConfig.error) {
      addCSS(containerDiv, config, columnConfig);
      addHTML(containerDiv, config, columnConfig, dataset);
      _buildBullets(containerDiv, config);

      addEventListeners();
    }



    function addEventListeners() {
      var $body = $("body");
      var editMode = ($body.data("comment_edit_mode"));

      if (editMode) {
        var $commentBox = $("[data-commentcol='x']");
        $commentBox.unbind("blur");
        $commentBox.on("blur", function (evt) {
          var commentText = evt.currentTarget.innerHTML;
          var containerId = $(this).data("commentid");
          my._writeComment(commentText, containerId)
        });
      }
    }

    function getColumnConfiguration(config, dataset) {
      if (!config || !config["DataPoints"]) {
        return {
          error: true,
          message: "No configuration for datapoints set.",
          message_type: "E"
        };
      }

      // make sure that data is available
      var dataAvailable = false;
      if (dataset && dataset.length) {
        for (var rowIndex=0; rowIndex<dataset.length; rowIndex++) {
          var rowObject = dataset[rowIndex];
          for (var columnName in rowObject) {
            if (rowObject.hasOwnProperty(columnName)) {
              if (columnName !== "Group") {
                dataAvailable = true;
                break;
              }
            }
          }
          if (dataAvailable) {
            break;
          }
        }
      }
      if (!dataAvailable) {
        return {
          error: true,
          message: "No data available.",
          message_type: "W"
        };
      }

      // determine which periods are valid for the current month
      var periodSettings = JSON.parse(config["DataPoints"]);
      var currentPeriod = my.period_functions.getCurrentPeriod().periodShortName;
      var columnConfig = {};
      for (i=0; i<periodSettings.length; i++) {
        if (periodSettings[i].months.indexOf(currentPeriod) > -1) {
          columnConfig = periodSettings[i];
          break;
        }
      }
      return columnConfig;
    }



    /**
     * Generates the CSS for table
     *
     * The CSS settings are provided via the configuration. CSS can be set for an
     * entire table, a table column, a table row or a specific table cell.
     * This function generates a CSS string which will then be added to the header
     * of the document.
     *
     * @param containerDiv   the ID of the HTML div element in which the object
     *                       needs to be rendered
     * @param config         the total configuration object
     * @param columnConfig   an object holding the configuration settings for the
     *                       columns
     */
    function addCSS(containerDiv, config, columnConfig) {

      // the CSS is provided in the settings
      if (!config || !config.settings || !config.settings.length) {
        return;
      }

      // create the CSS string
      var s = "";
      s += "<style type='text/css' id='CSS_TABLE_" + containerDiv + "' data-group='LAYOUT'  data-repstyle='execdb'>";

      for (var i = 0; i < config.settings.length; i++) {

        // check if a CSS setting is provided
        if (config.settings[i].css !== undefined && config.settings[i].css !== null) {

          // settings per row
          var className = "";

          if (config.settings[i].rowIndex !== undefined &&
            config.settings[i].colIndex === undefined) {
            if (config.settings[i].rowIndex === "*") {
              className += " tr";
            } else if (config.settings[i].rowIndex === "{odd}") {
              className += " tr:nth-child(odd)";
            } else if (config.settings[i].rowIndex === "{even}") {
              className += " tr:nth-child(even)";
            } else if (config.settings[i].rowIndex === "{hover}") {
              if (my.isMobile) {
                continue;
              }
              className += " tr:hover";
            } else if (config.settings[i].rowIndex === 0) {
              className += " th";
            } else if (("" + config.settings[i].rowIndex).indexOf(",") > -1) {
              var strIndices = config.settings[i].rowIndex.split(",");
              var strClasses = [];
              for (y = 0; y < strIndices.length; y++) {
                strClasses.push(className + " .tr" + strIndices[y]);
              }
              className = strClasses.join();
            } else {
              className += " .tr" + config.settings[i].rowIndex;
            }
          }

          // settings per column
          if (config.settings[i].colIndex !== undefined &&
            config.settings[i].rowIndex === undefined) {
            if (config.settings[i].colIndex === "*") {
              className += " td";
            } else if (config.settings[i].colIndex === "{odd}") {
              className += " td:nth-child(odd)";
            } else if (config.settings[i].colIndex === "{even}") {
              className += " td:nth-child(even)";
            } else if (config.settings[i].colIndex === "{hover}") {
              if (my.isMobile) {
                continue;
              }
              className += " tr:hover";
            } else if (config.settings[i].colIndex.length && config.settings[i].colIndex.indexOf("<") === 0 && config.settings[i].colIndex.indexOf(">") === config.settings[i].colIndex.length - 1) {

              // get the source column by name and find the index of this column
              var sourceColumn = config.settings[i].colIndex.substring(1, config.settings[i].colIndex.length - 1),
                sourceColumnIndex = -1;
              if (columnConfig && columnConfig.length) {
                for (var iColumnConfig = 0; iColumnConfig < columnConfig.length; iColumnConfig++) {
                  if (columnConfig[iColumnConfig]["SourceColumn"] === sourceColumn) {
                    sourceColumnIndex = iColumnConfig + 1;
                    break;
                  }
                }
                if (sourceColumnIndex > -1) {
                  className += " .td" + sourceColumnIndex;
                }
              }

            } else if (("" + config.settings[i].colIndex).indexOf(",") > -1) {
              strIndices = config.settings[i].colIndex.split(",");
              strClasses = [];
              for (y = 0; y < strIndices.length; y++) {
                strClasses.push(className + " .td" + strIndices[y]);
              }
              className = strClasses.join();
            } else {
              className += " .td" + config.settings[i].colIndex;
            }
          }

          // setting per cell
          if (config.settings[i].colIndex !== undefined &&
            config.settings[i].rowIndex !== undefined) {

            var arrCols = [],
              arrRows = [],
              arrCells = [];

            // get the columns
            if (config.settings[i].colIndex === "*") {
              arrCols.push(" td");
            } else if (config.settings[i].colIndex === "{odd}") {
              arrCols.push(" td:nth-child(odd)");
            } else if (config.settings[i].colIndex === "{even}") {
              arrCols.push(" td:nth-child(even)");
            } else if (("" + config.settings[i].colIndex).indexOf(",") > -1) {
              strIndices = config.settings[i].colIndex.split(",");
              for (y = 0; y < strIndices.length; y++) {
                arrCols.push(" .td" + strIndices[y]);
              }
            } else {
              arrCols.push(" .td" + config.settings[i].colIndex);
            }

            // get the rows
            if (config.settings[i].rowIndex === "*") {
              arrRows.push(" tr");
            } else if (config.settings[i].rowIndex === "{odd}") {
              arrRows.push(" tr:nth-child(odd)");
            } else if (config.settings[i].rowIndex === "{even}") {
              arrRows.push(" tr:nth-child(even)");
            } else if (("" + config.settings[i].rowIndex).indexOf(",") > -1) {
              strIndices = config.settings[i].rowIndex.split(",");
              for (y = 0; y < strIndices.length; y++) {
                arrRows.push(" .tr" + strIndices[y]);
              }
            } else {
              arrRows.push(" .tr" + config.settings[i].rowIndex);
            }

            // generate the css per cell
            for (var c = 0; c < arrCols.length; c++) {
              for (var r = 0; r < arrRows.length; r++) {
                arrCells.push(className + arrRows[r] + arrCols[c]);
              }
            }

            className = arrCells.join();
          }


          // setting for entire table
          if (( config.settings[i].colIndex === undefined )
            && ( config.settings[i].rowIndex === undefined )) {
            //className += " .customtable";
          }

          // add the style
          s += "#" + containerDiv + " .customtable " + className + "{" + config.settings[i].css + "}";
        }
      }
      s += "</style>";
      $(s).appendTo("head");
    }

    /**
     * Generates the HTML for the table header
     *
     * The labels used in the header are provided either via the configuration settings
     * or (if not provided via the configuration) via the BEx query. The BEx query is
     * using text-variables in order to set the correct month names.
     *
     * @param columnConfig      an object holding the configuration settings for the
     *                          columns
     * @param config            the configuration for the entire object
     * @return {String}         a HTML string holding the table header
     */
    function getHTMLTableHeaderRow(columnConfig, config) {

      var columnHeaderLabels = [],
        i,
        html = "";

      if (!columnConfig || !columnConfig["displayColumns"]) {
        return "";
      }

      // get the column header labels
      for (i = 0; i < columnConfig["displayColumns"].length; i++) {

        // if a predefined headerLabel is defined in the configuration, use this
        if (columnConfig["HeaderText"] && columnConfig["HeaderText"][i]) {
          columnHeaderLabels.push(columnConfig["HeaderText"][i]);
          continue;
        }

        // if a SourceColumn is defined in the configuration, get the header label from the
        // BEx query (via the headerLabels)
        if (columnConfig["displayColumns"][i]) {

          // lookup the label for the source column
          var bexHeaderLabel = my.period_functions.getPeriodIdentifierLabel(columnConfig["displayColumns"][i]);
          if (bexHeaderLabel === columnConfig["displayColumns"][i]) {
            bexHeaderLabel = "";
          }

          // because the lack of space, trim the header line before the year
          if (bexHeaderLabel !== "") {
            if (isNaN(parseInt(bexHeaderLabel.substr(( bexHeaderLabel.length - 4 ))))) {
              columnHeaderLabels.push(bexHeaderLabel);
            } else {
              columnHeaderLabels.push(bexHeaderLabel.substr(0, bexHeaderLabel.length - 5).trim() + "<br>" + bexHeaderLabel.substr(bexHeaderLabel.length - 5).trim());
            }
            continue;
          }
        }

        // in case the headerlabel is not provided in the configuration and not as SourceColumn, add an empty line
        columnHeaderLabels.push("");
      }

      // generate the HTML
      // check if the configuration has a header row prior to the standard header
      if (config["CustomHeaderBefore"]) {
        html += config["CustomHeaderBefore"];
      }

      html += "<tr class='tr0'>";
      for (i = 0; i < columnHeaderLabels.length; i++) {
        html += "<th class='td" + (i + 1 ) + "'>" + columnHeaderLabels[i] + "</th>";
      }
      html += "</tr>";

      return html;
    }


    /**
     * Generates the HTML for the table contents
     *
     * The labels used in the header are provided either via the configuration settings
     * or (if not provided via the configuration) via the BEx query. The BEx query is
     * using text-variables in order to set the correct month names.
     *
     * @param config            the configuration for the entire object
     * @param columnConfig      an object holding the configuration settings for the
     *                          columns
     * @param dataset           the resultset of the BEx query
     * @param divId             the identifier of the div
     * @return {String}         a HTML string holding the table contents
     */
    function getHTMLTableContent(config, columnConfig, dataset, divId) {
      var containerId = divId.substring(9),
        rows = [],
        row,
        col,
        html = "",
        cell,
        i;

      if (!dataset || !dataset.length) {
        return html;
      }

      // get the metadata for the cells
      for (row = 0; row < dataset.length; row++) {
        var cols = [];

        for (col = 0; col < columnConfig["displayColumns"].length; col++) {
          cell = {
            label: "",
            raw: null,
            classes: ["tr" + (row + 1), "td" + (col + 1)],
            attr: []
          };

          if ((columnConfig["displayColumns"][col]
            && dataset[row][columnConfig["displayColumns"][col]] !== undefined
            && dataset[row][columnConfig["displayColumns"][col]] !== null) ||
            (("" + columnConfig["displayColumns"][col]).substring(0, 1) === "%"
            && ("" + columnConfig["displayColumns"][col]).substring(("" + columnConfig["displayColumns"][col]).length - 1, ("" + columnConfig["displayColumns"][col]).length) === "%"
            && dataset[row].Group !== "")
          ) {

            cell.label = dataset[row][columnConfig["displayColumns"][col]];
            cell.raw = dataset[row][columnConfig["displayColumns"][col]];

            // determine the column type based on the name of the 'displayColumn'
            //cell.type = "standard";
            if (columnConfig["displayColumns"][col] === "%BULLET%") {
              cell.classes.push("bulletchart");
              cell.label = "";
              cell.raw = "";


              // get the data for the bulletchart and store it in the cell attribute
              var data = [];

              // columnNames
              var actualColumn = columnConfig["bulletColumns"] && columnConfig["bulletColumns"]["actual"] && columnConfig["bulletColumns"]["actual"] !== "" ? columnConfig["bulletColumns"]["actual"] : null;
              var planColumn = columnConfig["bulletColumns"] && columnConfig["bulletColumns"]["plan"] && columnConfig["bulletColumns"]["plan"] !== "" ? columnConfig["bulletColumns"]["plan"] : null;
              var leColumn = columnConfig["bulletColumns"] && columnConfig["bulletColumns"]["le"] && columnConfig["bulletColumns"]["le"] !== "" ? columnConfig["bulletColumns"]["le"] : null;

              // get the values
              var actualValue = actualColumn
                ? dataset[row][actualColumn]
                : null;
              var planValue = planColumn
                ? dataset[row][planColumn]
                : null;
              var leValue = leColumn
                ? dataset[row][leColumn]
                : null;

              data.push(actualValue);
              data.push(planValue);
              data.push(leValue);

              cell.attr.push({
                name: "data-chartdata",
                value: data.join(",")
              });


              var chartDecimals = 0;
              if (config && config.settings && config.settings.length) {
                for (i = 0; i < config.settings.length; i++) {
                  if (config.settings[i].rowIndex && config.settings[i].rowIndex === (row + 1) && config.settings[i].chartDecimals !== undefined) {
                    chartDecimals = config.settings[i].chartDecimals;
                  } else if (!config.settings[i].rowIndex && !config.settings[i].colIndex && config.settings[i].chartDecimals !== undefined) {
                    chartDecimals = config.settings[i].chartDecimals;
                  }
                }
              }

              cell.attr.push({
                name: "data-decimals",
                value: chartDecimals
              });

              // Add the chart labels
              var headerLabelIds = [actualColumn, planColumn, leColumn];
              var dataLabels = [];
              for (var x = 0; x < headerLabelIds.length; x++) {
                if (headerLabelIds[x]) {
                  dataLabels.push(my.period_functions.getPeriodIdentifierLabel(headerLabelIds[x]));
                } else {
                  dataLabels.push("");
                }
              }
              cell.attr.push({
                name: "data-chartdatalabels",
                value: dataLabels.join(",")
              })

            } else if (columnConfig["displayColumns"][col] === "%KPI_COMMENT%") {

              // if the page is in 'full-screen' mode, the container id needs to be searched for
              var contId = containerId,
                $zoomContainerBackButton = $("#zoomContainerBackButton"),
                $zoomContainer = $("#zoomContainer"),
                backId;
              if ($zoomContainer.length) {
                if ($zoomContainerBackButton.data("currentContainer")) {
                  var fullIdentifier = $zoomContainerBackButton.data("currentContainer");
                  backId = fullIdentifier.substring( fullIdentifier.indexOf("container") + 15);
                  if (backId > 1) {
                    contId = parseInt(backId) - 1;
                  } else {
                    contId = $zoomContainer.length;
                  }
                } else {
                  contId = 1;
                }
              }


              // get the comment text
              var commentContainerId = contId + ";" + dataset[row]["_kpi"];

              // check if currently in comment edit mode
              var $body = $("body");
              var editMode = ($body.data("comment_edit_mode"));

              // decode the text
              var decodedText = "";
              try {
                decodedText = decodeURIComponent(my._getCommentText(commentContainerId));
              }catch(e){
              }

              if (editMode) {
                cell.label = "<div style='background-color:#f8ef9f;' contenteditable='true' data-commentcol='x' data-commentid='" + commentContainerId + "'>" + decodedText + "</div>"
              } else {
                cell.label = decodedText;
              }
            }

          } else {
            cell.classes.push("emptycell");

            /** SHELL LOGIC --> SHOW N/A in case label is empty, but group is populated **/
            if (dataset[row].Group !== "") {
              cell.label = "N/A";
            }
          }


          cols.push(cell);
        }
        rows.push(cols);
      }

      // apply the formatters
      rows = applyFormatters(config, rows, columnConfig);


      // generate the HTML
      for (row = 0; row < rows.length; row++) {
        html += "<tr class='tr" + (row + 1 ) + "'>";
        for (col = 0; col < rows[row].length; col++) {
          cell = rows[row][col];

          // add the classes
          html += "<td class='";
          for (i = 0; i < cell.classes.length; i++) {
            if (i > 0)
              html += " ";

            html += cell.classes[i];
          }
          html += "'";

          // add the attributes
          for (i = 0; i < cell.attr.length; i++) {
            html += " " + cell.attr[i].name + "='" + cell.attr[i].value + "'";
          }

          // add the text
          html += ">" + cell.label + "</td>";
        }
        html += "</tr>";
      }

      return html;
    }


    /**
     * Apply the correct format on the values in the tables
     *
     * Sets the correct format of the values in the table. The required formats are provided
     * via the configuration. Via a format function (see data handler) the values are
     * formatted.
     *
     * @param config            the configuration for the entire object
     * @param dataset           the cell meta data with the raw value
     * @param columnConfig      an object holding the configuration settings for the
     *                          columns
     * @return                  the cell meta data with the formatted value
     */
    function applyFormatters(config, dataset, columnConfig) {

      var i,
        row,
        col,
        columnIndex,
        sourceColumn,
        iColumnConfig;

      if (!config || !config.settings || !config.settings.length) {
        return dataset;
      }

      for (i = 0; i < config.settings.length; i++) {
        if (config.settings[i].format !== undefined) {

          var cellValue;

          // apply the formatter on a specific cell
          if (config.settings[i].rowIndex !== undefined
            && config.settings[i].rowIndex !== null
            && config.settings[i].colIndex !== undefined
            && config.settings[i].colIndex !== null) {


            // check if the columnIndex should be retrieved based on the sourceColumn name
            columnIndex = -1;
            if (config.settings[i].colIndex.length && config.settings[i].colIndex.indexOf("<") === 0 && config.settings[i].colIndex.indexOf(">") === config.settings[i].colIndex.length - 1) {

              // get the source column by name and find the index of this column
              sourceColumn = config.settings[i].colIndex.substring(1, config.settings[i].colIndex.length - 1);
              if (columnConfig && columnConfig.length) {
                for (iColumnConfig = 0; iColumnConfig < columnConfig.length; iColumnConfig++) {
                  if (columnConfig[iColumnConfig]["SourceColumn"] === sourceColumn) {
                    columnIndex = iColumnConfig;
                    break;
                  }
                }
              }
            } else {
              columnIndex = config.settings[i].colIndex - 1;
            }

            // check if the cell exists
            cellValue = dataset[config.settings[i].rowIndex - 1][columnIndex];
            if (cellValue !== undefined
              && cellValue !== null
              && cellValue.raw !== undefined
              && cellValue.raw !== null
              && cellValue.raw !== "") {
              dataset[config.settings[i].rowIndex - 1][columnIndex].label = my._formatNumber(config.settings[i].format, cellValue.raw);
            }
          }

          // apply the formatter on a specific row
          if (config.settings[i].rowIndex !== undefined
            && config.settings[i].rowIndex !== null
            && ( config.settings[i].colIndex === undefined
            || config.settings[i].colIndex === null )
            && dataset[config.settings[i].rowIndex - 1]
            && dataset[config.settings[i].rowIndex - 1].length) {

            for (col = 0; col < dataset[config.settings[i].rowIndex - 1].length; col++) {
              cellValue = dataset[config.settings[i].rowIndex - 1][col];
              if (cellValue !== undefined
                && cellValue !== null
                && cellValue.raw !== undefined
                && cellValue.raw !== null
                && cellValue.raw !== "") {
                dataset[config.settings[i].rowIndex - 1][col].label = my._formatNumber(config.settings[i].format, cellValue.raw);
              }
            }
          }

          // apply the formatter on a specific column
          if (( config.settings[i].rowIndex === undefined
            || config.settings[i].rowIndex === null )
            && config.settings[i].colIndex !== undefined
            && config.settings[i].colIndex !== null
            && dataset.length) {

            // check if the columnIndex should be retrieved based on the sourceColumn name
            columnIndex = -1;
            if (config.settings[i].colIndex.length && config.settings[i].colIndex.indexOf("<") === 0 && config.settings[i].colIndex.indexOf(">") === config.settings[i].colIndex.length - 1) {

              // get the source column by name and find the index of this column
              sourceColumn = config.settings[i].colIndex.substring(1, config.settings[i].colIndex.length - 1);
              if (columnConfig && columnConfig.length) {
                for (iColumnConfig = 0; iColumnConfig < columnConfig.length; iColumnConfig++) {
                  if (columnConfig[iColumnConfig]["SourceColumn"] === sourceColumn) {
                    columnIndex = iColumnConfig;
                    break;
                  }
                }
              }
            } else {
              columnIndex = config.settings[i].colIndex - 1;
            }

            // apply the formatters for every column cell
            if (columnIndex > -1) {
              for (row = 0; row < dataset.length; row++) {
                if (dataset[row][columnIndex]) {
                  cellValue = dataset[row][columnIndex];
                  if (cellValue !== undefined
                    && cellValue !== null
                    && cellValue.raw !== undefined
                    && cellValue.raw !== null
                    && cellValue.raw !== "") {
                    dataset[row][columnIndex].label = my._formatNumber(config.settings[i].format, cellValue.raw);
                  }
                }
              }
            }
          }

          // apply the formatter on a whole table
          if (( config.settings[i].rowIndex === undefined
            || config.settings[i].rowIndex === null )
            && ( config.settings[i].colIndex === undefined
            || config.settings[i].colIndex === null )
            && dataset.length) {

            for (row = 0; row < dataset.length; row++) {
              for (col = 0; col < dataset[row].length; col++) {
                cellValue = dataset[row][col];
                if (cellValue !== undefined
                  && cellValue !== null
                  && cellValue.raw !== undefined
                  && cellValue.raw !== null
                  && cellValue.raw !== "") {
                  dataset[row][col].label = my._formatNumber(config.settings[i].format, cellValue.raw);
                }
              }
            }
          }
        }
      }
      return dataset;
    }


    /**
     * Create the HTML table
     *
     * Build up a HTML string based on the configuration settings and the results of
     * the dataset. Add the table to the containerDiv
     *
     * @param containerDiv      the ID of the HTML div element in which the object
     *                          needs to be rendered
     * @param config            the configuration for the entire object
     * @param columnConfig      an object holding the configuration settings for the
     *                          columns
     * @param dataset           the cell meta data with the raw value
     */
    function addHTML(containerDiv, config, columnConfig, dataset) {
      var s = "";
      if (dataset && dataset.length) {
        s += "<table class=\"customtable\">";
        s += getHTMLTableHeaderRow(columnConfig, config);
        s += getHTMLTableContent(config, columnConfig, dataset, containerDiv);
        s += "</table>";
      }

      // Add the HTML to the container
      $("#" + containerDiv + "Content").html(s);

      // If necessary, overwrite specific columns based on the settings
      if (config && config.settings && config.settings.length) {
        for (var i=0; i<config.settings.length; i++) {
          if (config.settings[i].text
            && config.settings[i].colIndex !== undefined
            && config.settings[i].rowIndex !== undefined) {
            $("#" + containerDiv + " .tr" + config.settings[i].rowIndex + ".td" + config.settings[i].colIndex).html(config.settings[i].text);
          }
        }
      }
    }
  };




  /*****************************************************************************
   *                                                                            *
   *                          BULLET CHART SPECIFIC                             *
   *                                                                            *
   *****************************************************************************/

  /**
   * Create the bullet charts
   *
   * The bullet charts are created inside a HTML table. The TD element in which
   * the bullet charts should be created have a classname 'bulletchart' and hold
   * an array of data in the TD attribute 'data-chartdata'. The names of the
   * values are stored in TD attribute 'td-chartdatalabels'.
   * Highcharts is used to generate the bullet charts
   *
   * @param containerDiv      the ID of the HTML div element in which the object
   *                          needs to be rendered
   * @param config            Configuration object for the container
   * @private
   */
  function _buildBullets(containerDiv, config) {

    var bulletWidth = (config && config["BulletWidth"]) ? config["BulletWidth"] : 200;

    // Prepend a notification about the chart scales and the legend
//@formatter:off
            var s = "<div style='font-size:11px;font-family:Verdana,Geneva,sans-serif;color:#333;text-align:center;margin-top:5px;'>Bullet charts are using different scales.</div>";
                s += "<div style='width:100%;margin-top: 10px;height:10px;margin-bottom:20px;'>";
                  s += "<table style='font-size:11px;font-family:Verdana,Geneva,sans-serif;margin:0 auto;border-collapse:separate;border-spacing:10px 0;'>";
                    s += "<tr style='height: 20px;'>";
                      s += "<td class='bulletLegendActualColumn' style='display:none;width:150px;'><div style='width: 15px;float: left;height: 6px;margin-top: 7px;background-color: #000;'></div><span class='bulletLegendTitle' style='position: relative;left: 5px;line-height: 22px;'></span></td>";
                      s += "<td class='bulletLegendPlanColumn' style='display:none;width:150px;'><div style='width: 15px;float: left;height: 15px;margin-top: 2px;background-color: #D8D8D8;'></div><span class='bulletLegendTitle' style='position: relative;left: 5px;line-height: 22px;'></span></td>";
                      s += "<td class='bulletLegendLEColumn' style='display:none;width:150px;'><div style='width: 3px;float: left;height: 15px;margin-top: 2px;background-color: #000;'></div><span class='bulletLegendTitle' style='position: relative;left: 5px;line-height: 22px;'></span></td>";
                    s += "</tr>";
                  s += "</table>";
                s += "</div>";
//@formatter:on
    $("#" + containerDiv + " .customtable").before(s);


    // Highcharts Configuration for Bullet Charts
    Highcharts.Renderer.prototype.symbols.line = function (x, y, width, height) {
      return ['M',
        x - 3,
        y + (height / 2),
        'L',
        x + width + 3,
        y + ( height / 2 )
      ];
    };

    Highcharts.BulletChart = function (a, b, c) {
      var hasRenderToArg = typeof a === 'string' || a.nodeName,
        options = arguments[hasRenderToArg ? 1 : 0],
        defaultOptions = {
          chart: {
            renderTo: (options.chart && options.chart.renderTo) || this,
            type: 'bar',
            margin: [5, 15, 10, 5],
            width: b.custom.bulletWidth,
            height: 35,
            plotBorderWidth: 1,
            plotBorderColor: "#979797",
            backgroundColor: 'transparent',
            skipClone: true
          },
          credits: {enabled: false},
          exporting: {enabled: false},
          legend: {enabled: false},
          title: {text: ''},
          xAxis: {
            tickLength: 0,
            lineColor: '#999',
            lineWidth: 0,
            labels: {
              enabled: false,
              style: {
                fontWeight: 'bold'
              }
            }
          },
          yAxis: {
            gridLineWidth: 0,
            title: {text: ''},
            labels: {
              y: 10,
              style: {
                fontSize: '8px'
              },
              useHTML: true,
              formatter: function () {
                if (this.value < 0) {
                  return "<font style=\"color:red;\">" + Highcharts.numberFormat(this.value, options.custom.decimals) + "</font>";
                } else if (this.value === 0) {
                  return "<font style=\"font-weight:bold;\">0</font>";
                } else {
                  return Highcharts.numberFormat(this.value, options.custom.decimals);
                }
              }
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgb(255, 255, 255)',
            borderWidth: 0,
            shadow: true,
            style: {fontSize: '10px', padding: 2},
            formatter: function () {
              if (this.series.tooltipOptions["valueSuffix"]) {
                return this.series.name + ": <strong>" + Highcharts.numberFormat(this.y, options.custom.decimals) + this.series.tooltipOptions.valueSuffix + "</strong>";
              }
              return this.series.name + ": <strong>" + Highcharts.numberFormat(this.y, options.custom.decimals) + "</strong>";

            }
          },
          plotOptions: {
            bar: {
              color: '#000',
              shadow: false,
              borderWidth: 0
            },
            scatter: {
              marker: {
                symbol: 'line',
                lineWidth: 3,
                radius: 8,
                lineColor: '#000'
              }
            },
            series: {
              //enableMouseTracking: !(my.isMobile),
              states: {
                hover: {
                  enabled: !(my.isMobile)
                }
              }
            }
          }
        };

      options = Highcharts.merge(defaultOptions, options);

      return hasRenderToArg ?
        new Highcharts.Chart(a, options, c) :
        new Highcharts.Chart(options, b);
    };


    // get the cells in which the bullet chart needs to be created
    $("#" + containerDiv + " .bulletchart").each(function (index) {

      // create an object for the individual bullet chart
      var chartConfig = {
        custom: {
          decimals: $(this).data("decimals") ? parseInt($(this).data("decimals")) : 0,
          bulletWidth: bulletWidth
        },
        series: [],
        plotOptions: {
          bar: {
            tooltip: {}
          },
          scatter: {
            tooltip: {}
          }
        }
      };

      // extract the data from the td and convert to values
      var chartDataString = $(this).data("chartdata"),
        chartDataLabelString = $(this).data("chartdatalabels"),
        chartData = chartDataString.split(",").map(function (x) {
          if (!x || x === "") {
            return null;
          } else {
            return parseFloat(x);
          }
        }),
        chartDataLabels = chartDataLabelString.split(","),
        actualValue = chartData[0],
        actualLabel = chartDataLabels[0],
        planValue = chartData[1],
        planLabel = chartDataLabels[1],
        leValue = chartData[2],
        leLabel = chartDataLabels[2];

      if (actualValue !== undefined && actualValue !== null) {
        chartConfig.series.push({
          name: actualLabel,
          pointWidth: 8,
          data: [actualValue],
          zIndex: 2
        });
      }

      if (planValue !== undefined && planValue !== null) {
        chartConfig.series.push({
          name: planLabel,
          pointWidth: 30,
          type: "column",
          color: '#D8D8D8',
          data: [planValue],
          zIndex: 1
        });
      }

      if (leValue !== undefined && leValue !== null) {
        chartConfig.series.push({
          name: leLabel,
          type: 'scatter',
          data: [leValue], zIndex: 3
        });
      }


      $(this).highcharts('BulletChart', chartConfig);


      // Set the legend labels
      if (index === 0) {

        // set the legend titles
        if (actualLabel && actualLabel !== "") {
          $("#" + containerDiv + " .bulletLegendActualColumn .bulletLegendTitle").html(actualLabel);
          $("#" + containerDiv + " .bulletLegendActualColumn").show();
        } else {
          $("#" + containerDiv + " .bulletLegendActualColumn").hide();
        }

        if (planLabel && planLabel !== "") {
          $("#" + containerDiv + " .bulletLegendPlanColumn .bulletLegendTitle").html(planLabel);
          $("#" + containerDiv + " .bulletLegendPlanColumn").show();
        } else {
          $("#" + containerDiv + " .bulletLegendPlanColumn").hide();
        }

        if (leLabel && leLabel !== "") {
          $("#" + containerDiv + " .bulletLegendLEColumn .bulletLegendTitle").html(leLabel);
          $("#" + containerDiv + " .bulletLegendLEColumn").show();
        } else {
          $("#" + containerDiv + " .bulletLegendLEColumn").hide();
        }

      }
    });
  }


  return my;
}(shell.app.execdb.dashboard));
