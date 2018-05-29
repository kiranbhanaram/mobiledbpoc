shell.app.execdblp.dataparser = ( function (my) {

  my.parseQueryDesignStudio = function (config) {
    var businessConfig = {};
    if (config["BUSINESS"]) {
      businessConfig = config["BUSINESS"];
    }

    var hierarchyMetadata = _getHierarchyMetadata(businessConfig);
    var comments =  _getComments();
    var parsedData = _createDatasets(hierarchyMetadata);
    if (!parsedData) {
      return null;
    }

    var hierarchy = _createHierarchy(parsedData.datasets, hierarchyMetadata);
    var fullDataset = $.extend(true, {}, hierarchy.datasets);
    var dataset;


    // remove all the kpis from the hierarchy dataset
    for (dataset in hierarchy.datasets) {
      if (hierarchy.datasets.hasOwnProperty(dataset)) {
        delete hierarchy.datasets[dataset].kpis;
      }
    }

    // remove all the children from the kpi dataset
    for (dataset in fullDataset) {
      if (fullDataset.hasOwnProperty(dataset)) {
        var childrenIds = [];
        if (fullDataset[dataset].children && fullDataset[dataset].children.length) {
          for (var i = 0; i < fullDataset[dataset].children.length; i++) {
            childrenIds.push(fullDataset[dataset].children[i].id);
          }
        }
        fullDataset[dataset].children = childrenIds;
      }
    }


    // replace the full child object by just its ID
    //for (var dataset in fullDataset) {
    //  if (fullDataset.hasOwnProperty(dataset)) {
    //    var childrenIds = [];
    //    if (fullDataset[dataset].children && fullDataset[dataset].children.length) {
    //      for (var i = 0; i < fullDataset[dataset].children.length; i++) {
    //        childrenIds.push(fullDataset[dataset].children[i].id);
    //      }
    //    }
    //    fullDataset[dataset].children = childrenIds;
    //  }
    //}

    return ({
      businessHierarchy: hierarchy.businessHierarchy,
      datasets: fullDataset,
      comments: comments,
      periods: parsedData.headerLabels
    });

    //return({
    //  datasets: fullDataset,
    //  comments: comments,
    //  periods: parsedData.headerLabels
    //});


    function _getComments() {
      // get the data
      var customData = $("body").data("customData");
      if (!customData) {
        return [];
      }

      // structure holding the comment relevant infoobjects
      var iobj = {
        ReportName : "XX100134",   // not provided by the query
        Period : "XX100135",       // not provided by the query
        Menu : "XX100136",
        Business : "XX100137",
        Container : "XX100138",
        Filter1 : "XX100139",
        Filter2 : "XX100140",
        Filter3 : "XX100141",
        Filter4 : "XX100142",
        Filter5 : "XX100143",
        Filter6 : "XX100144",
        Filter7 : "XX100145",
        Text1 : "XX100146",
        Text2 : "XX100147",
        Text3 : "XX100148",
        Text4 : "XX100149"
      };

      // get the query that provides the comments
      var comments = [];
      for (var property in customData) {
        if (customData.hasOwnProperty(property)) {
          var data = customData[property];
          if (!data.length) {
            continue;
          }

          // a characteristic that identifies the comment query is the
          // comment text (XX100146)
          if (!data[0][iobj.Text1 + "_TEXT"]) {
            continue;
          }

          // go over each line of the query and create a set for the application
          for (var i=0; i<data.length; i++) {
            var commentText = "";
            for (var y=1; y<=4; y++) {
              if (data[i][iobj["Text" + y]  + "_KEY"] !== "#") {
                if (data[i][iobj["Text" + y]  + "_KEY"] === data[i][iobj["Text" + y]  + "_TEXT"]) {
                  commentText += data[i][iobj["Text" + y] + "_KEY"];
                } else {
                  commentText += data[i][iobj["Text" + y] + "_KEY"] + " ";
                  commentText += data[i][iobj["Text" + y] + "_TEXT"];
                }
              }
            }

            comments.push({
              Menu : data[i][iobj.Menu + "_KEY"],
              Business : data[i][iobj.Business + "_KEY"],
              Container : data[i][iobj.Container + "_KEY"],
              Filter1 : data[i][iobj.Filter1 + "_KEY"],
              Filter2 : data[i][iobj.Filter2 + "_KEY"],
              Filter3 : data[i][iobj.Filter3 + "_KEY"],
              Filter4 : data[i][iobj.Filter4 + "_KEY"],
              Filter5 : data[i][iobj.Filter5 + "_KEY"],
              Filter6 : data[i][iobj.Filter6 + "_KEY"],
              Filter7 : data[i][iobj.Filter7 + "_KEY"],
              Comment : commentText
            });
          }
        }
      }
      return comments;
    }


    function _createDatasets(hierarchyMetadata) {
      var datasets = {},
        headerLabels = {},
        settypes = {
          standard: [],
          exception: []
        };

      // Add data in Design studio is stored in the body of the
      // document in a property called "customData". This is done
      // by the DATA components.
      var customData = $("body").data("customData");
      if (customData) {
        for (var property in customData) {
          if (customData.hasOwnProperty(property)) {
            var data = customData[property];

            // check if the current query result is holding the
            // report data. This is true if two structures can
            // be found, of which one contains the CM period
            var metaStructures = getStructureIds(data);
            if (!metaStructures) {
              continue;
            }

            // pre-process the data
            var enhancedData = enhanceData(metaStructures, data, hierarchyMetadata);
            var dataLabels = getHeaderlabels(metaStructures, data);

            // store the headerLabels
            for (var i=0; i<dataLabels.length; i++) {
              headerLabels[dataLabels[i].id] = headerLabels[dataLabels[i].id] || dataLabels[i].label;
            }

            // because the standard queries needs to be processed before the exception
            // queries, we need to store the values for later processing
            var setObject = {
              data: enhancedData,
              metaStructures: metaStructures,
              dataLabels: dataLabels
            };

            // separate the standard datasets from the exception datasets
            if (enhancedData && enhancedData.length) {
              if (enhancedData[0].isException) {
                settypes.exception.push(setObject);
              } else {
                settypes.standard.push(setObject);
              }
            }
          }
        }

        // first process the standard queries
        // extract the kpi data
        var setIndex;
        if (settypes.standard.length) {
          for (setIndex = 0; setIndex < settypes.standard.length; setIndex++) {
            $.extend(
              true,
              datasets,
              buildDatasets(
                settypes.standard[setIndex].data,
                settypes.standard[setIndex].metaStructures,
                settypes.standard[setIndex].dataLabels
              ),
              datasets);
          }
        }

        // now process the exception queries
        if (settypes.exception.length) {
          for (setIndex = 0; setIndex < settypes.exception.length; setIndex++) {
            $.extend(
              true,
              datasets,
              buildDatasets(
                settypes.exception[setIndex].data,
                settypes.exception[setIndex].metaStructures,
                settypes.exception[setIndex].dataLabels
              ),
              datasets);
          }
        }

        return {
          datasets: datasets,
          headerLabels: headerLabels
        }
      }

      /**
       * Gets the generated BEx query structure Ids
       *
       * The IDs of the structures used in the BEx query are generated by SAP and
       * can be different per system. The query consists of two structures. One
       * for the PERIODS and one for the GROUPINGS.
       *
       * This function extracts the generated IDs and returns an object holding
       * the metadata (key and text).
       *
       * NOTE:
       * The first GROUPING text in the BEx query should always start with the
       * following four characters : ' ---'
       *
       * @param data   the query resultset
       * @return       object holding the ids of the BEx query structures or
       *               null in case the IDs could not be determined
       */
      function getStructureIds(data) {

        // prepare the result object
        var metaStructures = {
          periodStructureKey: null,
          periodStructureText: null,
          sectorKey: "SH000470_KEY",
          sectorText: "SH000470_TEXT",
          miSectorKey: "SH100098_KEY",
          miSectorText: "SH100098_TEXT",
          businessEntityKey: "SH100242_KEY",
          businessEntityText: "SH100242_TEXT",
          kpiStructureKey: null,
          kpiStructureText: null,
          value: "VALUE"
        };

        if (!data || !data[0]) {
          return null;
        }

        // determine the ID for the GROUPING structure based on the property name of the first
        // data item (starting with ' ---').
        var property;
        for (property in data[0]) {
          if (data[0].hasOwnProperty(property)) {

            // get the structure key and name
            if ( ( ("" + data[0][property]).substring(0, 4) === " ---" || ("" + data[0][property]).substring(0, 3) === "---" ) && property.substring(property.length - 4) !== "_KEY") {
              metaStructures.kpiStructureText = property;
              metaStructures.kpiStructureKey = property.substring(0, (property.length - 5)) + "_KEY";
              break;
            }
          }
        }

        // get the structure id for the PERIODS structure (the 'other' structure)
        for (property in data[0]) {
          if (data[0].hasOwnProperty(property)) {
            if (property !== metaStructures.kpiStructureKey &&
              property !== metaStructures.kpiStructureText &&
              property !== metaStructures.businessEntityKey &&
              property !== metaStructures.businessEntityText &&
              property !== metaStructures.sectorKey &&
              property !== metaStructures.sectorText &&
              property !== metaStructures.miSectorKey &&
              property !== metaStructures.miSectorText &&
              property !== metaStructures.value) {
              if (property.substring(property.length - 4) === "_KEY") {
                metaStructures.periodStructureKey = property;
                metaStructures.periodStructureText = property.substring(0, (property.length - 4)) + "_TEXT";
              }
              break;
            }
          }
        }

        // only proceed if the metadata is known
        if (!metaStructures.periodStructureKey || !metaStructures.periodStructureText || !metaStructures.kpiStructureText || !metaStructures.kpiStructureKey) {
          return null;
        }

        return metaStructures;
      }


      /**
       * Extract the KEY and TEXT used in the Structures
       *
       * The GROUPING structure has one leading row that describes a specific
       * grouping in the BEx query (called VIEW name). This leading row will
       * be followed with rows that hold the data for this specifi VIEW. These
       * rows start with the VIEW ID followed with a space and then the GROUP
       * NAME.
       *
       * Example:
       *  --- 100.01 My Description
       * 100.01 Group Name 1
       * 100.01 Another Group Name
       *
       * This function is used to add the following information to each data
       * record based on the GROUPING structure:
       * - viewName       --> i.e. 100.01 My Description
       * - extKey         --> i.e. 100.01
       * - extText        --> i.e. Group Name 1
       *
       *
       * Also this function extracts the KEY and TEXT for the period structure
       * which is required as the TEXTS of the periods are determined in SAP
       * via a text variable.
       *
       * Example:
       * CM CY - FEB 2015
       *
       * The following data will be extracted based on this property:
       * - extPeriodKey   --> i.e. CM CY
       * - extPeriodText  --> i.e. FEB 2015
       *
       * This function extracts the generated IDs and returns an object holding
       * the metadata (key and text).
       *
       *
       * @param metaStructures    the Ids of the BEx query structures
       * @param data              the query resultset
       * @param hierarchyMetadata the meta data for the hierarchy nodes
       * @return {Array}          the query resultset enhanced with the viewName, grouping
       *                          key, grouping text, period key and period text
       */
      function enhanceData(metaStructures, data, hierarchyMetadata) {
        var enhancedData = [],
            keySeparator;

        for (var i = 0; i < data.length; i++) {

          // check if the GROUPING property holds the VIEW DESCRIPTION (starts with ' ---')
          try {
            if (data[i][metaStructures.kpiStructureText].substring(0, 4) === " ---"
              || data[i][metaStructures.kpiStructureText].substring(0, 3) === "---") {
              continue;
            }
          } catch (err) {
            continue;
          }

          // add the grouping key and text
          try {
            // search for the - in the kpi description
            var sepIndex = data[i][metaStructures.kpiStructureText].indexOf("-");
            data[i].extKey = data[i][metaStructures.kpiStructureText].substring(0, sepIndex - 1);
            data[i].extText = data[i][metaStructures.kpiStructureText].substring(sepIndex + 2);
          } catch (err) {
            // do nothing if an error occurs
          }

          // the sector exception query contains the sector key in brackets
          var sectorExceptionOpeningBracket = data[i].extKey.indexOf("(");
          var sectorExceptionClosingBracket = data[i].extKey.indexOf(")");
          if (sectorExceptionOpeningBracket > -1 && sectorExceptionClosingBracket > sectorExceptionOpeningBracket) {
            data[i][metaStructures.sectorKey] = "/" + data[i].extKey.substring(sectorExceptionOpeningBracket + 1, sectorExceptionClosingBracket);
            data[i].extKey = data[i].extKey.substring(0, sectorExceptionOpeningBracket);
            data[i].isException = true;
          }

          // add the period key and text to the data
          try {
            var fullPeriod = data[i][metaStructures.periodStructureText];
            data[i].extPeriodKey = fullPeriod.substring(0, fullPeriod.indexOf(" - "));
            data[i].extPeriodText = fullPeriod.substring(fullPeriod.indexOf(" - ") + 3);
          } catch (err) {
            // do nothing if an error occurs
          }

          // move the Mi sector data to the sector
          if (data[i][metaStructures.miSectorKey]) {
            data[i][metaStructures.sectorKey] = data[i][metaStructures.miSectorKey];
            data[i][metaStructures.sectorText] = data[i][metaStructures.miSectorKey];
          }


          // add the sector to the data
          if (data[i][metaStructures.sectorKey]) {

            var sectorKey = data[i][metaStructures.sectorKey] || data[i][metaStructures.miSectorKey];
            keySeparator = sectorKey.lastIndexOf("/");
            if (keySeparator > -1) {
              sectorKey = sectorKey.substring(keySeparator + 1);
            } else {
              // only hierarchy nodes are permitted for sector
              continue;
            }

            data[i].businessKey = "SE-" + sectorKey;

            // read the business text from the hierarchy meta data
            if (hierarchyMetadata && hierarchyMetadata.nodeMetadata && hierarchyMetadata.nodeMetadata["SE-" + sectorKey]) {
              data[i].businessText = hierarchyMetadata.nodeMetadata["SE-" + sectorKey].name;
            } else if (data[i][metaStructures.sectorText]) {
              data[i].businessText = data[i][metaStructures.sectorText];
            } else {
              data[i].businessText = sectorKey;
            }


          } else if (data[i][metaStructures.businessEntityKey]) {
            var businessEntityKey = data[i][metaStructures.businessEntityKey];
            keySeparator = businessEntityKey.lastIndexOf("/");
            if (keySeparator > -1) {
              businessEntityKey = businessEntityKey.substring(keySeparator + 1);
            }

            data[i].businessKey = "BE-" + businessEntityKey;
            data[i].businessText = data[i][metaStructures.businessEntityText];
          }

          // change null to undefined for the merge of datasets
          if (data[i].VALUE === null) {
            data[i].VALUE = undefined;
          }

          enhancedData.push(data[i]);
        }

        return enhancedData;
      }


      /**
       * Get the header labels from the dataset
       *
       * The periods are provided as key and text. The provided periods are equal
       * to all the datasets within the data. This generic function is determining
       * the headerlabels only one time.
       *
       * NOTE:
       * The first GROUPING text in the BEx query should always start with the
       * following four characters : ' ---'
       *
       * @param metaStructures    the Ids of the BEx query structures
       * @param data              the query resultset
       * @return {Array}          the header labels (both id and label)
       */
      function getHeaderlabels(metaStructures, data) {

        // result object
        var headerLabels = [{
          id: "Group",
          label: ""
        }];

        // the first row in the dataset should have a value for each period and can therefore
        // be used to determine the periods.
        var curStr = null;
        for (var i = 0; i < data.length; i++) {

          // proceed as long as we are still on the first row
          if ( "" + data[i][metaStructures.kpiStructureText].substring(0, 4) === " ---" || "" + data[i][metaStructures.kpiStructureText].substring(0, 3) === "---" ) {
            if (curStr !== data[i][metaStructures.kpiStructureText] && curStr !== null) {
              break;
            } else {
              curStr =  data[i][metaStructures.kpiStructureText];
            }


            try {
              var fullPeriod = data[i][metaStructures.periodStructureText];
              headerLabels.push({
                id: fullPeriod.substring(0, fullPeriod.indexOf(" - ")),
                label: fullPeriod.substring(fullPeriod.indexOf(" - ") + 3)
              });
            } catch (err) {
              // do nothing
            }
          } else {
            // break the loop in case the second row is processed
            break;
          }
        }

        return headerLabels;
      }


      /**
       * Get the header labels from the dataset
       *
       * The periods are provided as key and text. The provided periods are equal
       * to all the datasets within the data. This generic function is determining
       * the headerlabels only one time.
       *
       * NOTE:
       * The first GROUPING text in the BEx query should always start with the
       * following four characters : ' ---'
       *
       * @param enhancedData      the query resultset enhanced with the viewName, grouping
       *                          key, grouping text, period key and period text
       * @param metaStructures    the Ids of the BEx query structures
       */
      function buildDatasets(enhancedData, metaStructures) {
        var datasets = {};

        for (var i = 0; i < enhancedData.length; i++) {

          // every row must have a business key assigned
          if (!enhancedData[i].businessKey) {
            continue;
          }

          // check if the dataset id is already defined
          if (!datasets[enhancedData[i].businessKey]) {
            datasets[enhancedData[i].businessKey] = {
              text: enhancedData[i].businessText,
              kpis: {},
              parentNode: enhancedData[i]["businessParent"],
              id: enhancedData[i].businessKey,
              color: enhancedData[i].color
            }
          }

          // add the kpi if not already defined
          if (!datasets[enhancedData[i].businessKey].kpis[enhancedData[i].extKey]) {
            datasets[enhancedData[i].businessKey].kpis[enhancedData[i].extKey] = {
              text: enhancedData[i].extText,
              data: {
                'Group': enhancedData[i].extText
              }
              //headerLabels: headerLabels
            };
          }

          // add the value
          datasets[enhancedData[i].businessKey].kpis[enhancedData[i].extKey].data[enhancedData[i].extPeriodKey] = enhancedData[i][metaStructures.value];
        }

        return datasets;
      }
    }


    function _createHierarchy(datasets, hierarchyMetadata) {

      // next: create the datasets and the hierarchy
      return {
        businessHierarchy: addHierarchyMetaToDatasets(hierarchyMetadata, datasets),
        datasets: datasets
      };


      // add the hierarchy metadata to the report data (actual data)
      function addHierarchyMetaToDatasets(hierarchyMetadata, datasets) {

        var arrData = [];
        for (var property in datasets) {
          if (datasets.hasOwnProperty(property)) {
            var mapIndex;

            // add the node metadata
            if (hierarchyMetadata.nodeMetadata && hierarchyMetadata.nodeMetadata[property]) {
              $.extend(true, datasets[property], datasets[property], hierarchyMetadata.nodeMetadata[property]);
            }

            // check if the node should be removed
            if (hierarchyMetadata && hierarchyMetadata.mappingTable && hierarchyMetadata.mappingTable.to){
                mapIndex = hierarchyMetadata.mappingTable.to.indexOf(datasets[property].parentNode);
              if (mapIndex > -1) {
                continue;
              }
            }

            // check if the parent node needs to be re-mapped
            if (hierarchyMetadata && hierarchyMetadata.mappingTable && hierarchyMetadata.mappingTable.from) {
              mapIndex = hierarchyMetadata.mappingTable.from.indexOf(datasets[property].parentNode);
              if (mapIndex > -1) {
                datasets[property].parentNode = hierarchyMetadata.mappingTable.to[mapIndex];
              }
            }

            arrData.push(datasets[property]);
          }
        }


        function buildHierarchy(arry, hierarchyMetadata) {

          var roots = [],
            children = {},
            customRoots = (hierarchyMetadata.topNodes && hierarchyMetadata.topNodes.length) ? hierarchyMetadata.topNodes : [],
            x, z;

          // find the top level nodes and hash the children based on parent
          for (x = 0; x < arry.length; x++) {
            var item = arry[x],
              p = item.parentNode;

            // check the roots
            if (customRoots.length
              && customRoots.length > 0
            ) {
              // roots may only be of type sector
              if (customRoots.indexOf(item.id) === -1 || (!customRoots.length && item.id.substring(0, 3) !== "SE-") ) {
                if (!p) {
                  continue;
                }
              } else {
                delete(item.parentNode);
                p = null;

                item.state = {
                  'opened': true
                }
              }
            }
            // if no topnodes are specified, the rootnodes are the items without a parent
            else if (!p) {
              // roots may only be of type sector
              if (item.id.substring(0, 3) !== "SE-") {
                continue;
              } else {
                item.state = {
                  'opened': true
                }
              }
            }

            var target = !p ? roots : (children[p] || (children[p] = []));
            target.push(item);
          }

          // function to recursively build the tree
          var findChildren = function (parent) {
            if (children[parent.id]) {
              parent.children = children[parent.id];
              for (var y = 0; y < parent.children.length; y++) {
                findChildren(parent.children[y]);
              }
            }
          };

          // enumerate through to handle the case where there are multiple roots
          for (z = 0; z < roots.length; z++) {
            findChildren(roots[z]);
          }
          return roots
        }

        /**
         * Sort the hierarchy nodes, first by the order defined in the configuration
         * next alphabetically
         * @param arrData
         * @param hierarchyMetadata
           */
        function sortHierNodes(arrData, hierarchyMetadata) {

          // read the sorting configuration
          var hierOrder = hierarchyMetadata.nodeOrder;

          // split the nodes:
          // - group A: items defined in the hierOrder array (will be sorted by hierOrder)
          // - group B: items not defined in the array (will be sorted alphabetically)
          var groupA = [],
            groupB = [];
          for (var x=0; x<arrData.length; x++) {
            if (!arrData[x].id || !arrData[x].name) {
              // don't do anything...
            } else if (hierOrder && hierOrder.indexOf(arrData[x].id) > -1) {
              groupA.push(arrData[x]);
            } else {
              groupB.push(arrData[x]);
            }
          }

          // sort group A
          groupA.sort(function(a, b){
            return hierOrder.indexOf(a.id) - hierOrder.indexOf(b.id);
          });

          // sort group B
          groupB.sort(function(a, b){
            if(a.name && b.name && a.name < b.name) return -1;
            if(a.name && b.name && a.name > b.name) return 1;
            return 0;
          });

          return groupA.concat(groupB);
        }

        // create the hierarchy object for jsTree
        var sortedHierNodes = sortHierNodes(arrData, hierarchyMetadata);
        return buildHierarchy(sortedHierNodes, hierarchyMetadata);
      }

    }

    function _getHierarchyMetadata(config) {
      var cfg = {
        iobjMappingFrom: "SH100534",
        iobjMappingTo: "SH100535",
        iobjBusinessElement: "SH100242",
        iobjBusinessElementParent: "SH100438",
        iobjBusinessElementParent2: "SH100439",
        iobjBusinessElementType: "SH100277",
        iobjSector: "SH000470",
        iobjMiSector: "SH100098",
        iobjSectorParent: "XX000304",
        iobjColorCode: "SH100546",
        iobjHierarchyNodeId: "SHXXXXX0",
        iobjHierarchyOrder: "SHXXXXX1"
      };

      var metadata = {
        mappingTable: null,
        nodeMetadata: null,
        nodeOrder: config["node_order"],
        topNodes: config["top_nodes"]
      };

      var sectorNodeMetadata;
      var businessElementMetadata;

      var customData = $("body").data("customData");
      if (customData) {
        for (var property in customData) {
          if (customData.hasOwnProperty(property)) {
            var data = customData[property];
            if (!data || !data.length) {
              continue;
            }

            // is mapping table query?
            if (data[0][cfg.iobjMappingFrom + "_KEY"] !== undefined
             && data[0][cfg.iobjMappingTo + "_KEY"] !== undefined) {
              metadata.mappingTable = getMappingtable(cfg, data);
            }

            // is sector metadata?
            if (data[0][cfg.iobjSector + "_KEY"] !== undefined
             && data[0][cfg.iobjSectorParent + "_KEY"] !== undefined) {
              sectorNodeMetadata = getSectorNodeMeta(cfg, data, config);
            }

            // is business element metadata?
            if (
              data[0][cfg.iobjBusinessElement + "_KEY"] !== undefined
              && (data[0][cfg.iobjBusinessElementParent + "_KEY"] !== undefined
                || data[0][cfg.iobjBusinessElementParent2 + "_KEY"] !== undefined)
              ) {
              businessElementMetadata = getBusinessElementNodeMeta(cfg, data, config);
            }
          }
        }

        metadata.nodeMetadata = $.extend(true, sectorNodeMetadata, businessElementMetadata);
      }
      return metadata;


      function getMappingtable(cfg, data) {
        var mappingTable = {
          from: [],
          to: []
        };
        for (var i=0; i<data.length; i++) {
          mappingTable.from.push(data[i][cfg.iobjMappingFrom + "_TEXT"]);
          mappingTable.to.push(data[i][cfg.iobjMappingTo + "_TEXT"]);
        }
        return  mappingTable;
      }


      function getSectorNodeMeta(cfg, data, userConfig) {
        var nodeMeta = {};

        for (var i=0; i<data.length; i++) {
          var parentNodeId = data[i][cfg.iobjSectorParent + "_KEY"];
          var hierNode = "SE-" + data[i][cfg.iobjSector + "_KEY"];
          var parentNode = data[i][cfg.iobjSectorParent + "_KEY"] ? "SE-" + data[i][cfg.iobjSectorParent + "_KEY"] : null;
          var color = (data[i][cfg.iobjColorCode + "_KEY"] !== "#") ? data[i][cfg.iobjColorCode + "_KEY"] : null;
          var name = data[i][cfg.iobjSector + "_TEXT"];

          // check if the name needs to be overwritten due to the configuration
          if (userConfig && userConfig.renaming && userConfig.renaming[hierNode]) {
            name = userConfig.renaming[hierNode];
          }

          nodeMeta[hierNode] = {
            parentNode: (parentNode !== hierNode && parentNodeId !== '#') ? parentNode : null,
            color: color,
            name: name
          }
        }
        return nodeMeta;
      }

      function getBusinessElementNodeMeta(cfg, data, userConfig) {
        var nodeMeta = {};
        for (var i=0; i<data.length; i++) {
          var hierNode = "BE-" + data[i][cfg.iobjBusinessElement + "_KEY"];
          var parentNode = null;
          var color = (data[i][cfg.iobjColorCode + "_KEY"] !== "#") ? data[i][cfg.iobjColorCode + "_KEY"] : null;
          var name = data[i][cfg.iobjBusinessElement + "_TEXT"];

          // determine the parent node
          if (data[i][cfg.iobjBusinessElementParent + "_KEY"]) {
            parentNode = "BE-" + data[i][cfg.iobjBusinessElementParent + "_KEY"];
          } else if (data[i][cfg.iobjBusinessElementParent2 + "_KEY"]) {
            parentNode = "BE-" + data[i][cfg.iobjBusinessElementParent2 + "_KEY"];
          }

          // check if the name needs to be overwritten due to the configuration
          if (userConfig && userConfig.renaming && userConfig.renaming[hierNode]) {
            name = userConfig.renaming[hierNode];
          }

          nodeMeta[hierNode] = {
            parentNode: parentNode,
            color: color,
            name: name
          };

          // if a business element type is provided, add it to the metadata
          if (data[i][cfg.iobjBusinessElementType + '_KEY']) {
            nodeMeta[hierNode].nodetype = data[i][cfg.iobjBusinessElementType + '_KEY'];
          }
        }
        return nodeMeta;
      }

    }
  };

  return my;

}(shell.app.execdblp.dataparser));
