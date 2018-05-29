shell.app.execdblp.dashboard = ( function (my) {


  /**
   * Converts a month short name to a number (Jan --> 1)
   * @param periodShortName {string} the short name of the month
   * @returns {string} the number of the month. Or (in case the input string was not valid, -1)
     */
  function periodShortNameToNumber(periodShortName) {
    var periodShortNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
      periodShortNamesIndex = periodShortNames.indexOf(periodShortName);
    if (periodShortNamesIndex > -1) {
      var periodNumber = "000" + (periodShortNamesIndex + 1);
      return periodNumber.substring(periodNumber.length - 3);
    }
    return "000";
  }


  function periodNumberToShortName(periodNumber) {
    var periodNumbers = ["001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011", "012"],
      periodShortNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    var periodIndex = periodNumbers.indexOf(periodNumber);
    if (periodIndex > -1) {
      return periodShortNames[periodIndex];
    }
    return null;
  }


  function periodNumberToFullName(periodNumber) {
    var periodNumbers = ["001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011", "012"],
      periodShortNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    var periodIndex = periodNumbers.indexOf(periodNumber);
    if (periodIndex > -1) {
      return periodShortNames[periodIndex];
    }
    return null;
  }


  /**
   * Converts a month short name to a full name
   * @param periodShortName {string} the short name of the month
   * @returns {string} the full name of the month
     */
  function periodShortNameToFullName(periodShortName) {
    var periodShortNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
      periodFullNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      periodShortNamesIndex = periodShortNames.indexOf(periodShortName);
    if (periodShortNamesIndex > -1) {
      return (periodFullNames[periodShortNamesIndex]);
    }
    return "";
  }


  /**
   * Either accepts a single period identifier or an array of them. It does a
   * lookup of the name of the periodIdentifiers. If none can be found, it returns
   * the identifier
   * @param periodIdentifier {string || array} holding the identifiers
   * @param fixedPeriods {object=} Optional parameter holding the periods. If not
   *                               provided, the periods are read from the body data
   * @returns {string || array} the header labels
     */
  function getPeriodIdentifierLabel(periodIdentifier, fixedPeriods) {
    var customData = $("body").data("customDataApp"),
      periods = fixedPeriods || customData.periods,
      returnObject;

    // in case an array is provided, get the header labels for each item
    if (Object.prototype.toString.call(periodIdentifier) === '[object Array]') {
      returnObject = [];
      for (var i=0; i<periodIdentifier.length; i++) {
        returnObject.push( (periods[periodIdentifier[i]] || periodIdentifier[i]) );
      }
      return returnObject;
    }

    return (periods[periodIdentifier] || periodIdentifier);
  }


  /**
   * Gets information about the current period
   * @param periods {object=} Optional parameter holding the periods. If not
   *                          provided, the periods are read from the body data
   * @returns {object} Names for the current period
     */
  function getCurrentPeriod(periods) {

    var periodIdentifier = "CM CY",
      selectedPeriod = $(".jbi_header_period_filter_active").data(),
      selectedPeriodSplit;

    if (selectedPeriod) {
      selectedPeriodSplit = selectedPeriod["filterkey"].toString().split(".");

      return {
        periodIdentifier: periodIdentifier,
        currentPeriod: periodNumberToShortName(selectedPeriodSplit[0]) + " " + selectedPeriodSplit[1],
        periodNumber: selectedPeriodSplit[0],
        periodShortName : periodNumberToShortName(selectedPeriodSplit[0]),
        periodFullName : periodNumberToFullName(selectedPeriodSplit[0]),
        year : selectedPeriodSplit[1]
      };
    } else {

      var periodSplit,
        currentPeriod = getPeriodIdentifierLabel(periodIdentifier, periods);

      // check if a valid name is found
      if (currentPeriod === periodIdentifier) {
        return null;
      }

      // a valid period contains of 2 items in the split period eg [001, 2010]
      periodSplit = currentPeriod.split(" ");
      if (!periodSplit.length || periodSplit.length !== 2) {
        return null;
      }

      // create the period object
      return {
        periodIdentifier: periodIdentifier,
        currentPeriod: currentPeriod,
        periodNumber: periodShortNameToNumber(periodSplit[0]),
        periodShortName : periodSplit[0],
        periodFullName : periodShortNameToFullName(periodSplit[0]),
        year : periodSplit[1]
      };
    }

    // create the period object
    return {
      periodIdentifier: periodIdentifier,
      currentPeriod: periodNumberToShortName(selectedPeriodSplit[0]) + " " + selectedPeriodSplit[1],
      periodNumber: selectedPeriodSplit[0],
      periodShortName : periodNumberToShortName(selectedPeriodSplit[0]),
      periodFullName : periodNumberToFullName(selectedPeriodSplit[0]),
      year : selectedPeriodSplit[1]
    };
  }

  /**
   * Expose the period functions to the application
   */
  my.period_functions = {
    getCurrentPeriod : getCurrentPeriod,
    getPeriodIdentifierLabel: getPeriodIdentifierLabel
  };

  return my;

}(shell.app.execdblp.dashboard));
