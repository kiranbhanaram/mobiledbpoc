shell.app.execdb.dashboard = (function (my) {

  /**
   * Generates HTML commentary container
   *
   * This is a generic function that is used to generate the html commentary container
   *
   * @param {string} containerDiv the ID of the HTML div element in which the
   *                              object needs to be rendered
   * @param {object} config       the configuration settings for the bullet chart
   * @param {string} dataId       the ID of the data for the object
   * @param {object} businessData the data for the selected business
   */

  my._createHTMLCommentary = function (containerDiv, config, dataId, businessData) {
    var $body = $('body');
    var isInEditMode = $body.data("comment_edit_mode");

    var commentary = fetchCommentary();

    //var $container = $('#' + containerDiv);
    var $containerContent = $('#' + containerDiv + 'Content');

    addCSS(containerDiv, config);

    if (isInEditMode) renderEditor();
    else renderCommentary();


    /**
     * Generates the CSS for table
     *
     * The CSS settings are provided via the configuration. CSS can be set for an
     * entire table, a table column, a table row or a specific table cell.
     * This function generates a CSS string which will then be added to the header
     * of the document.
     *
     * @param containerDiv   the ID of the HTML div element in which the object
     *                       needs to be rendered
     * @param config         the total configuration object
     */
    function addCSS(containerDiv, config) {
      var $customConfig = $body.data("customConfig");
      var fontFamily = ($customConfig && $customConfig["CONFIG"] && $customConfig["CONFIG"]["dashboard"] && $customConfig["CONFIG"]["dashboard"]["FontFamily"]) || "Verdana";

      // create the CSS string
      var s = "";
      s += "<style type='text/css' id='CSS_HTMLCOMMENTS_" + containerDiv + "' data-group='LAYOUT'  data-repstyle='execdb'>";
      if (config.Height) {
        s += "  #" + containerDiv + " .trumbowyg-editor, #" + containerDiv + " .trumbowyg-box {";
        s += "     min-height: " + config.Height + "px !important;";
        s += "  }";
      }
      s += "  #" + containerDiv + " .trumbowyg-textarea {";
      s += "     min-height: 0 !important;";
      s += "  }";
      s += "  .trumbowyg-box {";
      s += "     margin: 0!important;";
      s += "     font-family: " + fontFamily + ";";
      s += "  }";
      s += "  #" + containerDiv + "Content {";
      s += "     overflow: hidden!important;";
      s += "  }";
      s += "  .trumbowyg-button-pane {";
      s += "     background-color: #F0F0F0;";
      s += "  }";
      s += "</style>";
      $(s).appendTo("head");
    }


    function renderEditor() {
      var editorId = containerDiv + 'Trumbowyg';

      var editorConfigOverrides = JSON.parse(config.EditorConfig || {});
      var editorConfig = jQuery.extend({}, {
        btns: [
          ['viewHTML'],
          ['undo', 'redo'], // Only supported in Blink browsers
          ['formatting'],
          ['fontsize'],
          ['strong', 'em', 'del'],
          ['foreColor', 'backColor'],
          ['superscript', 'subscript'],
          ['link'],
          ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
          ['unorderedList', 'orderedList'],
          ['horizontalRule'],
          ['removeformat'],
          ['fullscreen']
        ],
        btnsDef: {
          saveCommentary: {
            fn: saveCommentary,
            title: 'Save commentary',
            ico: 'upload'
          }
        }
      }, editorConfigOverrides);

      // Add save commentary button as the first button
      editorConfig.btns.unshift(['saveCommentary']);

      $containerContent.html('<div id="' + editorId + '"></div>');
      var $editor = $('#' + editorId);

      $editor.trumbowyg(editorConfig);

      if (commentary !== null) {
        $editor.trumbowyg('html', commentary);
      }

      function saveCommentary() {
        $('body').trigger('htmlCommentSaved', {
          COMMENTARY: $editor.trumbowyg('html'),
          VIEW: getCurrentView(),
          VIEW_SETTING: getViewSetting()
        });
      }
    }

    function renderCommentary() {
      $containerContent.html(commentary);

      var $customConfig = $("body").data("customConfig");
      var fontFamily = ($customConfig && $customConfig["CONFIG"] && $customConfig["CONFIG"]["dashboard"] && $customConfig["CONFIG"]["dashboard"]["FontFamily"])
        ? $customConfig["CONFIG"]["dashboard"]["FontFamily"]
        : "Verdana";

      // CSS Overrides
      $containerContent.css('font-family', fontFamily);
      $containerContent.css('padding-left', '10px');
      $containerContent.css('padding-right', '10px');
    }

    function fetchCommentary() {
      var comments = $('body').data('customDataApp').htmlComments || [];
      var currentView = getCurrentView();

      if (!comments.length) return null;

      var comment = comments.filter(function (comment) {
        return Object.keys(comment.VIEW).every(function (key) {
          return comment.VIEW[key] === currentView[key];
        });
      });

      if (comment.length > 1) {
        console.log('WARNING: more than one comment available for container, first one is used.', currentView);
      }

      return comment.length ? comment[0].COMMENTARY : null;
    }

    function getCurrentView() {
      var $body = $('body');
      var currentViewData = JSON.parse($body.data('currentView'));
      var currentView = {
        m: currentViewData.menuId,
        b: $body.data('currentBusiness'),
        c: config.CommentId
      };

      var activeFilters = currentViewData.filterItems
        .filter(function (filter) {
          return filter.filterValue !== '*';
        })
        .reduce(function (filters, filter) {
          var filterId = filter.filterId.substr('FILTER_'.length);
          filters['f' + filterId] = filter.filterValue;
          return filters;
        }, currentView);

      return currentView;
    }

    function getViewSetting() {
      var currentView = getCurrentView();

      return Object.keys(currentView).sort().map(function (key) {
        var value = currentView[key];
        return key + '=' + value;
      }).join(';');
    }
  };

  return my;
})(shell.app.execdb.dashboard);
