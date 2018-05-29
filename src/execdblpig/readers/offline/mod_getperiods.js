shell.app.execdblp.offlinereader = ( function (my) {

  my.getPeriodName = function(period) {
    var periodArray = period.split("."),
      year = periodArray[1],
      periodNum = periodArray[0],
      periodName = "";

    switch (parseInt(periodNum)) {
      case 1:
        periodName = "January";
        break;
      case 2:
        periodName = "February";
        break;
      case 3:
        periodName = "March";
        break;
      case 4:
        periodName = "April";
        break;
      case 5:
        periodName = "May";
        break;
      case 6:
        periodName = "June";
        break;
      case 7:
        periodName = "July";
        break;
      case 8:
        periodName = "August";
        break;
      case 9:
        periodName = "September";
        break;
      case 10:
        periodName = "October";
        break;
      case 11:
        periodName = "November";
        break;
      case 12:
        periodName = "December";
        break;
    }
    return  year + " - " + periodName;
  };

  return my;
}(shell.app.execdblp.offlinereader || {}));
