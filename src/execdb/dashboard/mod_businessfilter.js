shell.app.execdb.dashboard = ( function (my) {

  my._updateBusinessFilter = function (menuId) {

    var currentMenu,
      $body = $("body"),
      customConfig = $body.data("customConfig"),
      customData = $body.data("customDataApp"),
      datasets = customData.datasets,
      menuItems = customConfig["MENU_ITEMS"],
      $businessTree = $('#jbi_businesses'),
      property,
      i,
      nodesToHide,
      newSelection,
      allNodes;

    for (i = 0; i < menuItems.length; i++) {
      if (menuItems[i].id === menuId) {
        currentMenu = menuItems[i];
        break;
      }
    }

    // check if there are children from a certain node that need to be hidden
    nodesToHide = [];
    if (currentMenu && currentMenu.businessChildrenToHide && currentMenu.businessChildrenToHide.length) {
      for (property in datasets) {
        if (datasets.hasOwnProperty(property) && currentMenu.businessChildrenToHide.indexOf(datasets[property].parentNode) > -1) {
          nodesToHide.push(property);
        }
      }
    }

    if (!currentMenu || !currentMenu.businesses || !currentMenu.businesses.length) {
      allNodes = $businessTree.jstree(true).get_json('#', {flat:true});
      for (i=0; i<allNodes.length; i++) {
        if (nodesToHide.indexOf(allNodes[i].id) > -1) {
          $businessTree.jstree(true).hide_node(allNodes[i].id);
        } else {
          $businessTree.jstree(true).show_node(allNodes[i].id);
        }
      }

      //if ($businessTree.jstree(true)._cnt > 0) {
      //  $businessTree.jstree(true).show_all();
      //  setTimeout(function () {
      //    $businessTree.jstree(true).hide_node(nodesToHide);
      //  }, 200);
      //
      //}
    } else if (currentMenu.businesses[0] === "NO_BUSINESS") {

    } else {
      var selectedNode = $businessTree.jstree(true).get_selected('full', true);
      if (currentMenu.businesses.length == 1 && currentMenu.businesses[0].toUpperCase() === 'SECTOR') {
        for (property in datasets) {
          if (datasets.hasOwnProperty(property) && property.substring(0, 3) !== "SE-") {
            nodesToHide.push(property);
          }
        }

        // check if the selected node will be hidden
        if (selectedNode && selectedNode.length && selectedNode[0].id.substring(0, 3) !== "SE-") {
          for (i = 0; i < selectedNode[0].parents.length; i++) {
            if (selectedNode[0].parents[i].substring(0, 3) === "SE-") {
              newSelection = selectedNode[0].parents[i];
              break;
            }
          }
          if (newSelection) {
            $businessTree.jstree(true).deselect_all();
            $businessTree.jstree(true).select_node(newSelection);
          }
        }
      } else {
        for (property in datasets) {
          if (datasets.hasOwnProperty(property) && currentMenu.businesses.indexOf(property) === -1) {
            nodesToHide.push(property);
          }
        }

        // check if the selected node will be hidden
        if (selectedNode && selectedNode.length) {
          if (nodesToHide.indexOf(selectedNode[0].id) > -1) {
            for (i = 0; i < selectedNode[0].parents.length; i++) {
              if (nodesToHide.indexOf(selectedNode[0].parents[i]) === -1) {
                newSelection = selectedNode[0].parents[i];
                break;
              }
            }
          }
          if (newSelection) {
            $businessTree.jstree(true).deselect_all();
            $businessTree.jstree(true).select_node(newSelection);
          }
        }
      }

      // get all the nodes
      allNodes = $businessTree.jstree(true).get_json('#', {flat:true});
      for (i=0; i<allNodes.length; i++) {
        if (nodesToHide.indexOf(allNodes[i].id) > -1) {
          $businessTree.jstree(true).hide_node(allNodes[i].id);
        } else {
          $businessTree.jstree(true).show_node(allNodes[i].id);
        }
      }

      // hide the nodes which should not be shown
      //$businessTree.jstree(true).show_all();
      //setTimeout(function () {
      //  $businessTree.jstree(true).hide_node(nodesToHide);
      //}, 200);

    }
  };


  my._buildBusinessFilter = function () {
    addCSS();
    buildTree();


    function addCSS() {

      var customConfig = $("body").data("customConfig"),
        filterConfig = (customConfig && customConfig["CONFIG"]) ? customConfig["CONFIG"]["filter"] : {},
        selectedBackground = (filterConfig && filterConfig["FilterLeftPaneItemSelectedBackgroundColor"])
          ? filterConfig["FilterLeftPaneItemSelectedBackgroundColor"]
          : "#fbce07",
        selectedFontColor = (filterConfig && filterConfig["FilterLeftPaneItemSelectedFontColor"])
          ? filterConfig["FilterLeftPaneItemSelectedFontColor"]
          : "white",
        unselectedBackground = (filterConfig && filterConfig["FilterLeftPaneItemBackgroundColor"])
          ? filterConfig["FilterLeftPaneItemBackgroundColor"]
          : "#fbce07",
        unselectedFontColor = (filterConfig && filterConfig["FilterLeftPaneItemFontColor"])
          ? filterConfig["FilterLeftPaneItemFontColor"]
          : "white",
        hoverBackground = (filterConfig && filterConfig["FilterLeftPaneItemHoverBackgroundColor"])
          ? filterConfig["FilterLeftPaneItemHoverBackgroundColor"]
          : selectedBackground,
        hoverFontColor = (filterConfig && filterConfig["FilterLeftPaneItemHoverFontColor"])
          ? filterConfig["FilterLeftPaneItemHoverFontColor"]
          : selectedFontColor;
      


//@formatter:off
      var s = "";
      s += "<style type='text/css' id='CSS_JSTREE_CUSTOM' data-repstyle='execdb'>";
        s += ".jstree-default .jstree-wholerow-clicked{";
          s += " background: " + selectedBackground + " !important;";
        s += "}";
        s += ".jstree-default .jstree-wholerow {";
          s += " line-height: 40px !important;";
          s += " background: " + unselectedBackground + ";";
          s += " color: " + unselectedFontColor + ";";
        s += "}";
        s += ".jstree-anchor.jstree-clicked {";
          s += " color: " + selectedFontColor + " !important;";
        s += "}";
      s += "</style>";
//@formatter:on
      $(s).appendTo("head");
    }

    function buildTree() {
      var $body = $("body"),
        $customDataApp = $body.data("customDataApp"),
        hierarchy = ($customDataApp && $customDataApp.businessHierarchy) ? $customDataApp.businessHierarchy : null;

      // make sure the first item is selected (root node)
      if (!hierarchy || !hierarchy.length) {
        return;
      }

      hierarchy[0].state.selected = true;
      var $businessTree = $('#jbi_businesses');
      $businessTree.unbind("changed.jstree");
      $businessTree.on('changed.jstree', function (e, data) {
        if (!data || !data.selected || !data.selected.length) {
          return;
        }

        var i, j, r = [];
        for (i = 0, j = data.selected.length; i < j; i++) {
          r.push(data.instance.get_node(data.selected[i]).id);
        }
        my._buildView();
      });

      $businessTree.jstree({
        'plugins': ["wholerow", "nohover"],
        'core': {
          'multiple': false,
          'data': hierarchy,
          'themes': {
            'dots': false,
            'icons': false
          }
        }
      });
    }
  };

  return my;


}(shell.app.execdb.dashboard));
