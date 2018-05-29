shell.app.execdb.dashboard = (function (my) {

    /**
     * Creates the Layout
     *
     * The layout of the report determines the number of containers within a
     * specific view and the positioning of these containers. The number of
     * layouts can easily be extended by adding a new function.
     * Each layout consist of a CSS part and a HTML part. When changing from
     * view, the current CSS and current HTML will be removed and then the
     * new CSS and HTML will be created.
     *
     * @param view   the view configuration that holds information about the
     *               layout that needs to be created
     */
    my._createViewLayout = function (view) {
      // check if a layout is provided
      if (!view.Layout) {
        return;
      }

      // remove CSS belonging to other layouts
      $("[data-group='LAYOUT']").remove();

      // CSS
      var s = "";
      s += "<style type='text/css' id='CSS_FLEX_LAYOUT' data-group='LAYOUT' data-repstyle='execdb'>";
      s += ".layoutContent {";
      s += "  position: relative;";
      s += "  background-color: white;";
      s += "  border: 1px solid lightgrey;";
      s += "  margin-bottom: 10px;";
      s += "}";
      s += ".containers {";
      s += "  margin: 0 !important;";
      s += "}";
      s += ".container {";
      s += "  overflow: auto;";
      s += "  padding: 4px !important;";
      s += "}";
      s += "</style>";
      $(s).appendTo("head");

      var layout = document.createElement('div');
      layout.classList.add('layoutContent');

      var rows = view.Layout.split('_').slice(1);
      for (var containerNo = 1, rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        var containersRow = document.createElement('div');
        containersRow.className += ' containers columns';

        for (var column = 1; column <= rows[rowIndex]; column++) {
          var container = document.createElement('div');
          container.className += ' container column';
          container.id = 'container' + containerNo;
          containersRow.appendChild(container);
          containerNo++;
        }

        layout.appendChild(containersRow);
      }

      // append the HTML to the content div
      $(".layoutContent").remove();
      $("#jbi_content").append(layout);
    };

    return my;

  }(shell.app.execdb.dashboard));
