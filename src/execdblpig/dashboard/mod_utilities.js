shell.app.execdblp.dashboard = ( function (my) {

  // check for mobile thingies
  my.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  my.eventTrigger = (my.isMobile) ? "touchstart" : "click";


  my.getSourceValue = function(businessKey, kpiKey, periodKey) {
    var foundItems = [];

    var $queries = $("body").data("customData");
    Object.keys($queries).forEach(function(query) {
      var queryResults = $queries[query].filter(function(obj){
        return (obj.businessKey === businessKey && obj.extKey === kpiKey && obj.extPeriodKey === periodKey);
      });

      if (queryResults.length) {
        var foundItem = {};
        foundItem[query] = queryResults;
        foundItems.push(foundItem);
      }
    });

    return foundItems;
  };


  my._addUtilities = function () {

    Highcharts.setOptions({
      lang: {
        numericSymbols: null //otherwise by default ['k', 'M', 'G', 'T', 'P', 'E']
      }
    });

// special functions
    Number.prototype.mod = function (n) {
      return ((this % n) + n) % n;
    };

    Date.prototype.addBusDays = function (dd) {
      var wks = Math.floor(dd / 5);
      var dys = dd.mod(5);
      var dy = this.getDay();

      if (dy === 6 && dys > -1) {
        if (dys === 0) {
          dys -= 2;
          dy += 2;
        }
        dys++;
        dy -= 6;
      }

      if (dy === 0 && dys < 1) {
        if (dys === 0) {
          dys += 2;
          dy -= 2;
        }
        dys--;
        dy += 6;
      }

      if (dy + dys > 5) dys += 2;
      if (dy + dys < 1) dys -= 2;
      this.setDate(this.getDate() + wks * 7 + dys);
    };
  };

  my._getTrendData = function (businessData, kpi, dataPoints) {
    var periods = getDataPointsForCurrentMonth(dataPoints),
      returnObject;

    // in order to get the trend, we need exactly two datapoints
    if (!periods || !periods.length) {
      return;
    } else if (periods.length !== 2) {
      return;
    }

    // check if the KPI data is available
    var kpiData = (businessData && businessData.kpis) ? businessData.kpis[kpi] : null;
    if (!kpiData) {
      return;
    }

    // define the return object
    returnObject = {
      kpi: {
        id: kpi,
        label: kpiData.text
      },
      oldPeriod: {
        id: periods[0],
        label: my.period_functions.getPeriodIdentifierLabel(periods[0])
      },
      newPeriod: {
        id: periods[1],
        label: my.period_functions.getPeriodIdentifierLabel(periods[1])
      }
    };

    // the trend icon and its value is set by the difference in percentage
    // between the current month compared to the previous month
    if (!kpiData
      || !kpiData.data
      || !kpiData.data[periods[0]]
      || !kpiData.data[periods[1]]) {
      return returnObject;
    }

    // get the values
    var valuePrevious = kpiData.data[periods[0]],
      valueCurrent = kpiData.data[periods[1]];
    try {
      returnObject.oldValue = valuePrevious;
      returnObject.newValue = valueCurrent;
      returnObject.differencePercentage = (( valueCurrent - valuePrevious ) / Math.abs( valuePrevious ) * 100).toFixed();
      return returnObject;
    } catch (err) {
      return 0;
    }


    function getDataPointsForCurrentMonth(dataPoints) {
      var currentMonth = my.period_functions.getCurrentPeriod().periodShortName;

      for (var i = 0; i < dataPoints.length; i++) {
        if (dataPoints[i].months
          && dataPoints[i].months.length
          && dataPoints[i].months.indexOf(currentMonth) > -1) {
          return dataPoints[i].displayPeriods;
        }
      }
      return null;
    }
  };



  my._formatNumber = function (m, v) {
    if (!m || isNaN(+v)) {
      return v; //return as it is.
    }
    //convert any string to number according to formation sign.
    var v = m.charAt(0) == '-' ? -v : +v;
    var isNegative = v < 0 ? v = -v : 0; //process only abs(), and turn on flag.

    //search for separator for grp & decimal, anything not digit, not +/- sign, not #.
    var result = m.match(/[^\d\-\+#]/g);
    var Decimal = (result && result[result.length - 1]) || '.'; //treat the right most symbol as decimal
    var Group = (result && result[1] && result[0]) || ',';  //treat the left most symbol as group separator

    //split the decimal for the format string if any.
    var m = m.split(Decimal);
    //Fix the decimal first, toFixed will auto fill trailing zero.
    v = v.toFixed(m[1] && m[1].length);
    v = +(v) + ''; //convert number to string to trim off *all* trailing decimal zero(es)

    //fill back any trailing zero according to format
    var pos_trail_zero = m[1] && m[1].lastIndexOf('0'); //look for last zero in format
    var part = v.split('.');
    //integer will get !part[1]
    if (!part[1] || part[1] && part[1].length <= pos_trail_zero) {
      v = (+v).toFixed(pos_trail_zero + 1);
    }
    var szSep = m[0].split(Group); //look for separator
    m[0] = szSep.join(''); //join back without separator for counting the pos of any leading 0.

    var pos_lead_zero = m[0] && m[0].indexOf('0');
    if (pos_lead_zero > -1) {
      while (part[0].length < (m[0].length - pos_lead_zero)) {
        part[0] = '0' + part[0];
      }
    }
    else if (+part[0] == 0) {
      part[0] = '';
    }

    v = v.split('.');
    v[0] = part[0];

    //process the first group separator from decimal (.) only, the rest ignore.
    //get the length of the last slice of split result.
    var pos_separator = ( szSep[1] && szSep[szSep.length - 1].length);
    if (pos_separator) {
      var integer = v[0];
      var str = '';
      var offset = integer.length % pos_separator;
      for (var i = 0, l = integer.length; i < l; i++) {

        str += integer.charAt(i); //ie6 only support charAt for sz.
        //-pos_separator so that won't trail separator on full length
        if (!((i - offset + 1) % pos_separator) && i < l - pos_separator) {
          str += Group;
        }
      }
      v[0] = str;
    }

    v[1] = (m[1] && v[1]) ? Decimal + v[1] : "";
    return (isNegative ? '-' : '') + v[0] + v[1]; //put back any negation and combine integer and fraction.

  };


  return my;

}(shell.app.execdblp.dashboard));
