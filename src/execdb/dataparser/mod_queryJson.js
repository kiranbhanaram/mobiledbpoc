shell.app.execdb.dataparser = ( function (my) {

  my.parseQueryJSON = function (service, queries) {
    return getAllQueries(service, queries);

    // get data from BEx query using JSON
    function getAllQueries() {
      var deferred = $.Deferred();
      var promises = [];
      for (var i = 0; i < queries.length; i++) {
        promises.push(getQueryDataFromJSONHandler(service, queries[i]));
      }
      $.when.apply($, promises).then(function () {
        for (var i = 0; i < arguments.length; i++) {
          deferred.resolve(arguments);
        }
      });
      return deferred.promise();
    }

    // get query data
    function getQueryDataFromJSONHandler(service, query) {
      var deferred = $.Deferred();
      $.ajax({
        type: "POST",
        url: service,
        xhrFields: {
          withCredentials: true
        },
        async: true,
        dataType: "json",
        contentType: "text/plain",
        data: JSON.stringify(query),
        success: function (data) {
          if (data.RESULT) {
            $("body").trigger("query_done");
            deferred.resolve(data.RESULT);
          } else {
            $("body").trigger("query_done");
            deferred.resolve(parseQueryResults(data))
          }
        },
        error: function (e) {
          $("body").trigger("query_done");
          deferred.reject(e)
        }
      });
      return deferred.promise();
    }


    /**
     * Convert the flat "Xcelsius like" structure to the Design Studio structure
     * @param data {Array}  Query Results as flat structure
     * @returns {Object}    Object holding the query name and the DS structure
       */
    function parseQueryResults(data) {
      var queryData = (data["QUERY_RESULT"] && data["QUERY_RESULT"].length) ? data["QUERY_RESULT"] : [];
      var queryStructure = getQueryStructure(queryData);
      var dataElements = createQueryElements(queryData, queryStructure);

      // store the data in the customData object
      var queryName = data["QUERY_META"]["QUERY_TECHN_NAME"];
      var obj = {};
      obj[queryName] = dataElements;
      var customData = $("body").data("customData");
      customData = $.extend(true, customData, obj);

      $("body").data("customData", customData);


      return {
        query: queryName,
        data: dataElements
      }
    }


    function getQueryStructure(queryData) {
      var queryStructure = {
        dimensions: [],
        keyfigures: []
      };

      for (var i = 1; i <= 50; i++) {

        // get the column id (COL_01 to COL_50)
        var colNum = ("0" + i);
        colNum = colNum.substring(colNum.length - 2);

        // check if the column has data
        var rowZeroValue = queryData[0]["COL_" + colNum];
        if (rowZeroValue === "") {
          continue;
        }

        // split the characteristics and the key figures
        if (rowZeroValue.substring(0, 5) !== 'VALUE') {
          queryStructure.dimensions.push({
            col: "COL_" + colNum,
            iobj: queryData[0]["COL_" + colNum]
          });
        } else {
          queryStructure.keyfigures.push({
            col: "COL_" + colNum,
            name: queryData[1]["COL_" + colNum]
          });
        }
      }
      return queryStructure;
    }


    function createQueryElements(queryData, queryStructure) {
      var dataElements = [],
        parsedHierNodes = [],
        i, y;

      for (i = 2; i < queryData.length; i++) {
        var element = {};

        // add the dimensions
        for (y=0; y<queryStructure.dimensions.length; y++) {
          var dimValue = queryData[i][queryStructure.dimensions[y].col];
          var dimKey = dimValue;
          var dimText = dimValue;

          // split key and text (if not structure)
          if (queryStructure.dimensions[y].iobj.length < 25) {
            var splitAt = dimValue.indexOf(" ");
            if (splitAt > -1) {
              dimKey = dimValue.substring(0, splitAt);
              dimText = dimValue.substring(splitAt + 1);
            }
          }

          element[queryStructure.dimensions[y].iobj + "_KEY"] = dimKey;
          element[queryStructure.dimensions[y].iobj + "_TEXT"] = dimText;
        }

        if (element["SH000470_KEY"] && queryStructure.keyfigures.length > 1) {
            element["SH000470_KEY"] = "/" + element["SH000470_KEY"];
        }
        if (element["SH100098_KEY"] && queryStructure.keyfigures.length > 1) {
          element["SH100098_KEY"] = "/" + element["SH100098_KEY"];
        }


        // TODO: CHANGE THIS LOGIC. SHOULD BE HANDLED IN BEX QUERY
        // query contains both the hierarchy nodes and the InfoObjects
        if (parsedHierNodes.indexOf(JSON.stringify(element)) > -1) {
          continue;
        } else {
          parsedHierNodes.push(JSON.stringify(element));
        }

        // create an entry for each key-figure
        for (y=0; y<queryStructure.keyfigures.length; y++) {
          var newElement = JSON.parse(JSON.stringify(element));
          newElement["STR_KF_KEY"] = "DUMMY_STRUCTURE_FOR_KF";
          newElement["STR_KF_TEXT"] = queryStructure.keyfigures[y].name;

          var value = queryData[i][queryStructure.keyfigures[y].col];
          newElement["VALUE"] = (value === "") ? null : parseFloat(value);
          dataElements.push(newElement);
        }
      }
      return dataElements;
    }
  };


  return my;

}(shell.app.execdb.dataparser));
