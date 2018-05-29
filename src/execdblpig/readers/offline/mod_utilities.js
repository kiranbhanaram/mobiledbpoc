shell.app.execdblp.offlinereader = ( function (my) {

  // check for mobile thingies
  my.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  my.eventTrigger = (my.isMobile) ? "touchstart" : "click";
  my.hasCordova = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;



  my.downloadText = function(fileName, fileContents) {

    // only proceed if there is data
    if (fileContents === "") {
      alert("Nothing to download...");
      return;
    }

    // create the blob (file contents)
    var blob = new Blob([fileContents], {type: 'text/json'}),
      e = document.createEvent('MouseEvents'),
      a = document.createElement('a');

    // simulate a click;
    a.download = fileName;
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    a.dispatchEvent(e)
  };


  return my;


}(shell.app.execdblp.offlinereader));
