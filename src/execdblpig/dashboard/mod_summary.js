shell.app.execdblp.dashboard = ( function (my) {

  my._buildSummary = function () {
    addHTML();
    addEventListeners();


    /**
     * addHTML
     * Generate the business filter and the containers for the summary KPIs
     **/
    function addHTML() {
      $("#jbi_summary").html('<div id="jbi_summary_businessfilter"></div>');
      addSummaryBusinessFilter();
    }

    /**
     * addSummaryBusinessFilter
     * Creates the dropdown selection filter for the summary section of the dashboard.
     * @param configSummary {object} Configuration object for the summary section
     */
    function addSummaryBusinessFilter(configSummary) {
      var $body = $("body");
      var customAppFilters = $body.data("customAppFilters");
      var customDataApp = $body.data('customDataApp');
      var customConfig = $body.data('customConfig');
      var initialBusiness = $body.data('initialBusiness');

      if (!customDataApp || !customDataApp.businessHierarchy.length) {
        return;
      }

      if (customDataApp.businessHierarchy.length > 1) {
        console.log('More than one top node given, first one is used');
      }

      var businessHierarchyNodes = flat(customDataApp.businessHierarchy)
        .filter(function(hierarchyNode) {
          return (
            hierarchyNode.nodetype === 'S' ||
            hierarchyNode.nodetype === 'B' ||
            hierarchyNode.nodetype === 'LOB'
          );
        });

        var initialBusinessIndex = 0;
        if (initialBusiness) {
          businessHierarchyNodes.forEach(function(hierarchyNode, index) {
            if (hierarchyNode.id === initialBusiness) {
              initialBusinessIndex = index;
            }
          });
          $body.data('initialBusiness', null);
        }

      // create the business filters based on the available businesses in the BEx query
//@formatter:off
      var s = "";
      s += "<ul id='jbi_summary_filters'>";
        s += "<li id='jbi_summary_filter_business'>";
          s += "<span>" + businessHierarchyNodes[initialBusinessIndex].name + " <svg style='position:relative;right:3px;top:8px;float:right;' class='filter_click_down_icon' width='12px' height='12px' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'><path d='M1408 704q0 26-19 45l-448 448q-19 19-45 19t-45-19l-448-448q-19-19-19-45t19-45 45-19h896q26 0 45 19t19 45z'></path></svg></span>";
            s += "<ul id='jbi_summary_filter_business_items'>";
            businessHierarchyNodes.forEach(function(hierarchyNode, index) {
              s += "<li" +
                " data-filterkey='" + hierarchyNode.id +"'" +
                " data-filtertext='" + hierarchyNode.name + "'" +
                " class='jbi_summary_filter_value" + ( (index === initialBusinessIndex) ? " jbi_summary_filter_active" : "" ) + "'>";
              s += "<span>" + hierarchyNode.name + "</span>";
              s += "</li>";
            });
            s += "</ul>";
          s += "</li>";
        s += "</ul>";
//@formatter:on

      function flat(array) {
        var result = [];
        array.forEach(function (a) {
          result.push(a);
          if (Array.isArray(a.children)) {
            result = result.concat(flat(a.children));
          }
        });
        return result;
      }

      // add the HTML placeholders to the component
      $("#jbi_summary_businessfilter").html(s);
      $body.trigger('hierarchyFilterSelectionChanged');
    }

    function addEventListeners() {

      // open or close the business filter item list
      var $summaryFilterBusiness = $("#jbi_summary_filter_business");
      $summaryFilterBusiness.unbind(my.eventTrigger);
      $summaryFilterBusiness.on(my.eventTrigger, function () {
        $('#jbi_summary_filter_business_items').fadeToggle(300);
      });


      // select a business filter from the business filter item list
      var $summaryFilterBusinessFilterItem = $("#jbi_summary_filter_business ul li");
      $summaryFilterBusinessFilterItem.unbind(my.eventTrigger);
      $summaryFilterBusinessFilterItem.on(my.eventTrigger, function () {
        var filterText = $(this).data("filtertext");
        $("#jbi_summary_filter_business > span").html(filterText + " <svg style='position:relative;right:3px;top:8px;float:right;' class='filter_click_down_icon' width='12px' height='12px' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'><path d='M1408 704q0 26-19 45l-448 448q-19 19-45 19t-45-19l-448-448q-19-19-19-45t19-45 45-19h896q26 0 45 19t19 45z'></path></svg></span>");
        $("#jbi_summary_filter_business li").removeClass("jbi_summary_filter_active");
        $(this).addClass("jbi_summary_filter_active");
        $('body').trigger('hierarchyFilterSelectionChanged');
      });
    }
  };

  return my;

}(shell.app.execdblp.dashboard));
