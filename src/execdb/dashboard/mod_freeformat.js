shell.app.execdb.dashboard = ( function (my) {

  /**
   * Free Format component
   *
   * This is a generic function that is used to generate the HTML for a table
   *
   * @param containerDiv   the ID of the HTML div element in which the object
   *                       needs to be rendered
   * @param config         the configuration settings for the grid
   * @param dataId         the ID of the data for the object
   * @param businessData   the data for the selected business
   */
  my._createFreeformat = function (containerDiv, config, dataId, businessData) {
    if (config.Code) {
      eval(config.Code);
    }
  };

  return my;
}(shell.app.execdb.dashboard));
