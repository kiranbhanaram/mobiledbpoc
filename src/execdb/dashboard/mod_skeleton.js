shell.app.execdb.dashboard = ( function (my) {

  my._buildSkeleton = function (elementId) {

    // extract an object holding the styles from the configuration object
    var appConfig = $("body").data("customConfig"),
      styleConfig = getStyleConfig(appConfig.CONFIG);

    // Set the application CSS and HTML
    setCSS(styleConfig);
    setHTML(elementId, styleConfig);
  };


  /**
   * Extract the application style configuration
   * @param  {object} config Application configuration file
   * @returns {object} All styles in a single object
   */
  function getStyleConfig(config) {
    var configObject = {
      pDashboardMinWidth: (config.dashboard.MinWidth && config.dashboard.MinWidth !== "") ? config.dashboard.MinWidth : "auto",
      pDashboardMaxWidth: (config.dashboard.MaxWidth && config.dashboard.MaxWidth !== "") ? config.dashboard.MaxWidth : "auto",
      pDashboardMaxHeight: (config.dashboard.MaxHeight && config.dashboard.MaxHeight !== "") ? config.dashboard.MaxHeight : "auto",
      pDashboardBackgroundColor: (config.dashboard.BackgroundColor && config.dashboard.BackgroundColor !== "") ? config.dashboard.BackgroundColor : "#FFFFFF",
      pDashboardFontFamily: (config.dashboard.FontFamily && config.dashboard.FontFamily !== "") ? config.dashboard.FontFamily : "Verdana",

      pHeaderEnabled: (config.header.Enabled && config.header.Enabled !== "True") ? "none" : "block",
      pHeaderHeightPixels: (!config.header.HeightPixels || isNaN(parseInt(config.header.HeightPixels))) ? 50 : parseInt(config.header.HeightPixels),
      pHeaderFontSizePixels: (!config.header.FontSizePixels || isNaN(parseInt(config.header.FontSizePixels))) ? 17 : parseInt(config.header.FontSizePixels),
      pHeaderBackgroundColor: (config.header.BackgroundColor && config.header.BackgroundColor !== "") ? config.header.BackgroundColor : "#FFFFFF",
      pHeaderFontColor: (config.header.FontColor && config.header.FontColor !== "") ? config.header.FontColor : "#000000",
      pHeaderTitle: (config.header.Title && config.header.Title !== "") ? config.header.Title : "",
      pHeaderTitleYPosition: (!config.header.TitleYPosition || isNaN(parseInt(config.header.TitleYPosition))) ? 0 : parseInt(config.header.TitleYPosition),
      pHeaderTitleXPosition: (!config.header.TitleXPosition || isNaN(parseInt(config.header.TitleXPosition))) ? 40 : parseInt(config.header.TitleXPosition),
      pHeaderLogoEnabled: (config.header.LogoEnabled && config.header.LogoEnabled !== "True") ? "none" : "block",
      pHeaderLogoWidthPixels: (!config.header.LogoWidthPixels || isNaN(parseInt(config.header.LogoWidthPixels))) ? 30 : parseInt(config.header.LogoWidthPixels),
      pHeaderLogoHeightPixels: (!config.header.LogoHeightPixels || isNaN(parseInt(config.header.LogoHeightPixels))) ? 30 : parseInt(config.header.LogoHeightPixels),
      pHeaderLogoYPosition: (!config.header.LogoYPosition || isNaN(parseInt(config.header.LogoYPosition))) ? 4 : parseInt(config.header.LogoYPosition),
      pHeaderLogoXPosition: (!config.header.LogoXPosition || isNaN(parseInt(config.header.LogoXPosition))) ? 4 : parseInt(config.header.LogoXPosition),
      pHeaderPeriodXPos: (!config.header.PeriodXPosition || isNaN(parseInt(config.header.PeriodXPosition))) ? 17 : parseInt(config.header.PeriodXPosition),
      pHeaderPeriodYPos: (!config.header.PeriodYPosition || isNaN(parseInt(config.header.PeriodYPosition))) ? 20 : parseInt(config.header.PeriodYPosition),
      pHeaderPeriodFontColor: (config.header.PeriodFontColor && config.header.PeriodFontColor !== "") ? config.header.PeriodFontColor : "#FFFFFF",
      pHeaderPeriodFontSize: (!config.header.PeriodFontSize || isNaN(parseInt(config.header.PeriodYPosition))) ? 12 : parseInt(config.header.PeriodFontSize),
      pHeaderSubTitleEnabled: config.header.SubTitleEnabled === "True",
      pHeaderSubTitleContent: config.header.SubTitleContent || "",
      pHeaderSubTitleFontColor: (config.header.SubTitleFontColor && config.header.SubTitleFontColor !== "") ? config.header.SubTitleFontColor : "#FFFFFF",
      pHeaderSubTitleFontSize: (!config.header.SubTitleFontSize || isNaN(parseInt(config.header.SubTitleYPosition))) ? 12 : parseInt(config.header.SubTitleFontSize),
      pHeaderSubTitleXPos: (!config.header.SubTitleXPosition || isNaN(parseInt(config.header.SubTitleXPosition))) ? 70 : parseInt(config.header.SubTitleXPosition),
      pHeaderSubTitleYPos:  (!config.header.SubTitleYPosition || isNaN(parseInt(config.header.SubTitleYPosition))) ? 50 : parseInt(config.header.SubTitleYPosition),

      pFooterEnabled: (config.footer.Enabled && config.footer.Enabled !== "True") ? "none" : "block",
      pFooterHeightPixels: (!config.footer.HeightPixels || isNaN(parseInt(config.footer.HeightPixels))) ? 50 : parseInt(config.footer.HeightPixels),
      pFooterBackgroundColor: (config.footer.BackgroundColor && config.footer.BackgroundColor !== "") ? config.footer.BackgroundColor : "#FFFFFF",

      pMenuPlacement: (config.menu.Display && config.menu.Display !== "") ? config.menu.Display : "TextOnly",
      pMenuTopYOffset: (!config.menu.topYOffset || isNaN(parseInt(config.menu.topYOffset))) ? 0 : parseInt(config.menu.topYOffset),
      pMenuDisplay: (config.menu.Display === "None") ? "none" : "block",
      pMenuBackgroundColor: (config.menu.BackgroundColor && config.menu.BackgroundColor !== "") ? config.menu.BackgroundColor : "#333333",
      pMenuItemIconDisplay: "inline-block",
      pMenuItemTextUnselected: (config.menu.MenuItemTextUnselected && config.menu.MenuItemTextUnselected !== "") ? config.menu.MenuItemTextUnselected : "#FFFFFF",
      pMenuItemTextSelected: (config.menu.MenuItemTextSelected && config.menu.MenuItemTextSelected !== "") ? config.menu.MenuItemTextSelected : "#FFFFFF",
      pMenuItemBackgroundUnselected: (config.menu.MenuItemBackgroundUnselected && config.menu.MenuItemBackgroundUnselected !== "") ? config.menu.MenuItemBackgroundUnselected : "#333333",
      pMenuItemBackgroundSelected: (config.menu.MenuItemBackgroundSelected && config.menu.MenuItemBackgroundSelected !== "") ? config.menu.MenuItemBackgroundSelected : "#008CBA",
      pMenuItemBackgroundHover: (config.menu.MenuItemBackgroundHover && config.menu.MenuItemBackgroundHover !== "") ? config.menu.MenuItemBackgroundHover : "#666666",
      pMenuItemFontSize: (config.menu.MenuItemFontSize && isNaN(parseInt(config.menu.MenuItemFontSize))) ? 12 : parseInt(config.menu.MenuItemFontSize),
      pMenuItemTextHover: (config.menu.MenuItemTextHover && config.menu.MenuItemTextHover !== "") ? config.menu.MenuItemTextHover : "#FFFFFF",
      pMenuHorizontalMenuHeightPixels: (config.menu.HorizontalMenuHeightPixels && config.menu.HorizontalMenuHeightPixels !== "") ? config.menu.HorizontalMenuHeightPixels : 40,
      pMenuBorderTop : (config.menu.MenuBorderTop && config.menu.MenuBorderTop !== "") ? config.menu.MenuBorderTop : "none",
      pMenuBorderRight : (config.menu.MenuBorderRight && config.menu.MenuBorderRight !== "") ? config.menu.MenuBorderRight : "none",
      pMenuBorderLeft : (config.menu.MenuBorderLeft && config.menu.MenuBorderLeft !== "") ? config.menu.MenuBorderLeft : "none",
      pMenuBorderBottom : (config.menu.MenuBorderBottom && config.menu.MenuBorderBottom !== "") ? config.menu.MenuBorderBottom : "none",

      pFilterLeftPaneEnabled: (config.filter.FilterLeftPaneEnabled && config.filter.FilterLeftPaneEnabled !== "True") ? "none" : "block",
      pFilterLeftPaneWidthPixels: (!config.filter.FilterLeftPaneWidthPixels || isNaN(parseInt(config.filter.FilterLeftPaneWidthPixels))) ? 200 : parseInt(config.filter.FilterLeftPaneWidthPixels),
      pFilterLeftPaneBorderRight : (config.filter.FilterLeftPaneBorderRight && config.filter.FilterLeftPaneBorderRight !== "") ? config.filter.FilterLeftPaneBorderRight : "none",
      pFilterLeftPaneItemBackgroundColor: (config.filter.FilterLeftPaneItemBackgroundColor && config.filter.FilterLeftPaneItemBackgroundColor !== "") ? config.filter.FilterLeftPaneItemBackgroundColor : "#32323a",
      pFilterLeftPaneItemFontColor: (config.filter.FilterLeftPaneItemFontColor && config.filter.FilterLeftPaneItemFontColor !== "") ? config.filter.FilterLeftPaneItemFontColor : "#FFF",
      pFilterLeftPaneItemHoverBackgroundColor: (config.filter.FilterLeftPaneItemHoverBackgroundColor && config.filter.FilterLeftPaneItemHoverBackgroundColor !== "") ? config.filter.FilterLeftPaneItemHoverBackgroundColor : "#666666",
      pFilterLeftPaneItemHoverFontColor: (config.filter.FilterLeftPaneItemHoverFontColor && config.filter.FilterLeftPaneItemHoverFontColor !== "") ? config.filter.FilterLeftPaneItemHoverFontColor : "#FFFFFF",
      pFilterLeftPaneItemSelectedBackgroundColor: (config.filter.FilterLeftPaneItemSelectedBackgroundColor && config.filter.FilterLeftPaneItemSelectedBackgroundColor !== "") ? config.filter.FilterLeftPaneItemSelectedBackgroundColor : "#008CBA",
      pFilterLeftPaneItemSelectedFontColor: (config.filter.FilterLeftPaneItemSelectedFontColor && config.filter.FilterLeftPaneItemSelectedFontColor !== "") ? config.filter.FilterLeftPaneItemSelectedFontColor : "#FFFFFF",
      pFilterTopPaneHeightPixels: (!config.filter.FilterTopPaneHeightPixels || isNaN(parseInt(config.filter.FilterTopPaneHeightPixels))) ? 45 : parseInt(config.filter.FilterTopPaneHeightPixels),
      pFilterTopPaneBackgroundColor: (config.filter.FilterTopPaneBackgroundColor && config.filter.FilterTopPaneBackgroundColor !== "") ? config.filter.FilterTopPaneBackgroundColor : "transparent",
      pFilterTopPaneDropdownBorderWidth: (config.filter.FilterTopPaneDropdownBorderWidth === undefined || isNaN(parseInt(config.filter.FilterTopPaneDropdownBorderWidth))) ? 1 : parseInt(config.filter.FilterTopPaneDropdownBorderWidth),
      pFilterTopPaneDropdownBorderColor: (config.filter.FilterTopPaneDropdownBorderColor && config.filter.FilterTopPaneDropdownBorderColor !== "") ? config.filter.FilterTopPaneDropdownBorderColor : "lightgrey",
      pFilterTopPaneDropdownSelectedFontColor: (config.filter.FilterTopPaneDropdownSelectedFontColor && config.filter.FilterTopPaneDropdownSelectedFontColor !== "") ? config.filter.FilterTopPaneDropdownSelectedFontColor : "#333",
      pFilterTopPaneDropdownSelectedFontWeight: (config.filter.FilterTopPaneDropdownSelectedFontWeight === undefined || config.filter.FilterTopPaneDropdownSelectedFontWeight === "") ? "normal" : config.filter["FilterTopPaneDropdownSelectedFontWeight"],
      pFilterTopPaneDropdownSelectedFontSizePixels: (config.filter.FilterTopPaneDropdownSelectedFontSizePixels && config.filter.FilterTopPaneDropdownSelectedFontSizePixels !== "") ? config.filter.FilterTopPaneDropdownSelectedFontSizePixels : "12",
      pFilterTopPaneDropdownSelectedBackgroundColor: (config.filter.FilterTopPaneDropdownSelectedBackgroundColor && config.filter.FilterTopPaneDropdownSelectedBackgroundColor !== "") ? config.filter.FilterTopPaneDropdownSelectedBackgroundColor : "lightgrey",
      pFilterTopPaneDropdownHoverBackgroundColor: (config.filter.FilterTopPaneDropdownHoverBackgroundColor && config.filter.FilterTopPaneDropdownHoverBackgroundColor !== "") ? config.filter.FilterTopPaneDropdownHoverBackgroundColor : "#F0F0F0",
      pFilterTopPaneDropdownHoverFontColor: (config.filter.FilterTopPaneDropdownHoverFontColor && config.filter.FilterTopPaneDropdownHoverFontColor !== "") ? config.filter.FilterTopPaneDropdownHoverFontColor : "#4A4A4A",
      pFilterTopPaneDropdownHeightPixels: (!config.filter.FilterTopPaneDropdownHeightPixels || isNaN(parseInt(config.filter.FilterTopPaneDropdownHeightPixels))) ? 30 : parseInt(config.filter.FilterTopPaneDropdownHeightPixels),
      pFilterTopPaneDropdownItemFontColor: (config.filter.FilterTopPaneDropdownItemFontColor && config.filter.FilterTopPaneDropdownItemFontColor !== "") ? config.filter.FilterTopPaneDropdownItemFontColor : "#4A4A4A",
      pFilterTopPaneDropdownItemFontSizePixels: (!config.filter.FilterTopPaneDropdownItemFontSizePixels || isNaN(parseInt(config.filter.FilterTopPaneDropdownItemFontSizePixels))) ? 12 : parseInt(config.filter.FilterTopPaneDropdownItemFontSizePixels),
      pFilterTopPaneDropdownItemBackgroundColor: (config.filter.FilterTopPaneDropdownItemBackgroundColor && config.filter.FilterTopPaneDropdownItemBackgroundColor !== "") ? config.filter.FilterTopPaneDropdownItemBackgroundColor : "#FFFFFF",
      pFilterTopPaneDropdownItemHoverBackgroundColor: (config.filter.FilterTopPaneDropdownItemHoverBackgroundColor && config.filter.FilterTopPaneDropdownItemHoverBackgroundColor !== "") ? config.filter.FilterTopPaneDropdownItemHoverBackgroundColor : "#F2F2F2",
      pFilterTopPaneDropdownItemHoverFontColor: (config.filter.FilterTopPaneDropdownItemHoverFontColor && config.filter.FilterTopPaneDropdownItemHoverFontColor !== "") ? config.filter.FilterTopPaneDropdownItemHoverFontColor : "#4A4A4A",
      pFilterTopPaneDropdownItemDisabledFontColor: (config.filter.FilterTopPaneDropdownItemDisabledFontColor && config.filter.FilterTopPaneDropdownItemDisabledFontColor !== "") ? config.filter.FilterTopPaneDropdownItemDisabledFontColor : "#CCCCCC",
      pFilterTopPaneDropdownItemDisabledBackgroundColor: (config.filter.FilterTopPaneDropdownItemDisabledBackgroundColor && config.filter.FilterTopPaneDropdownItemDisabledBackgroundColor !== "") ? config.filter.FilterTopPaneDropdownItemDisabledBackgroundColor : "#FFFFFF",
      pFilterIconsEnabled: (config.filter.FilterIconsEnabled && config.filter.FilterIconsEnabled !== "True") ? "none" : "block",

      pViewCommentEnabled: (config.viewcomment.Enabled && config.viewcomment.Enabled !== "True") ? "none" : "block",
      pViewCommentTextAlign: (config.viewcomment.TextAlign && config.viewcomment.TextAlign !== "") ? config.viewcomment.TextAlign : "left",
      pViewCommentFontColor: (config.viewcomment.FontColor && config.viewcomment.FontColor !== "") ? config.viewcomment.FontColor : "#888",
      pViewCommentMaxWidth: (config.viewcomment.MaxWidth === undefined || isNaN(parseInt(config.viewcomment.MaxWidth))) ? undefined : parseInt(config.viewcomment.MaxWidth),
      pViewCommentHeight: (config.viewcomment.Height === undefined || isNaN(parseInt(config.viewcomment.Height))) ? 45 : parseInt(config.viewcomment.Height),
      pViewCommentTop: (config.viewcomment.Top === undefined || isNaN(parseInt(config.viewcomment.Top))) ? 70 : parseInt(config.viewcomment.Top),
      pViewCommentLeft: (config.viewcomment.Left === undefined || isNaN(parseInt(config.viewcomment.Left))) ? 200 : parseInt(config.viewcomment.Left),
      pViewCommentRight: (config.viewcomment.Right === undefined || isNaN(parseInt(config.viewcomment.Right))) ? 180 : parseInt(config.viewcomment.Right),
      pViewCommentBottom: (config.viewcomment.Bottom === undefined || isNaN(parseInt(config.viewcomment.Bottom))) ? undefined : parseInt(config.viewcomment.Bottom),
      pViewCommentFontSize: (config.viewcomment.FontSize && config.viewcomment.FontSize !== "") ? config.viewcomment.FontSize : "14px",
      pViewCommentUpperCase: (config.viewcomment.UpperCase && config.viewcomment.UpperCase !== "True") ? "none" : "uppercase",

      pPdfEnabled: (config.pdf.Enabled && config.pdf.Enabled !== "True") ? "none" : "block",
      pPdfExportEnabled: (config.pdf.Enabled && config.pdf.Enabled === "True") ? true : false,
      pPdfFontColor: (config.pdf.FontColor && config.pdf.FontColor !== "") ? config.pdf.FontColor : "#888",
      pPdfFontSize: (config.pdf.FontSize && config.pdf.FontSize !== "") ? config.pdf.FontSize : "14px",
      pPdfPositionTop: (config.pdf.PositionTop === undefined || isNaN(parseInt(config.pdf.PositionTop))) ? "0px;" : parseInt(config.pdf.PositionTop) + "px;",
      pPdfPositionRight: (config.pdf.PositionRight === undefined || isNaN(parseInt(config.pdf.PositionRight))) ? "0px;" : parseInt(config.pdf.PositionRight) + "px;",
      pPdfPositionBottom: (config.pdf.PositionBottom === undefined || isNaN(parseInt(config.pdf.PositionBottom))) ? "auto;" : parseInt(config.pdf.PositionBottom),
      pPdfPositionLeft: (config.pdf.PositionLeft === undefined || isNaN(parseInt(config.pdf.PositionLeft))) ? "auto;" : parseInt(config.pdf.PositionLeft),

      pContainerMessageFontSizePixels: (config.container["MessageFontSizePixels"] === undefined || isNaN(parseInt(config.container["MessageFontSizePixels"]))) ? 12 : parseInt(config.container["MessageFontSizePixels"]),
      pContainerMessageDefaultFontColor: (config.container["MessageDefaultFontColor"] && config.container["MessageDefaultFontColor"] !== "") ? config.container["MessageDefaultFontColor"] : "#000000",
      pContainerMessageWarningFontColor: (config.container["MessageWarningFontColor"] && config.container["MessageWarningFontColor"] !== "") ? config.container["MessageWarningFontColor"] : "#000000",
      pContainerMessageErrorFontColor: (config.container["MessageErrorFontColor"] && config.container["MessageErrorFontColor"] !== "") ? config.container["MessageErrorFontColor"] : "#000000",
      pContainerFooterHeightPixels: (config.container["FooterHeightPixels"] === undefined || isNaN(parseInt(config.container["FooterHeightPixels"]))) ? 24 : parseInt(config.container["FooterHeightPixels"]),
      pContainerFooterFontColor: (config.container["FooterFontColor"] && config.container["FooterFontColor"] !== "") ? config.container["FooterFontColor"] : "#564A4A",
      pContainerFooterBackgroundColor: (config.container["FooterBackgroundColor"] && config.container["FooterBackgroundColor"] !== "") ? config.container["FooterBackgroundColor"] : "#F0F0F0",
      pContainerFooterFontSizePixels: (config.container["FooterFontSizePixels"] === undefined || isNaN(parseInt(config.container["FooterFontSizePixels"]))) ? 12 : parseInt(config.container["FooterFontSizePixels"]),
      pContainerTitleHeightPixels: (config.container["TitleHeightPixels"] === undefined || isNaN(parseInt(config.container["TitleHeightPixels"]))) ? 0 : parseInt(config.container["TitleHeightPixels"]),
      pContainerTitleBackgroundColor: (config.container["TitleBackgroundColor"] && config.container["TitleBackgroundColor"] !== "") ? config.container["TitleBackgroundColor"] : "#F0F0F0",
      pContainerTitleFontColor: (config.container["TitleFontColor"] && config.container["TitleFontColor"] !== "") ? config.container["TitleFontColor"] : "#000000",
      pContainerTitleFontSizePixels: (config.container["TitleFontSizePixels"] === undefined || isNaN(parseInt(config.container["TitleFontSizePixels"]))) ? 0 : parseInt(config.container["TitleFontSizePixels"]),
      pContainerTitleFontWeight: (config.container["TitleFontWeight"] === undefined || config.container["TitleFontWeight"] === "") ? "normal" : config.container["TitleFontWeight"],
      pContainerTitleTextAlign: (config.container["TitleTextAlign"] && config.container["TitleTextAlign"] !== "") ? config.container["TitleTextAlign"] : "left",
      pContainerBorderColor: (config.container["BorderColor"] && config.container["BorderColor"] !== "") ? config.container["BorderColor"] : "#D8D8D8",
      pContainerBorderWidthPixels: (config.container["BorderWidthPixels"] === undefined || isNaN(parseInt(config.container["BorderWidthPixels"]))) ? 1 : parseInt(config.container["BorderWidthPixels"]),
      pContainerBorderStyle: (config.container["BorderStyle"] && config.container["BorderStyle"] !== "") ? config.container["BorderStyle"] : "solid"
    };


    if (configObject.pHeaderEnabled === "none") {
      configObject.pHeaderHeightPixels = 0;
    }
    if (configObject.pFooterEnabled === "none") {
      configObject.pFooterHeightPixels = 0;
    }
    if (configObject.pMenuPlacement === "TextOnly") {
      configObject.pMenuItemIconDisplay = "none";
    }
    if (configObject.pMenuPlacement === "None") {
      configObject.pMenuDisplay = "none";
      configObject.pMenuHorizontalMenuHeightPixels = 0;
    }
    return configObject;
  }


  /**
   * SET APPLICATION CSS
   * Add CSS based on the configuration
   **/
  function setCSS(cfg) {
    var s = "";
    s += "<style type='text/css' id='CSS_" + cfg.pDashboardLayout + "' data-repstyle='execdb'>";

    /** Framework specific **/
    s += "#jbi_container{";
    s += "  position: fixed;";
    s += "  top: 0;";
    s += "  left: 0;";
    s += "  right: 0;";
    s += "  bottom:0;";
    s += "  background-color : " + cfg.pDashboardBackgroundColor + ";";
    s += "  overflow-x: auto;";
    s += "  overflow-y: hidden;";
    s += "}";

    s += "#jbi_app{";
    s += "  min-width : " + cfg.pDashboardMinWidth + ";";
    s += "  max-width: " + cfg.pDashboardMaxWidth + ";";
    s += "  max-height: " + cfg.pDashboardMaxHeight + ";";
    s += "  margin-left: auto;";
    s += "  margin-right: auto;";
    s += "  width: 100%;";
    s += "  position: absolute;";
    s += "  top: 0;";
    s += "  left: 0;";
    s += "  right: 0;";
    s += "  bottom:0;";
    s += "  border-left-width : 1px;";
    s += "  border-left-style: solid;";
    s += "  border-left-color: lightgrey;";
    s += "  border-right-width : 1px;";
    s += "  border-right-style: solid;";
    s += "  border-right-color: lightgrey;";
    s += "  z-index: 12000;";
    s += "  box-sizing: border-box;";
    s += "}";

    s += "#jbi_header{";
    s += "  display : " + cfg.pHeaderEnabled + ";";
    s += "  position: absolute;";
    s += "  top: 0;";
    s += "  left: 0;";
    s += "  right: 0;";
    s += "  height: " + cfg.pHeaderHeightPixels + "px;";
    s += "  line-height: " + cfg.pHeaderHeightPixels + "px;";
    s += "  background-color : " + cfg.pHeaderBackgroundColor + ";";
    s += "  color : " + cfg.pHeaderFontColor + ";";
    s += "  padding-left: 17px;";
    s += "}";

    s += "#jbi_period{";
    s += "  position:absolute;";
    s += "  top: " + cfg.pHeaderPeriodYPos + "px;";
    s += "  left: " + cfg.pHeaderPeriodXPos + "px;";
    s += "  height: 20px;";
    s += "  font-family: Futura, 'Trebuchet MS', Arial, sans-serif;";
    s += "  font-size: " + cfg.pHeaderPeriodFontSize + "px;";
    s += "  font-style: italic;";
    s += "  font-variant: normal;";
    s += "  font-weight: bold;";
    s += "  color: " + cfg.pHeaderPeriodFontColor + ";";
    s += "  z-index: 1;";
    s += "}";

    if (cfg.pHeaderSubTitleEnabled) {
        s += "#jbi_sub_title {";
        s += "  position:absolute;";
        s += "  top: " + cfg.pHeaderSubTitleYPos + "px;";
        s += "  left: " + cfg.pHeaderSubTitleXPos + "px;";
        s += "  height: 20px;";
        s += "  font-family: Futura, 'Trebuchet MS', Arial, sans-serif;";
        s += "  font-size: " + cfg.pHeaderSubTitleFontSize + "px;";
        s += "  font-variant: normal;";
        s += "  color: " + cfg.pHeaderSubTitleFontColor + ";";
        s += "  z-index: 1;";
        s += "}";
    }

    s += "#jbi_menu{";
    s += "  background-color: " + cfg.pMenuBackgroundColor + ";";
    s += "  position: absolute;";
    s += "  right: 0;";
    s += "  top: " + parseInt(cfg.pHeaderHeightPixels + cfg.pMenuTopYOffset) + "px;";
    s += "  height: " + cfg.pMenuHorizontalMenuHeightPixels + "px;";
    s += "  left: " + cfg.pFilterLeftPaneWidthPixels + "px;";
    s += "  display :" + cfg.pMenuDisplay + ";";
    s += "  font-size: " + cfg.pMenuItemFontSize + "px;";
    s += "  overflow-y: hidden;";
    s += "  border-top: " + cfg.pMenuBorderTop + ";";
    s += "  border-right: " + cfg.pMenuBorderRight + ";";
    s += "  border-bottom: " + cfg.pMenuBorderBottom + ";";
    s += "  border-left: " + cfg.pMenuBorderLeft + ";";
    s += "}";

    s += "#jbi_comment{";
    s += " position: absolute;";
    s += " color: " + cfg.pViewCommentFontColor + ";";
    s += " text-align: " + cfg.pViewCommentTextAlign + ";";
    s += " font-size: " + cfg.pViewCommentFontSize + ";";
    s += " height: " + cfg.pViewCommentHeight + "px;";
    s += " left: " + cfg.pViewCommentLeft + "px;";
    s += " top: " + cfg.pViewCommentTop + "px;";
    s += " right: " + cfg.pViewCommentRight + "px;";
    if (cfg.pViewCommentBottom) {
      s += " bottom: " + cfg.pViewCommentBottom + "px;";
    }
    s += " display: " + cfg.pViewCommentEnabled + ";";
    if (cfg.pViewCommentMaxWidth) {
      s += " max-width: " + cfg.pViewCommentMaxWidth + "px;";
    }
    s += " text-transform: " + cfg.pViewCommentUpperCase + ";";
    s += " padding: 4px;";
    s += " overflow: hidden;";
    s += " box-sizing: border-box;";
    s += " font-family: Tahoma,Arial,Helvetica,sans-serif;";
    s += "}";

    s += "#jbi_filter_toppane{";
    s += "  position: absolute;";
    s += "  height: " + cfg.pFilterTopPaneHeightPixels + "px;";
    s += "  line-height: " + cfg.pFilterTopPaneHeightPixels + "px;";
    s += "  left: " + cfg.pFilterLeftPaneWidthPixels + "px;";
    s += "  top: " + parseInt(cfg.pHeaderHeightPixels + cfg.pMenuTopYOffset + cfg.pMenuHorizontalMenuHeightPixels) + "px;";
    s += "  right: 0;";
    s += "  background-color: " + cfg.pFilterTopPaneBackgroundColor + ";";
    s += "  text-align: right;";
    s += "  margin-right: 4px;";
    s += "}";



    s += "#jbi_filter_icons{";
    s += "  position: absolute;";
    s += "  margin: 0px 4px 0px 4px;";
    s += "  left: " + cfg.pFilterLeftPaneWidthPixels + "px;";
    s += "  top: " + parseInt(cfg.pHeaderHeightPixels + cfg.pMenuTopYOffset +  cfg.pMenuHorizontalMenuHeightPixels + cfg.pFilterTopPaneHeightPixels) + "px;";
    s += "  right: 0;";
    s += "  bottom: 0;";
    s += "  background-color: #FFF;";
    s += "  display: none;";
    s += "}";

    s += "#jbi_filter_iconsitems{";
    s += "  position: absolute;";
    s += "  left: 0px;";
    s += "  right: 0px;";
    s += "  top: 0px;";
    s += "  height: 24px;";
    s += "  background-color: #F0F0F0;";
    s += "  text-align: right;";
    s += "  border-left: 1px solid lightgrey;";
    s += "  border-top: 1px solid lightgrey;";
    s += "  border-right: 1px solid lightgrey;";
    s += "  display: " + cfg.pFilterIconsEnabled + ";";
    s += "}";

    s += "#jbi_footer{";
    s += "  background-color: " + cfg.pFooterBackgroundColor + ";";
    s += "  position: absolute;";
    s += "  bottom: 0;";
    s += "  left: 0;";
    s += "  right: 0;";
    s += "  height: " + cfg.pFooterHeightPixels + "px;";
    s += "}";


    /** Header specific **/
    s += "#jbi_headerTitle{";
    s += "  line-height: " + cfg.pHeaderHeightPixels + "px;";
    s += "  font-size: " + cfg.pHeaderFontSizePixels + "px;";
    s += "  font-family: Futura, 'Trebuchet MS', Arial, sans-serif;";
    s += "  font-weight: bold;";
    s += "  overflow: hidden;";
    s += "  text-align:left;";
    s += "  position:absolute;";
    s += "  left: " + cfg.pHeaderTitleXPosition + "px;";
    s += "  top: " + cfg.pHeaderTitleYPosition + "px;";
    s += "}";
    s += "#jbi_headerLogo{";
    s += "  width: " + cfg.pHeaderLogoWidthPixels + "px;";
    s += "  height: " + cfg.pHeaderLogoHeightPixels + "px;";
    s += "  position:absolute;";
    s += "  top: " + cfg.pHeaderLogoYPosition + "px;";
    s += "  left: " + cfg.pHeaderLogoXPosition + "px;";
    s += "  display: " + cfg.pHeaderLogoEnabled + ";";
    s += "}";
    s += "#jbi_pdf{";
    s += "  display: " + cfg.pPdfEnabled + ";";
    s += "  position: absolute;";
    s += "  color: " + cfg.pPdfFontColor + ";";
    s += "  font-size: " + cfg.pPdfFontSize + ";";
    s += "  top: " + cfg.pPdfPositionTop;
    s += "  right: " + cfg.pPdfPositionRight + ";";
    s += "  bottom: " + cfg.pPdfPositionBottom + ";";
    s += "  left: " + cfg.pPdfPositionLeft + ";";
    s += "}";

    /** Menu specific **/
    s += "#jbi_menu nav {";
    s += "  overflow: hidden;";
    s += "  text-align: left;";
    s += "}";

    s += "#jbi_menu nav > ul {";
    s += "  list-style-type: none;";
    s += "  display: inline-block;";
    s += "  margin: 0;";
    s += "  padding: 0;";
    s += "}";

    s += "#jbi_menu nav > ul > li {";
    s += "  display: inline-block;";
    s += "  border-right-width: 1px;";
    s += "  border-right-color: lightgrey;";
    s += "  border-right-style: none;";
    s += "}";

    s += "#jbi_menu > nav > ul > li .menuActive{";
    s += "  background-color: " + cfg.pMenuItemBackgroundSelected + "  !important;";
    s += "  color: " + cfg.pMenuItemTextSelected + " !important;";
    s += "  cursor: default;";
    s += "}";

    s += "#jbi_menu nav > ul > li > a {";
    s += "  padding-left: 15px;";
    s += "  padding-right: 15px;";
    s += "  background-color: " + cfg.pMenuItemBackgroundUnselected + ";";
    s += "  color: " + cfg.pMenuItemTextUnselected + ";";
    s += "  display: block;";
    s += "  font-size: " + cfg.pMenuItemFontSize + "px;";
    s += "  font-weight: 500;";
    s += "  height: " + cfg.pMenuHorizontalMenuHeightPixels + "px;";
    s += "  line-height: " + cfg.pMenuHorizontalMenuHeightPixels + "px;";
    s += "  text-decoration: none;";
    s += "  font-family : " + cfg.pDashboardFontFamily + ";";
    s += "  -webkit-user-select: none;";
    s += "  -moz-user-select: none;";
    s += "  -ms-user-select: none;";
    s += "}";
    if (!my.isMobile) {
      s += "#jbi_menu nav > ul > li > a:not(.menuActive):hover {";
      s += "  cursor: pointer;";
      s += "  background-color: " + cfg.pMenuItemBackgroundHover + ";";
      s += "  color: " + cfg.pMenuItemTextHover + ";";
      s += "}";
    }
    s += "#jbi_menu > nav > ul > li > a > i{";
    s += "  display : " + cfg.pMenuItemIconDisplay + ";";
    s += "}";


    /** Filter Icons and Content specific **/
    s += "#jbi_filter_iconsitems .filterActive{";
    s += "  background-color: white;";
    s += "}";

    s += "#jbi_filter_iconsitems > ul{";
    s += "  list-style-type: none;";
    s += "  margin: 0;";
    s += "  padding: 0;";
    s += "  display: inline;";
    s += "}";

    s += "#jbi_filter_iconsitems > ul > li{";
    s += "  display: inline-block;";
    s += "  width: 24px;";
    s += "  height: 24px;";
    s += "  line-height: 24px;";
    s += "  text-align: center;";
    s += "  font-size: 16px;";
    s += "  padding-left: 3px;";
    s += "  padding-right: 3px;";
    s += "  cursor: pointer;";
    s += "}";
    if (!my.isMobile) {
      s += "#jbi_filter_iconsitems > ul > li:hover{";
      s += "  background-color: white;";
      s += "}";
    }
    s += "#jbi_content{";
    s += "  position: absolute;";
    s += "  bottom: " + cfg.pFooterHeightPixels + "px;";
    s += "  left :0px;";
    s += "  top : 26px;";
    s += "  right: 0;";
    s += "  overflow: auto;";
    s += "}";


    /** Top Filter Pane (top of report) specific **/
    s += "#jbi_filter_toppane .click-nav{";
    s += "  display: inline-block;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav ul{";
    s += "  position:relative;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav ul .clicker{";
    s += "  color : " + cfg.pFilterTopPaneDropdownSelectedFontColor + ";";
    s += "  height: " + cfg.pFilterTopPaneDropdownHeightPixels + "px;";
    s += "  line-height: " + cfg.pFilterTopPaneDropdownHeightPixels + "px;";
    s += "  text-align: center;";
    s += "  font-family: " + cfg.pDashboardFontFamily + ";";
    s += "  font-weight: " + cfg.pFilterTopPaneDropdownSelectedFontWeight + ";";
    s += "  font-size : " + cfg.pFilterTopPaneDropdownSelectedFontSizePixels + "px;";
    s += "  background-color: " + cfg.pFilterTopPaneDropdownSelectedBackgroundColor + ";";
    s += "  white-space: nowrap;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav ul li span{";
    s += "  padding-left: 5px;";
    s += "  padding-right: 20px;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav ul li{";
    s += "  position:relative;";
    s += "  list-style:none;";
    s += "  cursor:pointer;";
    s += "  border-style: solid;";
    s += "  border-color: " + cfg.pFilterTopPaneDropdownBorderColor + ";";
    s += "  border-width: " + cfg.pFilterTopPaneDropdownBorderWidth + "px;";
    s += "}";
    if (!my.isMobile) {
      s += "#jbi_filter_toppane .click-nav ul .clicker:hover,";
      s += "#jbi_filterpane .click-nav ul .active {";
      s += "  background:" + cfg.pFilterTopPaneDropdownHoverBackgroundColor + ";";
      s += "  color:" + cfg.pFilterTopPaneDropdownHoverFontColor + ";";
      s += "}";
    }
    s += "#jbi_filter_toppane .click-nav ul li span{";
    s += "  display:block;";
    s += "  line-height:40px;";
    s += "  background: " + cfg.pFilterTopPaneDropdownItemBackgroundColor + ";";
    s += "  color:#333;";
    s += "  text-decoration:none;";
    s += "  font-size: 11px;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav ul li ul {";
    s += "  position:absolute;;";
    s += "  z-index: 999999;";
    s += "  padding:0;";
    s += "  text-align : left;";
    s += "  border-style: solid;";
    s += "  border-color: " + cfg.pFilterTopPaneDropdownBorderColor + ";";
    s += "  border-width: " + cfg.pFilterTopPaneDropdownBorderWidth + "px;";
    s += "  display: table;";
    s += "  left: -2px;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav ul li ul li {";
    s += "  border: none;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav ul li ul li span{";
    s += "  padding-left: 10px;";
    s += "  font-family: " + cfg.pDashboardFontFamily + ";";
    s += "  font-size: " + cfg.pFilterTopPaneDropdownItemFontSizePixels + "px;";
    s += "  color:  " + cfg.pFilterTopPaneDropdownItemFontColor + ";";
    s += "  white-space: pre;";
    s += "  overflow: hidden;";
    s += "  text-overflow: ellipsis;";
    s += "}";
    if (!my.isMobile) {
      s += "#jbi_filter_toppane .click-nav ul li span:hover {";
      s += "  background:" + cfg.pFilterTopPaneDropdownItemHoverBackgroundColor + ";";
      s += "  color:" + cfg.pFilterTopPaneDropdownItemHoverFontColor + ";";
      s += "}";
    }
    s += "#jbi_filter_toppane .click-nav .no-js{";
    s += "  padding:0;margin:0;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav .js{";
    s += "  padding:0;margin:0;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav .no-js ul {";
    s += "  display:none;";
    s += "}";
    if (!my.isMobile) {
      s += "#jbi_filter_toppane .click-nav .no-js:hover ul{ ";
      s += "  display:table;";
      s += "}";
    }
    s += "#jbi_filter_toppane .click-nav ul li i {";
    s += "  text-align: right;";
    s += "  right: 7px;";
    s += "  position: absolute;";
    s += "  line-height: 30px;";
    s += "}";

    s += "#jbi_filter_toppane .click-nav ul li ul li.filterDisabled span{";
    s += "  color: " + cfg.pFilterTopPaneDropdownItemDisabledFontColor + ";";
    s += "  background-color: " + cfg.pFilterTopPaneDropdownItemDisabledBackgroundColor + ";";
    s += "  cursor: default;";
    s += "}";

    // Business hierarchy
    s += "#jbi_businesses_wrapper {";
    s += "top: 70px;";
    s += "bottom: 0;";
    s += "position: absolute;";
    s += "border-right: " + cfg.pFilterLeftPaneBorderRight + ";";
    s += "width: " + cfg.pFilterLeftPaneWidthPixels + "px;";
    s += "font-family: " + cfg.pDashboardFontFamily + ";";
    s += "font-size: 12px;";
    //s += "overflow: hidden;";
    //s += "overflow-y: auto;";
    s += "}";

    s += "#jbi_businesses {";
    s += "top: 0px;";

    if (!my.isMobile) {
      s += "bottom: 0px;";
    } else {
      s += "bottom: 50px;";
    }
    s += "position: absolute;";
    s += "width: " + cfg.pFilterLeftPaneWidthPixels + "px;";
    s += "overflow: hidden;";
    s += "overflow-y: auto;";
    s += "}";

    s += "#jbi_businesses > ul {";
    s += "  display: " + cfg.pFilterLeftPaneEnabled + ";";
    s += "}";

    // Container settings
    s += ".containerContent .message-placeholder{";
    s += "  display: table;";
    s += "  width: 100%;";
    s += "  height: 100%;";
    s += "  min-height: 100px;";
    s += "}";
    s += ".containerContent .message{";
    s += "  display:table-cell;";
    s += "  vertical-align: middle;";
    s += "  font-family: " + cfg.pDashboardFontFamily + ";";
    s += "  font-size: " + cfg.pContainerMessageFontSizePixels + "px;";
    s += "  text-align: center;";
    s += "  color: " + cfg.pContainerMessageDefaultFontColor + ";";
    s += "}";
    s += ".containerContent .message.error{";
    s += "    color: " + cfg.pContainerMessageErrorFontColor+ "!important;";
    s += "}";
    s += ".containerContent .message.warning{";
    s += "    color: " + cfg.pContainerMessageWarningFontColor + "!important;";
    s += "}";
    s += ".container-footer{";
    s += "    margin: 1px 2px 1px; 2px";
    s += "    height: " + cfg.pContainerFooterHeightPixels + "px;";
    s += "    line-height: " + cfg.pContainerFooterHeightPixels + "px;";
    s += "    position: relative;";
    s += "    overflow: auto;";
    s += "    font-family: " + cfg.pDashboardFontFamily + ";";
    s += "    border: 1px solid #D8D8D8;";
    s += "    padding-left: 6px;";
    s += "    font-style: italic;";
    s += "    background-color: " + cfg.pContainerFooterBackgroundColor + ";";
    s += "    color: " + cfg.pContainerFooterFontColor + ";";
    s += "    font-size: " + cfg.pContainerFooterFontSizePixels + "px;";
    s += "}";
    s += ".container-title{";
    s += "    left: 0;";
    s += "    right: 0;";
    s += "    top: 0;";
    s += "    height: " + cfg.pContainerTitleHeightPixels + "px;";
    s += "    line-height: " + + cfg.pContainerTitleHeightPixels + "px;";
    s += "    position: relative;";
    s += "    background-color: " + cfg.pContainerTitleBackgroundColor + ";";
    s += "    color: " + cfg.pContainerTitleFontColor + ";";
    s += "    font-size: " + cfg.pContainerTitleFontSizePixels + "px;";
    s += "    padding-left : 5px;";
    s += "    font-family: " + cfg.pDashboardFontFamily + ";";
    s += "    text-align:" + cfg.pContainerTitleTextAlign + ";";
    s += "    font-weight:" + cfg.pContainerTitleFontWeight + ";";
    s += "}";
    s += ".container-content-box{";
    s += "   position: relative;";
    s += "   border-style: " + cfg.pContainerBorderStyle + ";";
    s += "   border-width: " + cfg.pContainerBorderWidthPixels + "px;";
    s += "   border-color: " + cfg.pContainerBorderColor + ";";
    s += "}";

    /** hide the layout border in case the filter icon is not required **/
    if (cfg.pFilterIconsEnabled === "none") {
      s += ".layoutContent{";
      s += "  border: 0px solid white !important;";
      s += "}";
    }


    /** Overall **/
    s += ".customtable p {";
    s += "  margin: 0;";
    s += "  padding: 0;";
    s += "}";
    s += ".containerComment p{";
    s += "  margin: 0;";
    s += "  padding: 0;";
    s += "}";
    s += "#jbi_comment_text p{";
    s += "  margin: 0;";
    s += "  padding: 0;";
    s += "}";
    s += ".containerContent p{";
    s += "  margin: 0;";
    s += "  padding: 0;";
    s += "}";

    s += ".ui-jqgrid > .ui-jqgrid-view {";
    s += "  font-family : " + cfg.pDashboardFontFamily  + "!important;";
    s += "}";

    if (my.isMobile) {
      s += "body {";
    } else {
      s += ".noselect {";
    }
    s += "  -webkit-touch-callout: none;";
    s += "  -webkit-user-select: none;";
    s += "  -khtml-user-select: none;";
    s += "  -moz-user-select: none;";
    s += "  -ms-user-select: none;";
    s += "  user-select: none;";
    s += "}";
    s += "svg{";
    s += "overflow:visible !important;";
    s += "}";
    s += ".highcharts-container{";
    s += "overflow:visible !important;";
    s += "}";



    s += "</style>";


    // Add the CSS to the head of the HTML page
    $(s).appendTo("head");
  }


  function setHTML(elementId, cfg) {

    // check if the period is known
    var customConfig = $("body").data("customConfig"),
      periodName = "";
    if (customConfig.CONFIG && customConfig.CONFIG.period && customConfig.CONFIG.period.long) {
      periodName = customConfig.CONFIG.period.long;
    }

//@formatter:off
        var s = "";
        s += "<div id=\"jbi_container\">";
          s += "<div id=\"jbi_app\">";
            s += "<div id=\"jbi_header\">";
              s += "<img id='jbi_headerLogo' src='" + shell.app.execdb.dashboard._getLogoBase64() + "'>";
              s += "<div id=\"jbi_headerTitle\">" + cfg.pHeaderTitle + "</div>";
            s += "</div>";
            s += "<div id=\"jbi_pdf\"></div>";
            s += "<div id=\"jbi_menu\"></div>";
            s += "<div id=\"jbi_period\">" + periodName + "</div>";
            if (cfg.pHeaderSubTitleEnabled) {
                s += "<div id=\"jbi_sub_title\">" + cfg.pHeaderSubTitleContent + "</div>";
            }
            s += "<div id=\"jbi_businesses_wrapper\">";
              s += "<div id=\"jbi_businesses\"></div>";
            s += "</div>";
            s += "<div id=\"jbi_filter_icons\">";
              s += "<div id=\"jbi_filter_iconsitems\"><ul id='jbi_filter_8'><li class=\"filterActive\"><i class=\"fa fa-server\"></i></li><li><i class=\"fa fa-bar-chart\"></i></li><li><i class=\"fa fa-table\"></i></li></ul><ul id='jbi_filter_9'><li class=\"filterActive\"><i class=\"fa fa-server\"></i></li><li><i class=\"fa fa-bar-chart\"></i></li><li><i class=\"fa fa-table\"></i></li></ul></div>";
              s += "<div id=\"jbi_content\"></div>";
            s += "</div>";
            s += "<div id=\"jbi_filter_toppane\"></div>";
            s += "<div id=\"jbi_comment\"></div>";
            s += "<div id=\"jbi_footer\"></div>";
          s += "</div>";
        s += "</div>";
//@formatter:on
    $("#" + elementId).html(s);
  }

  return my;

}(shell.app.execdb.dashboard));
