shell.app.execdb.dashboard = ( function (my) {

  my._addViewCommentary = function () {

    // check if the comment editing mode is activated
    var editMode = ($("body").data("comment_edit_mode"));

    // set the CSS
    addCSS(editMode);
    addComment(editMode);


    function addCSS() {

      // only add the CSS if this is not already available
      if ($("#CSS_COMMENTARY").length > 0) {
        return;
      }

      // general CSS for the comment on the VIEW level
      var s = "";
      s += "<style type='text/css' id='CSS_COMMENTARY' data-repstyle='execdb'>";
      s += "#jbi_comment_wrapper{";
      s += " display: table;";
      s += " height: 100%;";
      s += " width: 100%;";
      s += "}";
      s += "#jbi_comment_text{";
      s += " vertical-align: middle;";
      s += " display: table-cell;";
      s += " z-index: 2;";
      s += "}";
      s += "</style>";
      $(s).appendTo("head");
    }


    function addComment(editMode) {

      var contentEditable = "";
      if (editMode) {
        contentEditable = " contenteditable='true' style='background-color:#f8ef9f' ";
      }

      // get the comment
      var commentText = my._getCommentText();
      var decodedText = "";
      try {
        decodedText = decodeURIComponent(commentText);
      }catch(err) {
      }


      var s = "";
//@formatter:off
            s += "<div id=\"jbi_comment_wrapper\">";
              s += "<div id=\"jbi_comment_text\"" + contentEditable + "title=\"" + decodedText + "\">" + decodedText + "</div>";
            s += "</div>";
//@formatter:on
      $("#jbi_comment").html(s);


      // event listener for editing the comment
      if (editMode) {
        var $commentBox = $("#jbi_comment_text");
        $commentBox.unbind("blur");
        $commentBox.on("blur", function (evt) {
          var commentText = evt.currentTarget.innerHTML;
          my._writeComment(commentText)
        });
      }
    }
  };

  my._getCommentKeys = function () {
    var $bodyData = $("body").data(),
      currentView = JSON.parse($bodyData["currentView"]),
      currentFilters = currentView["filterItems"],
      currentPeriod = my.period_functions.getCurrentPeriod(),
      currentMenu = currentView["menuId"].toUpperCase(),
      dashboardId = "CONCEPT";

    if ($bodyData["customConfig"]["CONFIG"] && $bodyData["customConfig"]["CONFIG"]["bw"] && $bodyData["customConfig"]["CONFIG"]["bw"]["Dashboard"]) {
      dashboardId = $bodyData["customConfig"]["CONFIG"]["bw"]["Dashboard"].toUpperCase();
    }


    function convertFilterValue(filterValue) {
      if (filterValue === "*") {
        filterValue = "-";
      }
      return ("" + filterValue).toUpperCase()
    }

    // TODO: Take another look at dynamically generating filters.
    return {
      dashboardId: dashboardId,
      businessId: $bodyData["currentBusiness"].toUpperCase(),
      period: currentPeriod.periodNumber + "." + currentPeriod.year,
      menuId: currentMenu,
      filter1: (currentFilters && currentFilters.length > 0) ? convertFilterValue(currentFilters[0].filterValue) : "-",
      filter2: (currentFilters && currentFilters.length > 1) ? convertFilterValue(currentFilters[1].filterValue) : "-",
      filter3: (currentFilters && currentFilters.length > 2) ? convertFilterValue(currentFilters[2].filterValue) : "-",
      filter4: (currentFilters && currentFilters.length > 3) ? convertFilterValue(currentFilters[3].filterValue) : "-",
      filter5: (currentFilters && currentFilters.length > 4) ? convertFilterValue(currentFilters[4].filterValue) : "-"
    };
  };


  my._getCommentText = function (containerId) {
    var commentText = "";
    var container = containerId || "-";
    var commentKeys = my._getCommentKeys();
    var customData = $("body").data("customDataApp");
    var comments = (customData && customData["comments"]) ? customData["comments"] : [];


    // check if there is a comment for the current selection
    for (var i = 0; i < comments.length; i++) {
      if (comments[i].Menu === commentKeys.menuId
        && comments[i].Business === commentKeys.businessId
        && comments[i].Container === container
        && comments[i].Filter1 === commentKeys.filter1
        && comments[i].Filter2 === commentKeys.filter2
        && comments[i].Filter3 === commentKeys.filter3
        && comments[i].Filter4 === commentKeys.filter4
        && comments[i].Filter5 === commentKeys.filter5
      ) {
        commentText = comments[i].Comment;
        break;
      }
    }

    return commentText;
  };


  my._addContainerCommentary = function (divId) {
    addCSS();
    addContainerComment(divId);


    function addCSS() {

      // only add the CSS if this is not already available
      if ($("#CSS_COMMENTARY_CONTAINER").length > 0) {
        return;
      }

      var $customConfig = $("body").data("customConfig");
      var containerDisplay = ($customConfig && $customConfig["CONFIG"] && $customConfig["CONFIG"]["container"]["EnableComment"] && $customConfig["CONFIG"]["container"]["EnableComment"] === "False") ? "none" : "block";


      // general CSS for the comment on the VIEW level
      var s = "";
      s += "<style type='text/css' id='CSS_COMMENTARY_CONTAINER' data-repstyle='execdb'>";
      s += "  .containerComment {";
      s += "      margin: 1px 2px 1px;";
      s += "      line-height: 24px;";
      s += "      position: relative;";
      s += "      overflow: auto;";
      s += "      font-family: Verdana;";
      s += "      border: 1px solid #D8D8D8;";
      s += "      padding-left: 6px;";
      s += "      font-style: italic;";
      s += "      display: " + containerDisplay + ";";
      s += "      background-color: #F0F0F0;";
      s += "      color: #564A4A;";
      s += "      font-size: 12px;";
      s += "}";
      s += "</style>";
      $(s).appendTo("head");
    }


    function addContainerComment(divId) {

      // check if currently in comment edit mode
      var $body = $("body");
      var editMode = ($body.data("comment_edit_mode"));

      // get the comment text
      var containerId = divId.substring(9);
      var commentText = my._getCommentText(containerId);
      if (commentText === "" && !editMode) {
        return;
      }

      // generate the HTML
      var contentEditable = "";
      if (editMode) {
        contentEditable = " contenteditable='true' style='background-color:#f8ef9f' ";
      }

      var decodedText = "";
      try {
        decodedText = decodeURIComponent(commentText);
      }catch(err){
      }

      var s = "";
      s += "<div " + contentEditable + " class=\"containerComment\">" + decodedText + "</div>";
      $("#" + divId + "ContentBox").append(s);

      // event listener for editing the comment
      if (editMode) {
        var $commentBox = $("#" + divId + "ContentBox .containerComment");
        $commentBox.unbind("blur");
        $commentBox.on("blur", function (evt) {
          var commentText = evt.currentTarget.innerHTML;
          var containerId = evt.target.parentElement.id.substring(9, evt.target.parentElement.id.indexOf("ContentBox"));
          my._writeComment(commentText, containerId)
        });
      }
    }
  };


  my._updateStoredText = function (commentText, containerId) {
    var container = containerId || "-";
    var commentKeys = my._getCommentKeys();
    var customData = $("body").data("customDataApp");
    var comments = (customData && customData["comments"]) ? customData["comments"] : [];

    // check if there is a comment for the current selection
    var newComment = true;
    for (var i = 0; i < comments.length; i++) {
      if (comments[i].Menu === commentKeys.menuId
        && comments[i].Business === commentKeys.businessId
        && comments[i].Container === container
        && comments[i].Filter1 === commentKeys.filter1
        && comments[i].Filter2 === commentKeys.filter2
        && comments[i].Filter3 === commentKeys.filter3
        && comments[i].Filter4 === commentKeys.filter4
        && comments[i].Filter5 === commentKeys.filter5
      ) {
        newComment = false;
        comments[i].Comment = commentText;
        break;
      }
    }

    if (newComment) {
      comments.push({
        Menu: commentKeys.menuId,
        Business: commentKeys.businessId,
        Container: container,
        Filter1: commentKeys.filter1,
        Filter2: commentKeys.filter2,
        Filter3: commentKeys.filter3,
        Filter4: commentKeys.filter4,
        Filter5: commentKeys.filter5,
        Comment: commentText
      })
    }

    customData["comments"] = comments;
  };


  my._writeComment = function (commentText, containerId) {

    // remove the paragraph tags
    var cleanedCommentText = commentText.replace(/<p>/g, "").replace(/<\/p>/g, "");

    // compare the current text with the text stored in BW
    var storedText = my._getCommentText(containerId);
    if (storedText === cleanedCommentText) {
      return;
    }

    var encodedComment = encodeURIComponent(cleanedCommentText);
    if (encodedComment && encodedComment.toString().length > 1000) {
      alert("The entered comment is too long and cannot be saved.");
      return;
    }

    // update the stored text with the new text
    my._updateStoredText(cleanedCommentText, containerId);

    // update the text in the database
    var commentKeys = my._getCommentKeys();
    var inputParams = {
      "I_COMMENT": encodedComment,
      "I_MENU": commentKeys.menuId,
      "I_BUSINESS": commentKeys.businessId,
      "I_CONTAINER": containerId || "",
      "I_FILTER01": commentKeys.filter1,
      "I_FILTER02": commentKeys.filter2,
      "I_FILTER03": commentKeys.filter3,
      "I_FILTER04": commentKeys.filter4,
      "I_FILTER05": commentKeys.filter5,
      "I_PERIOD": commentKeys.period,
      "I_REPORT": commentKeys.dashboardId
    };


    // use an AJAX call in order to retrieve the configuration
    $.ajax({
      type: "POST",
      url: "./../../../shell_json//SHELL/SET_COMMENT_BEX?$format=json",
      xhrFields: {
        withCredentials: true
      },
      async: true,
      dataType: "json",
      data: JSON.stringify(inputParams),
      contentType: "text/plain",
      success: function () {
      },
      error: function (e) {
      }
    });
  };


  return my;


}(shell.app.execdb.dashboard));
