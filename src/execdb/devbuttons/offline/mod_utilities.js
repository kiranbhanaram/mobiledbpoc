shell.app.execdb.developerbuttons_offline = ( function (my) {
  
  // check for mobile thingies
  my.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  my.eventTrigger = (my.isMobile) ? "touchstart" : "click";

  return my;

}(shell.app.execdb.developerbuttons_offline));
