shell.app.execdb.dashboard = (function (my) {
  my._buildView = function (menuId) {
    var $jbi_content = $("#jbi_content");

    // get the selected menuId
    menuId = getSelectedMenuId(menuId);
    if (!menuId) {
      $jbi_content.fadeOut("fast", function () {
        $jbi_content.html("");
        $jbi_content.fadeIn("slow");
      });
      $("body").data("currentView", "");
      return;
    }

    // get the selected business
    var businessId = null;
    var $jbi_businesses = $("#jbi_businesses");
    if ($jbi_businesses.jstree && $jbi_businesses.jstree("get_selected")) {
      businessId = $jbi_businesses.jstree("get_selected")[0];
    }

    if (!businessId) {
      return;
    }

    // get the ID of the view to be loaded
    var viewConfig = getViewConfig(menuId, businessId);
    if (!viewConfig) {
      $jbi_content.fadeOut("fast", function () {
        $jbi_content.html("");
        $jbi_content.fadeIn("slow");
      });
      $("body").data("currentView", "");
      return;
    }

    // check if an update is required
    if (!viewUpdateRequired(viewConfig, businessId)) {
      return;
    }

    // update the view
    my._updateView(viewConfig);
  };

  /**
   * GET SELECTED MENU ID
   **/
  function getSelectedMenuId(menuId) {
    var $menuActive = $(".menuActive");

    if (!menuId) {
      if ($menuActive.length === 1) {
        return $menuActive.data("menuid");
      } else {
        return;
      }
    }
    return menuId;
  }

  /**
   * CHECK IF VIEW REQUIRES UPDATE
   * If the ID of the view has not changed, no update is
   * required.
   **/
  function viewUpdateRequired(cfg, businessId) {
    var updateRequired = false,
      $body = $("body");

    if ($body.data("currentBusiness") !== businessId) {
      updateRequired = true;
      $body.data("currentBusiness", businessId);
    }

    // only proceed if the view has changed
    if ($body.data("currentView") !== JSON.stringify(cfg)) {
      updateRequired = true;
      $body.data("currentView", JSON.stringify(cfg));
    }

    return updateRequired;
  }

  /**
   * RETRIEVE VIEW ID
   * The configuration id for the view depends on the selected menu-item
   * and could be based on selected filter items as well. Function below
   * is to get the right view configuration id
   **/
  function getViewConfig(menuId, businessId) {
    var customData = $("body").data("customConfig"),
      viewsConfig = customData["VIEWS"];

    if (!viewsConfig) {
      return null;
    }

    // extract the relevant filters for the current menu
    var filters = my._getValidMenuFilters(menuId);

    // if no filters are provided, get retrieve the view config ID for the
    // option with the menuId only
    var viewConfig;

    if (filters.length > 0) {
      // check per views config for the current menuId which
      // one fits best (meaning, has the most correct filters)
      //viewConfig = getConfigIdBasedOnFilters(menuId, filters, viewsConfig);
      viewConfig = my._getViewConfigIdBasedOnFilters(
        menuId,
        filters,
        viewsConfig
      ).config;
    }

    // if none of the filter matches a specific viewConfig, pick the default
    // viewConfig assigned to the menu;
    if (!viewConfig) {
      for (var i = 0; i < viewsConfig.length; i++) {
        if (viewsConfig[i].menuId === menuId) {
          var allAllowed = true;
          for (var y = 0; y < viewsConfig[i].filterItems.length; y++) {
            if (viewsConfig[i].filterItems[y].filterValue !== "*") {
              allAllowed = false;
              break;
            }
          }
          if (allAllowed) {
            viewConfig = viewsConfig[i];
            break;
          }
        }
      }
    }

    return viewConfig;
  }

  //function getConfigIdBasedOnFilters(menuId, filters, viewsConfig, businessId) {
  //}

  /**
   * SET THE VIEW
   * By setting the view, the configuration of a specific view is set via code. This means
   * that the appropriate menu items are selected, the correct filters are shown and
   * eventually the view is updated.
   * @param cfg
   */
  my._setView = function (cfg, businessId) {
    // update the menu item
    my._setMenuItem(cfg.menuId);

    // update the relevant filters
    var validFilters = [],
      i,
      y,
      z,
      customConfig = $("body").data("customConfig"),
      menuItems = customConfig["MENU_ITEMS"],
      filterItems = customConfig["FILTER_ITEMS"];

    // update the current view
    viewUpdateRequired(cfg, businessId);

    for (i = 0; i < menuItems.length; i++) {
      if (menuItems[i].id === cfg.menuId) {
        for (y = 0; y < menuItems[i].filters.length; y++) {
          var filterValue = null;
          for (z = 0; z < cfg.filterItems.length; z++) {
            if (cfg.filterItems[z].filterId === menuItems[i].filters[y]) {
              filterValue = cfg.filterItems[z].filterValue;
              break;
            }
          }
          var filterType = null;
          for (z = 0; z < filterItems.length; z++) {
            if ("FILTER_" + filterItems[z].id === menuItems[i].filters[y]) {
              filterType = filterItems[z].type;
              break;
            }
          }

          validFilters.push({
            id: menuItems[i].filters[y].substring(7),
            value: filterValue,
            type: filterType
          });
        }
        break;
      }
    }
    my._setSelectedFilterValues(validFilters, true);

    // update the view
    my._updateView(cfg);
  };

  /**
   * UPDATE THE VIEW
   * Remove the current view and build the new view
   **/
  my._updateView = function (cfg) {
    // get the configuration of the view
    var viewConfig = $("body").data("customConfig")[cfg.viewId],
      $jbi_content = $("#jbi_content");

    // get the comment
    my._addViewCommentary();

    // remove the current view
    $jbi_content.fadeOut("fast", function () {
      $jbi_content.html("");

      if (viewConfig && viewConfig.view) {
        // create the new layout
        my._createViewLayout(viewConfig.view);

        // create the containers
        my._buildContainers(viewConfig.containers, cfg.containerData);
      }

      if ($jbi_content.html() !== "") {
        $jbi_content.fadeIn("slow", function () {
          // fade in the menu icon bar (only relevant for startup)
          $("#jbi_filter_icons").fadeIn("slow", function () {
            // add scrolling capabilities (mobile only)
            // if ( my.isMobile ) {
            //   var myScroll = new IScroll('#jbi_content', {mouseWheel: true});
            // }
          });
        });
      }
    });
  };

  my._getViewConfigIdBasedOnFilters = function (
    menuId,
    filters,
    viewsConfig,
    businessId
  ) {
    // check per views config if there is one that meets all conditions
    var menuAndFilterViews = [];
    for (var i = 0; i < viewsConfig.length; i++) {
      var validView = true;

      // at least the menuId must be right
      if (
        viewsConfig[i].menuId !== menuId ||
        viewsConfig[i].filterItems.length === 0
      ) {
        continue;
      }

      // then all the valid filters for the menuId must be right
      for (var y = 0; y < filters.length; y++) {
        var filterPassed = false;

        // if no selection is made, no filters can be met
        if (filters[y].selectedValues.length === 0) {
          break;
        }

        // check for each filtervalue in the views if that is correct
        for (
          var idxViewsFilter = 0; idxViewsFilter < viewsConfig[i].filterItems.length; idxViewsFilter++
        ) {
          if (
            viewsConfig[i].filterItems[idxViewsFilter].filterId ===
            filters[y].filter
          ) {
            // check if the value is correct
            if (
              viewsConfig[i].filterItems[idxViewsFilter].filterValue === "*"
            ) {
              filterPassed = true;
              break;
            }

            if (
              viewsConfig[i].filterItems[idxViewsFilter].filterValue.substring(
                0,
                1
              ) === "!" &&
              viewsConfig[i].filterItems[idxViewsFilter].filterValue.substring(
                1
              ) !== filters[y].selectedValues[0]
            ) {
              filterPassed = true;
              break;
            }

            if (
              viewsConfig[i].filterItems[idxViewsFilter].filterValue ===
              filters[y].selectedValues[0]
            ) {
              filterPassed = true;
              break;
            }
          }
        }

        // if the filter did not pass, proceed to the next viewConfig
        if (!filterPassed) {
          validView = false;
          break;
        }
      }

      if (validView) {
        menuAndFilterViews.push({
          id: i,
          config: viewsConfig[i]
        });
      }
    }

    // check if there is a specific view for the selected business
    // if only one report is valid, don't look further
    var currentBusiness;
    if (businessId) {
      currentBusiness = businessId;
    } else {
      var $jbiBusinesses = $("#jbi_businesses");
      if (
        $jbiBusinesses.jstree()._cnt === 0 ||
        !$jbiBusinesses.jstree().get_selected(true).length
      ) {
        return null;
      }
      currentBusiness = $jbiBusinesses.jstree().get_selected(true)[0].id;
    }

    var bestView = null;
    if (menuAndFilterViews.length === 1) {
      bestView = menuAndFilterViews[0];
    } else {
      // check for a specific report
      var hasSpecificReport = false;
      for (i = 0; i < menuAndFilterViews.length; i++) {
        var businesses = menuAndFilterViews[i].config.businessId.split(";");
        if (businesses.indexOf(currentBusiness) > -1) {
          hasSpecificReport = true;
          bestView = menuAndFilterViews[i];
          break;
        }
      }

      // get the 'general' report
      if (!hasSpecificReport) {
        for (i = 0; i < menuAndFilterViews.length; i++) {
          if (menuAndFilterViews[i].config.businessId === "*") {
            bestView = menuAndFilterViews[i];
            break;
          }
        }
      }
    }

    return bestView;
  };

  my._navToView = function (menuItemId, filters, businessId) {
    var customConfig = $("body").data("customConfig");

    if (hasValidMenuItemId(menuItemId)) {
      my._setMenuItem(menuItemId);
    } else {
      my._setMenuItem(customConfig.MENU_ITEMS[0].id);
    }

    if (businessId !== undefined && businessId !== null) {
      setInitialBusiness(businessId);
    }

    if (filters === undefined || filters === null || !filters.length) {
      return;
    }

    if (!customConfig ||
      !customConfig.FILTER_ITEMS ||
      !customConfig.FILTER_ITEMS.length
    ) {
      return;
    }

    var filterDefinitions = customConfig.FILTER_ITEMS;
    var activeFilters = filters
      .filter(isValidFilter(filterDefinitions))
      .map(addTypeToFilter(filterDefinitions));

    my._setSelectedFilterValues(activeFilters, false);

    function hasValidMenuItemId(menuItemId) {
      if (menuItemId === undefined || menuItemId === null) {
        return false;
      }

      var customConfig = $("body").data("customConfig");

      if (
        customConfig &&
        customConfig.MENU_ITEMS &&
        customConfig.MENU_ITEMS.length
      ) {
        return customConfig.MENU_ITEMS.some(function (menuItem) {
          return menuItem.id === menuItemId;
        });
      }

      return false;
    }

    function isValidFilter(filterDefinitions) {
      return function (filter) {
        return filterDefinitions.some(function (filterDefinition) {
          if (filterDefinition.id !== filter.id) {
            return false;
          }

          return filterDefinition.filterValues.some(function (filterValue) {
            return filterValue.key === filter.value;
          });
        });
      };
    }

    function addTypeToFilter(filterDefinitions) {
      return function (filter) {
        var type = filterDefinitions.filter(function (filterDefinition) {
          return filterDefinition.id === filter.id;
        })[0].type;

        return jQuery.extend({}, filter, {
          type: type
        });
      };
    }

    function setInitialBusiness(businessId) {
      var $body = $("body");
      var $businessTree = $("#jbi_businesses").jstree();
      var datasets = ($body.data("customDataApp") && $body.data("customDataApp").datasets) || {};
      var currentNode = datasets[businessId];
      var parentNodes = [];

      while (currentNode !== undefined) {
        var parentNode = currentNode.parentNode;

        if (parentNode) {
          parentNodes.unshift($businessTree.get_node(parentNode));
        }

        currentNode = datasets[parentNode];
      }

      parentNodes.forEach(function (node) {
        $businessTree.open_node(node);
      });

      $("#" + businessId + "_anchor").trigger("click");
    }
  };

  my._navToInitialView = function () {
    var $body = $("body");
    var uri = window.location.search;
    var bodyData = $body.data();
    var initialView = bodyData.initialView || {
      menuItemId: null,
      filters: [],
      businessId: null
    };

    if (uri) {
      var uriParams = uri
        .substr(1)
        .split("&")
        .map(function (uriParam) {
          return uriParam.split("=");
        });

      var hasValidUriParams = uriParams.some(function (uriParam) {
        return (
          uriParam[0] === "menuItemId" ||
          uriParam[0].substr(6) === "filter" ||
          uriParam[0] === "businessId"
        );
      });

      if (hasValidUriParams) {
        uriParams.forEach(function (uriParam) {
          var name = uriParam[0];
          var value = uriParam[1];

          if (name === "menuItemId") {
            initialView.menuItemId = value;
          } else if (name.indexOf("filter") !== -1) {
            initialView.filters.push({
              id: name.substr(6),
              value: value
            });
          } else if (name === "businessId") {
            initialView.businessId = value;
          }
        });

        $body.data("initialView", initialView);

        initialView = $body.data("initialView");
      }
    }

    my._navToView(
      initialView.menuItemId,
      initialView.filters.length ? initialView.filters : null,
      initialView.businessId
    );
  };

  return my;
})(shell.app.execdb.dashboard);