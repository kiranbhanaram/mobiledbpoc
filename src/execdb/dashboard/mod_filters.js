shell.app.execdb.dashboard = ( function (my) {


  my._setSelectedFilterValues = function (filters, simulate) {
    for (var i = 0; i < filters.length; i++) {
      var $filterItem = $("[data-filterid = " + filters[i].id + " ][data-filterkey = '" + filters[i].value + "']")[0];

      if (simulate) {
        $($filterItem).addClass("simulation");    // used for PDF printing
      }

      if (filters[i].type === "TopPane") {
        $($filterItem).trigger(my.eventTrigger);
        $($filterItem).trigger(my.eventTrigger);
      } else {
        $($filterItem).trigger(my.eventTrigger);
      }

    }
  };


  /**
   * APPLICATION FILTERS
   * This function is triggered from the config Handler and adds all the
   * filters. By default all filters are hidden
   **/
  my._buildFilters = function () {

    // get the config parameters
    var customData = $("body").data("customConfig"),
      filterItems = customData.FILTER_ITEMS,
      dashboardConfig = customData.CONFIG;

    // build the filters and set the event handlers
    createHTML(filterItems, dashboardConfig.dashboard.Layout);
    addEventListeners();
    updateSelectedFilters();


    /**
     * EVENT HANDLERS
     * Event listeners for the filter items
     **/
    function addEventListeners() {

      // Menu Item Click
      var $filterValue = $(".filterValue");

      $filterValue.unbind(my.eventTrigger);
      $filterValue.on(my.eventTrigger, function (evt) {
        evt.preventDefault();

        if ($(this).hasClass("filterDisabled")) {
          evt.stopPropagation();
          return;
        }

        var preventViewBuild = false;
        if ($(this).hasClass("simulation")) {
          preventViewBuild = true;
          $(this).removeClass("simulation")
        }

        // get the parameters of the clicked items
        var selectedFilterId = $(this).data("filterid"),
          selectedFilterKey = $(this).data("filterkey"),
          selectedFilterText = $(this).data("filtertext"),
          customData = $("body").data("customConfig"),
          filterItems = customData.FILTER_ITEMS,
          i,
          cfg = null;

        // get the configuration for the filter item
        for (i = 0; i < filterItems.length; i++) {
          if (filterItems[i].id == selectedFilterId) {
            cfg = filterItems[i];
            break;
          }
        }
        if (cfg === null) {
          return;
        }


        // check if the selected item is already selected
        if ($(this).hasClass("filterActive")) {
          return;
        } else {
          $("#jbi_filter_" + selectedFilterId + " .filterValue").removeClass("filterActive");
          $(this).addClass("filterActive");
        }


        // get the selection text
        if (cfg.type === "TopPane") {
          $("#jbi_filter_" + selectedFilterId + " > span").html(selectedFilterText + "<svg style='position:absolute;right:3px;top:9px;' class='filter_click_down_icon' width='12px' height='12px' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'><path d='M1408 704q0 26-19 45l-448 448q-19 19-45 19t-45-19l-448-448q-19-19-19-45t19-45 45-19h896q26 0 45 19t19 45z'/></svg>");
        }


        // check if the filter items need to be made visible
        displayFilterValuesParent(cfg, selectedFilterKey);

        // check if the changed filter was assigned to a filter group
        if (cfg.filterGroup) {

          // loop over each filter and change the selected value
          for (i = 0; i < filterItems.length; i++) {

            if (filterItems[i].filterGroup &&
              filterItems[i].id != selectedFilterId &&
              filterItems[i].filterGroup === cfg.filterGroup) {

              // remove the active filter
              $("#jbi_filter_" + filterItems[i].id + " .filterActive").removeClass("filterActive");

              // find the new filter
              var newActiveFilterFound = false,
                nothingFound = false,
                currentFilterValue = selectedFilterKey;
              while (!newActiveFilterFound && !nothingFound) {

                if ($(".filterValue[data-filterid='" + filterItems[i].id + "'][data-filterkey='" + currentFilterValue + "']").length > 0) {
                  $(".filterValue[data-filterid='" + filterItems[i].id + "'][data-filterkey='" + currentFilterValue + "']").addClass("filterActive");
                  newActiveFilterFound = true;
                  break;
                }

                // get the parent for the currentFilterValue
                nothingFound = true;
                for (var y = 0; y < cfg.filterValues.length; y++) {
                  if (cfg.filterValues[y].key === currentFilterValue && cfg.filterValues[y].parent) {
                    currentFilterValue = cfg.filterValues[y].parent;
                    nothingFound = false;
                    break;
                  }
                }

                // change the selection to the default selection if nothing was found
                if (nothingFound) {
                  for (var y = 0; y < filterItems[i].filterValues.length; y++) {
                    if (filterItems[i].filterValues[y].selected) {
                      currentFilterValue = filterItems[i].filterValues[y].key;
                      nothingFound = false;
                      break;
                    }
                  }
                }
              }

              if (newActiveFilterFound) {
                displayFilterValuesParent(filterItems[i], currentFilterValue);
              }

            }
          }
        }

        $('body').trigger('beforePageRender');

        // get the selected filters
        updateSelectedFilters(preventViewBuild);
      });
    }


    function displayFilterValuesParent(cfg, selectedFilterKey) {

      var i;

      if (cfg.filterValues
        && cfg.filterValues.length
        && cfg.filterValues.length > 0) {

        // fill an array with items that should be displayed
        var displayItems = [];

        // add the selected item
        displayItems.push(selectedFilterKey);

        // add the parents of the selected item
        var selectedItemObject;
        for (i = 0; i < cfg.filterValues.length; i++) {
          if (cfg.filterValues[i].key === selectedFilterKey) {
            selectedItemObject = cfg.filterValues[i];
            break;
          }
        }
        if (selectedItemObject.parent) {
          displayItems.push(selectedItemObject.parent);

          // loop over the parents until all parents are found (limit to max 6 levels)
          var parentItemKey = selectedItemObject.parent,
            safetyLimit = 0,
            allParentsFound = false;

          while (!allParentsFound && safetyLimit < 6) {

            for (i = 0; i < cfg.filterValues.length; i++) {
              if (cfg.filterValues[i].key === parentItemKey) {
                if (cfg.filterValues[i].parent) {
                  displayItems.push(cfg.filterValues[i].parent);
                  parentItemKey = cfg.filterValues[i].parent;

                  // add the siblings of the parent
                  for (var y = 0; y < cfg.filterValues.length; y++) {
                    if (cfg.filterValues[y].parent === parentItemKey) {
                      displayItems.push(cfg.filterValues[y].key);
                    }
                  }

                } else {
                  allParentsFound = true;
                }
                break;
              }
            }
            safetyLimit++;
          }
        }

        // add all the siblings
        for (i = 0; i < cfg.filterValues.length; i++) {
          if ((cfg.filterValues[i].parent && cfg.filterValues[i].parent === selectedItemObject.parent ) || ( !selectedItemObject.parent && !cfg.filterValues[i].parent )) {
            displayItems.push(cfg.filterValues[i].key);
          }
        }


        // add all the children
        for (i = 0; i < cfg.filterValues.length; i++) {
          if (cfg.filterValues[i].parent && cfg.filterValues[i].parent === selectedItemObject.key) {
            displayItems.push(cfg.filterValues[i].key);
          }

        }

        // check for each filter item whether it should be shown or not
        for (i = 0; i < cfg.filterValues.length; i++) {
          if (displayItems.indexOf(cfg.filterValues[i].key) > -1) {
            $(".filterValue[data-filterid=\"" + cfg.id + "\"][data-filterkey=\"" + cfg.filterValues[i].key + "\"]").removeClass("filterHidden");
          } else {
            $(".filterValue[data-filterid=\"" + cfg.id + "\"][data-filterkey=\"" + cfg.filterValues[i].key + "\"]").addClass("filterHidden");
          }
        }

      }
    }


    function updateSelectedFilters(preventViewBuild) {

      var $body = $("body"),
        filters = [],
        filterItems = $body.data("customConfig").FILTER_ITEMS;

      // get all the filters
      if (filterItems && filterItems.length) {
        for (var i = 0; i < filterItems.length; i++) {
          var filterObj = {
            filter: "FILTER_" + filterItems[i].id,
            selectedValues: []
          };
          var selectedFilters = $("#jbi_filter_" + filterItems[i].id + " .filterActive");
          for (var y = 0; y < selectedFilters.length; y++) {
            filterObj.selectedValues.push($(selectedFilters[y]).data("filterkey"));
          }
          filters.push(filterObj);
        }
      }

      // update the filters
      $body.data("filters", filters);

      if (!preventViewBuild) {
        my._buildView();
      }
    }


    function createHTML(cfg, layout) {
      getTopPaneFilters(cfg);
      getIconFilters(cfg);
    }


    // Handlers for filter toppane
    $('#jbi_filter_toppane .click-nav > ul').toggleClass('no-js js');
    $('#jbi_filter_toppane .click-nav .js ul').hide();

    $('#jbi_filter_toppane .click-nav .js > li').unbind(my.eventTrigger);
    $('#jbi_filter_toppane .click-nav .js > li').on(my.eventTrigger, function (e) {
      e.preventDefault();

      var currentId = $(this)[0].id;
      $('#' + currentId + ' ul').toggle();
      $('#' + currentId + '.clicker').toggleClass('active');
      e.stopPropagation();
    });


    //function getLeftPaneFilters(cfg) {
    //
    //  var s = "";
    //  s += "<div id='jbi_filter_items' class='filterContainer'>";
    //  s += "<ul class='filterList'>";
    //
    //
    //  if (cfg && cfg.length) {
    //    for (var i = 0; i < cfg.length; i++) {
    //
    //      // only valid for left pane filters
    //      if (cfg[i].type !== "LeftPane") {
    //        continue;
    //      }
    //
    //
    //      // get the default selection
    //      var defaultDisplay = cfg[i].textNoSelection;
    //      if (cfg[i].filterValues && cfg[i].filterValues && cfg[i].filterValues.length > 0) {
    //
    //        // check if a value is selected
    //        var selectionFound = false;
    //        for (y = 0; y < cfg[i].filterValues.length; y++) {
    //          if (selectionFound === true) {
    //            cfg[i].filterValues[y].selected = false;
    //          }
    //          if (cfg[i].filterValues[y].selected) {
    //            defaultDisplay = cfg[i].filterValues[y].text;
    //            selectionFound = true;
    //          }
    //        }
    //        if (!selectionFound) {
    //          // get the first enabled filter
    //          for (y = 0; y < cfg[i].filterValues.length; y++) {
    //            if (cfg[i].filterValues[y].enabled) {
    //              defaultDisplay = cfg[i].filterValues[y].text;
    //              cfg[i].filterValues[y].selected = true;
    //              break;
    //            }
    //          }
    //        }
    //      }
    //
    //
    //      // build the HTML
    //      s += "<li id='jbi_filter_" + cfg[i].id + "' class='filterListItemFixed noselect' style='display:none;'>";
    //
    //      if (cfg[i].filterValues && cfg[i].filterValues.length) {
    //        var selectedItemKey = "";
    //
    //        s += "<ul class='filterValueListFixed'>";
    //
    //        // filter items
    //        for (var y = 0; y < cfg[i].filterValues.length; y++) {
    //
    //          var classSelected = "";
    //          if (cfg[i].filterValues[y].selected) {
    //            classSelected = " filterActive";
    //            selectedItemKey = cfg[i].filterValues[y].key;
    //          }
    //
    //          var classDisabled = "";
    //          if (!cfg[i].filterValues[y].enabled) {
    //            classDisabled = " filterDisabled";
    //          }
    //
    //          // skip the values that do not have a selected parent
    //          var classHidden = "";
    //          if (cfg[i].filterValues[y].parent && cfg[i].filterValues[y].parent !== selectedItemKey) {
    //            classHidden = " filterHidden";
    //          }
    //
    //          // check if the item has children
    //          var htmlChildren = "";
    //          for (var z = 0; z < cfg[i].filterValues.length; z++) {
    //            if (cfg[i].filterValues[z].parent && cfg[i].filterValues[z].parent === cfg[i].filterValues[y].key) {
    //              htmlChildren = " <i class=\"fa fa-caret-down\"></i>";
    //              break;
    //            }
    //          }
    //
    //          s += "<li data-filterid='" + cfg[i].id + "' data-filterkey='" + cfg[i].filterValues[y].key + "' data-filtertext='" + cfg[i].filterValues[y].text + "' class='filterValue filterValueListItemFixed" + classSelected + classDisabled + classHidden + "'>";
    //          s += "   <span class='filterValueListItemNameFixed' title='" + cfg[i].filterValues[y].text + "'>" + cfg[i].filterValues[y].text + htmlChildren + "</span>";
    //          s += "</li>";
    //        }
    //
    //        s += "</ul>";
    //      }
    //      s += "</li>";
    //    }
    //  }
    //
    //  s += "</ul>";
    //  s += "</div>";
    //
    //  // set the HMTL
    //  $("#jbi_filter_leftpane").html(s);
    //  $('#jbi_filter_100').jstree();
    //}


    function getTopPaneFilters(cfg) {

      var s = "";
      if (cfg && cfg.length) {
        for (var i = 0; i < cfg.length; i++) {
          if (cfg[i].type !== "TopPane") {
            continue;
          }

          if (cfg[i].filterValues && cfg[i].filterValues.length) {

            // check which item should be selected
            var selectedItemText = "";
            for (y = 0; y < cfg[i].filterValues.length; y++) {
              if (cfg[i].filterValues[y].selected) {
                selectedItemText = cfg[i].filterValues[y].text;
                break;
              }
            }

            // create the HTML part
//@formatter:off
                        s += "<div class='click-nav'>";
                          s += "<ul class='no-js'>";
                            s += "<li id='jbi_filter_" + cfg[i].id + "' class='noselect' style='display:none;width:" + cfg[i].width + "px;'>";
                              s += "<span class='clicker'>" + selectedItemText;
                                s += "<svg style='position:absolute;right:3px;top:9px;' class='filter_click_down_icon' width='12px' height='12px' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'><path d='M1408 704q0 26-19 45l-448 448q-19 19-45 19t-45-19l-448-448q-19-19-19-45t19-45 45-19h896q26 0 45 19t19 45z'/></svg>"
                              s += "</span>";
                              s += "<ul>";
//@formatter:on

            // add the items
            for (var y = 0; y < cfg[i].filterValues.length; y++) {

              var classSelected = "";
              if (cfg[i].filterValues[y].selected) {
                classSelected = " filterActive";
              }

              var classDisabled = "";
              if (!cfg[i].filterValues[y].enabled) {
                classDisabled = " filterDisabled";
              }

//@formatter:off
                            s += "<li data-filterid='" + cfg[i].id + "' data-filterkey='" + cfg[i].filterValues[y].key + "' data-filtertext='" + cfg[i].filterValues[y].text + "' class='filterValue " + classSelected + classDisabled + "' style='width:" + cfg[i].width + "px;'>";
                              s += "<span title='" + cfg[i].filterValues[y].text + "'>" + cfg[i].filterValues[y].text + "</span>";
                            s += "</li>";
//@formatter:on
            }

            // add the remaining HTML part
//@formatter:off
                              s += "</ul>";
                            s += "</li>";
                          s += "</ul>";
                        s += "</div>";
//@formatter:on
          }
        }
      }
      $("#jbi_filter_toppane").html(s);

    }


    function getIconFilters(cfg) {
      var s = "";
      if (cfg && cfg.length) {
        for (var i = 0; i < cfg.length; i++) {
          if (cfg[i].type !== "IconFilter") {
            continue;
          }

          if (cfg[i].filterValues && cfg[i].filterValues.length) {
            s += "<ul id='jbi_filter_" + cfg[i].id + "' class='noselect' style='display:none;'>";
            for (y = 0; y < cfg[i].filterValues.length; y++) {

              // check if the active class need to be set
              var classSelected = "";
              if (cfg[i].filterValues[y].selected) {
                classSelected = " filterActive";
              }
//@formatter:off
                s += "<li data-filterid='" + cfg[i].id + "' data-filterkey='" + cfg[i].filterValues[y].key + "' data-filtertext='" + cfg[i].filterValues[y].text + "' class='filterValue " + classSelected + "'>";
                  s += "<span>" + cfg[i].filterValues[y].icon + "</span>";
                s += "</li>";
              }
//@formatter:on
            s += "</ul>";
          }
        }
      }
      $("#jbi_filter_iconsitems").html(s);

    }

  };


  /**
   * GET FILTERS
   * Not all the filters apply to the selected menu-item. This function
   * retrieves all valid filters and its selected values
   **/
  my._getValidMenuFilters = function (menuId) {
    var menuConfig = $("body").data("customConfig")["MENU_ITEMS"],
      allFilters = $("body").data("filters"),
      filters = [];

    for (var i = 0; i < menuConfig.length; i++) {
      if (menuConfig[i].id === menuId) {
        for (var y = 0; y < menuConfig[i].filters.length; y++) {

          for (var z = 0; z < allFilters.length; z++) {
            if (allFilters[z].filter === menuConfig[i].filters[y]) {
              var obj = {
                filter: allFilters[z].filter,
                selectedValues: allFilters[z].selectedValues
              };
              filters.push(obj);
              break;
            }
          }
        }
        break;
      }
    }
    return filters;
  };


  return my;


}(shell.app.execdb.dashboard));
