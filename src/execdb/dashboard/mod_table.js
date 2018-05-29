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
  my._createTable = function (containerDiv, config, dataId, businessData) {
    if (!dataId) {
      return;
    }

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
          dataset.push($.extend({}, businessData.kpis[kpi].data, true));

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
      s += "<style type='text/css' id='CSS_TABLE_" + containerDiv + "' data-group='LAYOUT' data-repstyle='execdb'>";

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
              if (columnConfig["displayColumns"] && columnConfig["displayColumns"].length) {
                sourceColumnIndex = columnConfig["displayColumns"].indexOf(sourceColumn);
                if (sourceColumnIndex > -1) {
                  className += " .td" + (sourceColumnIndex + 1);
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
     * @return {String}         a HTML string holding the table header
     */
    function getHTMLTableHeaderRow(columnConfig) {

      var columnHeaderLabels = [],
        i,
        html;

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
      html = "<tr class='tr0'>";
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
     * @return {String}         a HTML string holding the table contents
     */
    function getHTMLTableContent(config, columnConfig, dataset) {

      var rows = [],
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

          if (columnConfig["displayColumns"][col]
            && dataset[row][columnConfig["displayColumns"][col]] !== undefined
            && dataset[row][columnConfig["displayColumns"][col]] !== null) {

            cell.label = dataset[row][columnConfig["displayColumns"][col]];
            cell.raw = dataset[row][columnConfig["displayColumns"][col]];

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
        sourceColumn;

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
              if (columnConfig && columnConfig["displayColumns"] && columnConfig["displayColumns"].length) {
                columnIndex = columnConfig["displayColumns"].indexOf(sourceColumn);
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
              if (columnConfig && columnConfig["displayColumns"] && columnConfig["displayColumns"].length) {
                columnIndex = columnConfig["displayColumns"].indexOf(sourceColumn);
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
        s += getHTMLTableHeaderRow(columnConfig);
        s += getHTMLTableContent(config, columnConfig, dataset);
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

  return my;
}(shell.app.execdb.dashboard));
