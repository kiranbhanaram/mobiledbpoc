shell.app.execdb.dashboard = ( function (my) {

  /**
   * MENU ITEMS
   * This function is triggered from the Config Handler view component
   **/
  my._buildMenu = function () {

    // get the menu config parameters
    var customData = $("body").data("customConfig"),
      menuItems = customData["MENU_ITEMS"];

    // check if there are menu items defined
    if (!menuItems) {
      return;
    }

    // build the menu and add the event listeners
    buildHTML(menuItems);
    addEventListeners();

    /** HTML **/
    function buildHTML(menuItems) {
      var $customAppFilters = $("body").data("customAppFilters");

      var s = "";
      s += "<nav>";
      s += "    <ul>";
      for (var i = 0; i < menuItems.length; i++) {

        // check if the current displayed hierarchy topnode supports the menu-item
        if (menuItems[i].businesses
          && menuItems[i].businesses.length
          && $customAppFilters
          && $customAppFilters.topNode
          && menuItems[i].businesses.indexOf($customAppFilters.topNode) === -1) {
          continue;
        }

        s += "<li>";
        s += "   <a  data-menuId=\"" + menuItems[i].id + "\">";
        s += "      <i class='fa " + menuItems[i].icon + "'></i>";
        s += "      <span>" + menuItems[i].text + "<\/span>";
        s += "   <\/a>";
        s += "<\/li>";
      }
      s += " <\/ul>";
      s += "<\/nav>";

      $("#jbi_menu").html(s);
    }


    /** EVENT HANDLERS **/
    function addEventListeners() {

      // Menu Click event
      var $menu = $("#jbi_menu a");
      $menu.unbind(my.eventTrigger);
      $menu.on(my.eventTrigger, function (e) {
        e.preventDefault();


        // do nothing if user clicked on an already active menu-id
        if ($(this).hasClass("menuActive")) {
          return;
        }

        $('body').trigger('beforePageRender');

        my._setMenuItem($(this).data("menuid"));
      });

    }


    my._setMenuItem = function (menuId, preventBuildView) {

      // change the classes of the menu item
      $("#jbi_menu a").removeClass("menuActive");
      $("#jbi_menu a[data-menuid=" + menuId + "]").addClass("menuActive");

      // load the business hierarchy
      my._updateBusinessFilter(menuId);

      // set the filters
      var $body = $("body"),
        filterConfig = $body.data("customConfig")["FILTER_ITEMS"],
        menuConfig = $body.data("customConfig")["MENU_ITEMS"],
        filters = [],
        i;

      for (i = 0; i < menuConfig.length; i++) {
        if (menuConfig[i].id === menuId) {
          filters = menuConfig[i].filters;
        }
      }

      // loop over all the filters and check if they need to be shown
      var filterPanelUsed;  // FILTER PANEL NEED TO BE VISIBLE IN ANY CASE BECAUSE OF COMMENT
      filterPanelUsed = true;
      if (filterConfig && filterConfig.length) {
        for (i = 0; i < filterConfig.length; i++) {

          // check if the filter values need to be 're-determined'

          if (filters.indexOf("FILTER_" + filterConfig[i].id) === -1) {
            $("#jbi_filter_" + filterConfig[i].id).hide();
          } else {
            if (filterConfig[i].type === "Type3") {
              filterPanelUsed = true;
            }
            $("#jbi_filter_" + filterConfig[i].id).fadeIn("fast");
          }
        }
      }


      // check if the filterpane needs to be shown
      if (filterPanelUsed) {
        setTimeout(function () {
          $("#jbi_content").css('margin-top', "0");
        }, 50);
      } else {
        var customConfig = $("body").data("customConfig"),
          filterPaneHeight = 40;
        if (customConfig && customConfig.CONFIG && customConfig.CONFIG.filter && customConfig.CONFIG.filter.FilterPaneHeightPixels) {
          filterPaneHeight = customConfig.CONFIG.filter.FilterPaneHeightPixels;
        }
        setTimeout(function () {
          $("#jbi_content").css('margin-top', "-" + ( filterPaneHeight - 8 ) + "px");
        }, 50);
      }


      // load the view
      if (!preventBuildView) {
        my._buildView(menuId);
      }
    }
  };

  return my;


}(shell.app.execdb.dashboard));
