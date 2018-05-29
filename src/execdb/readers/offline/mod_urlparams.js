shell.app.execdb.offlinereader = ( function (my) {

  /**
   * Helper function for retrieving the URL parameters
   * @param {Array} params Holding the URL parameter names to be retrieved
   * @returns {object} the URL parameters as properties of an object
   */
  my._getURLParams = function (params) {
    var pars = {};
    for (var i = 0; i < params.length; i++) {
      pars[params[i]] = getUrlParameter(params[i]);
    }
    return pars;

    function getUrlParameter(sParam) {
      var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;
      for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] === sParam) {
          return sParameterName[1] === undefined ? true : sParameterName[1];
        }
      }
    }
  };

  return my;
}(shell.app.execdb.offlinereader || {}));
