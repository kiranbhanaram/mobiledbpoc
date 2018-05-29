shell.app.execdblp.offlinereader = ( function (my) {

  my.addGlossary = function () {

    _addCSS();
    _addEventHandlers();


    function _addCSS() {
      //@formatter:0ff
      var s = "";
      s += "<style type='text/css' id='CSS_GLOSSARY' data-repstyle='execdblp'>";
      s += "#jbi_glossary {";
      s += "  position: absolute;";
      s += "  top: 0;";
      s += "  bottom: 0;";
      s += "  left: 0;";
      s += "  right: 0;";
      s += "  background-color: white;";
      s += "  z-index: 100;";
      s += "}";
      s += "#jbi_glossary .jbi_header {";
      s += "  position: relative;";
      s += "  display: block;";
      s += "  height: 35px;";
      s += "}";
      s += "#jbi_glossary .jbi_header_logo {";
      s += "  width: 50px;";
      s += "  height: 50px;";
      s += "  position: absolute;";
      s += "  top: 0px;";
      s += "  left: 4px;";
      s += "}";
      s += "#jbi_glossary .jbi_header_title {";
      s += "  position: absolute;";
      s += "  display: inline-block;";
      s += "  line-height: 35px;";
      s += "  color: #dd1d21;";
      s += "  font-family: Futura, 'Trebuchet MS', Arial, sans-serif;";
      s += "  font-size: 14px;";
      s += "  font-weight: bold;";
      s += "  left: 70px;";
      s += "  top: 0px;";
      s += "  text-transform: uppercase;";
      s += "}";
      s += "#jbi_glossary .jbi_header_subtitle {";
      s += "  position: absolute;";
      s += "  font-family: tahoma;";
      s += "  left: 70px;";
      s += "  top: 24px;";
      s += "  color: #dd1d21;";
      s += "  font-size: 11px;";
      s += "}";
      s += "#jbi_glossary_close {";
      s += "  height: 50px;";
      s += "  width: 50px;";
      s += "  float: right;";
      s += "  cursor: pointer;";
      s += "  margin-top: 5px;";
      s += "  text-align: center;";
      s += "}";
      s += ".jbi_glossary_content {";
      s += "  position: absolute;";
      s += "  top: 60px;";
      s += "  left: 10px;";
      s += "  right: 10px;";
      s += "  bottom: 10px;";
      s += "  border: 1px solid lightgrey;";
      s += "  box-sizing: border-box;";
      s += "  font-family: Verdana, Geneva, sans-serif;";
      s += "  font-size: 12px;";
      s += "  text-align: justify;";
      s += "  color: #404040;";
      s += "  overflow: auto;";
      s += "  padding: 20px;";
      s += "  padding-top: 0px;";
      s += "}";

      s += "#jbi_glossary_content ul {";
      s += "  margin-top: -10px;";
      s += "}";

      s += "#jbi_glossary_content .title {";
      s += "  font-weight: bold;";
      s += "  margin-top: 30px;";
      s += "}";

      s += "#jbi_glossary_content .subtitle {";
      s += "  margin-top: 20px;";
      s += "  margin-bottom: 0px;";
      s += "  font-style: italic;";
      s += "}";


      s += "#jbi_glossary_content p {";
      s += "  margin-top: 5px;";
      s += "  text-align: justify;";
      s += "}";

//@formatter:on
      s += "</style>";
      $(s).appendTo("head");

    }


    function _addEventHandlers() {
      var $glossary = $("#jbi_header_glossary");
      $glossary.unbind(my.eventTrigger);
      $glossary.on(my.eventTrigger, function () {
        my.addGlossaryWindow();
      });
    }
  };

  my.addGlossaryWindow = function() {
    _addHTML();
    _addEventHandlers();


    function _addHTML() {
      var $jbi_app_lp = $("#jbi_app");

//@formatter:0ff
      var svgClose = '<svg style="width:40px;height:40px;" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1225 1079l-146 146q-10 10-23 10t-23-10l-137-137-137 137q-10 10-23 10t-23-10l-146-146q-10-10-10-23t10-23l137-137-137-137q-10-10-10-23t10-23l146-146q10-10 23-10t23 10l137 137 137-137q10-10 23-10t23 10l146 146q10 10 10 23t-10 23l-137 137 137 137q10 10 10 23t-10 23zm215-183q0-148-73-273t-198-198-273-73-273 73-198 198-73 273 73 273 198 198 273 73 273-73 198-198 73-273zm224 0q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"/></svg>'
      var s = "";
      s += "<div id='jbi_glossary'>";
      s += "<div class='jbi_header'>";
      s += '<img class="jbi_header_logo" src="' + my._getLogoBase64() + '">';
      s += '<div class="jbi_header_title">Executive Dashboarding - Glossary</div>';
      s += '<div id="jbi_glossary_close">' + svgClose + '</div>';
      s += "</div>";
      s += "<div class='jbi_glossary_content' id='jbi_glossary_content'>";

      s += "<div class='title'>A. Earnings on a current cost of supplies basis attributable to shareholders</div>";
      s += "<p>Segment earnings are presented on a current cost of supplies basis (CCS earnings), which is the earnings measure used";
      s += " by the Chief Executive Officer for the purposes of making decisions about allocating resources and assessing";
      s += " performance. On this basis, the purchase price of volumes sold during the period is based on the current cost of";
      s += " supplies during the same period after making allowance for the tax effect. CCS earnings therefore exclude the effect";
      s += " of changes in the oil price on inventory carrying amounts. Sales between segments are based on prices generally";
      s += " equivalent to commercially available prices.</p>";

      s += "<p>CCS earnings attributable to Royal Dutch Shell plc shareholders excludes the non-controlling interest share of CCS";
      s += " earnings.</p>";

      s += "<div class='title'>B. Identified items</div>";
      s += "<p>Identified items comprise: divestment gains and losses, impairments, fair value accounting of commodity derivatives";
      s += " and certain gas contracts, redundancy and restructuring, the impact of exchange rate movements on certain deferred tax";
      s += " balances, and other items. These items, either individually or collectively, can cause volatility to net income, in";
      s += " some cases driven by external factors, which may hinder the comparative understanding of Shell’s financial results";
      s += " from period to period.</p>";

      s += "<p>The categories above represent the nature of the items identified irrespective of whether the items relate to Shell";
      s += " subsidiaries or joint ventures and associates. The after-tax impact of identified items of joint ventures and";
      s += " associates is fully reported within “Share of profit and joint ventures and associates” on the Consolidated Statement";
      s += " of Income. Identified items related to subsidiaries are consolidated and reported across appropriate lines of the";
      s += " Consolidated Statement of Income. Only pre-tax identified items reported by subsidiaries are taken into account in the";
      s += " calculation of “underlying operating expenses” (Definition F).</p>";

      s += "<p>Fair value accounting of commodity derivatives and certain gas contracts: In the ordinary course of business, Shell";
      s += "enters into contracts to supply or purchase oil and gas products as well as power and environmental products.";
      s += " Derivative contracts are entered into for mitigation of resulting economic exposures (generally price exposure) and";
      s += " these derivative contracts are carried at period-end market price (fair value), with movements in fair value";
      s += " recognised in income for the period. Supply and purchase contracts entered into for operational purposes are, by";
      s += " contrast, recognised when the transaction occurs (see also below); furthermore, inventory is carried at historical";
      s += " cost or net realisable value, whichever is lower. As a consequence, accounting mismatches occur because: (a) the";
      s += " supply or purchase transaction is recognised in a different period; or (b) the inventory is measured on a different";
      s += " basis. In addition, certain UK gas contracts held by Upstream are, due to pricing or delivery conditions, deemed to";
      s += " contain embedded derivatives or written options and are also required to be carried at fair value even though they are";
      s += " entered into for operational purposes. The accounting impacts of the aforementioned are reported as identified";
      s += "items.</p>";

      s += "<p>Impacts of exchange rate movements on tax balances represent the impact on tax balances of exchange rate movements";
      s += " arising on (a) the conversion to dollars of the local currency tax base of non-monetary assets and liabilities, as";
      s += " well as losses (this primarily impacts the Integrated Gas and Upstream segments) and (b) the conversion of";
      s += " dollar-denominated inter-segment loans to local currency, leading to taxable exchange rate gains or losses (this";
      s += " primarily impacts the Corporate segment).</p>";

      s += "<p>Other identified items represent other credits or charges Shell’s management assesses should be excluded to provide";
      s += " additional insight, such as certain provisions for onerous contracts or litigation.</p>";

      s += "<div class='title'>C. Free cash flow</div>";
      s += "<p>Free cash flow is used to evaluate cash available for financing activities, including dividend payments, after";
      s += " investment in maintaining and growing our business. It is defined as the sum of “Cash flow from operating activities”";
      s += " and “Cash flow from investing activities”.</p>";

      s += "<div class='title'>D. Capital investment</div>";
      s += "<p>Capital investment is a measure used to make decisions about allocating resources and assessing performance. It";
      s += " comprises capital expenditure, exploration expense excluding well write-offs, new investments in joint ventures and";
      s += " associates, new finance leases and investments in Integrated Gas, Upstream and Downstream securities, all of which on";
      s += " an accruals basis. In 2016, it also included the capital investment related to the acquisition of BG Group plc.</p>";

      s += "<p>Organic capital investment includes capital expenditure and new finance leases of existing subsidiaries, investments";
      s += " in existing joint ventures and associates, and exploration expense (excluding well write-offs).</p>";

      s += "<p>Inorganic capital investment includes investments related to the acquisition of businesses, investments in new joint";
      s += " ventures and associates, and new acreage.</p>";

      s += "<div class='title'>E. Divestments</div>";
      s += " <p>Divestments is a measure used to monitor the progress of Shell’s divestment programme. This measure comprises";
      s += " proceeds from sale of property, plant and equipment and businesses, joint ventures and associates, and other";
      s += " Integrated Gas, Upstream and Downstream investments, reported in “Cash flow from investing activities”, adjusted onto";
      s += " an accruals basis and for any share consideration received or contingent consideration recognised upon divestment, as";
      s += " well as proceeds from the sale of interests in entities while retaining control (for example, proceeds from sale of";
      s += " interest in Shell Midstream Partners, L.P.), which are included in “Change in non-controlling interest” within “Cash";
      s += " flow from financing activities”.</p>";

      s += "<div class='title'>F. Operating expenses</div>";
      s += "<p>Operating expenses is a measure of Shell’s total operating expenses performance, comprising the following items from";
      s += " the Consolidated Statement of Income: production and manufacturing expenses; selling, distribution and administrative";
      s += " expenses; and research and development expenses.</p>";
      s += "<p>Underlying operating expenses measures Shell’s total operating expenses performance excluding identified items.</p>";

      s += "<div class='title'>G. Return on average capital employed</div>";
      s += "<p>Return on average capital employed (ROACE) measures the efficiency of Shell’s utilisation of the capital that it";
      s += " employs. In this calculation, ROACE on a CCS basis excluding identified items is defined as the sum of CCS earnings";
      s += " attributable to shareholders excluding identified items for the current and previous three quarters, as a percentage";
      s += " of the average capital employed for the same period. Capital employed consists of total equity, current debt and";
      s += " non-current debt.</p>";

      s += "<div class='title'>H. Downstream Availability Metric</div>";
      s += "<p class='subtitle'>(i) Utilisation</p>";
      s += "<p>The percentage of the annual business plan rated capacity actually used in a specified timeframe. Utilization";
      s += " incorporates the effects of all shutdown and slowdown incidents that affect throughput at a location, regardless of";
      s += " origin. As rated capacity does not define a hard limit on utilisation, there may be occasions in which utilisation";
      s += " exceeds 100% for a particular unit.</p>";
      s += "<p>Note: Utilization >100%: Normally, the summation of Utilization, Under Utilization, Unplanned Downtime Controllable,";
      s += "  Unplanned Downtime Uncontrollable and Planned Downtime, should equal the rated capacity each month. Under certain";
      s += " circumstances where a unit operates at optimum performance, the actual Utilization of a unit can exceed the rated";
      s += " capacity of that unit. This would cause the summation of these categories to exceed the total rated capacity of the";
      s += " site and therefore the sum may exceed 100%. This scenario is expected to occur only on few days during the month,";
      s += "  however if a unit appears to continually run above 100% it would lead to a review of the rated capacity for the next";
      s += " year’s business plan. The underlying business measure/objective is to maximize economic utilization of sites and hence";
      s += " in scenarios where it makes economic sense to run assets harder the site would run at greater than rated capacity to";
      s += " realize maximum benefit.</p>";

      s += "<p class='subtitle'>(ii) Uneconomic</p>";
      s += "<p>The percentage of rated capacity that a site does not use as a result of optimizing the utilization of the available";
      s += " capacity.</p>";
      s += "<p>Reasons for not utilizing the available capacity include (list not exhaustive):</p>";
      s += "<ul>";
      s += "<li>Economics (negative processing margin)</li>";
      s += "<li>Feed quality considerations</li>";
      s += "<li>Product demand (seasonality)</li>";
      s += "<li>Inherent design mismatch in the sizing of units</li>";
      s += "<li>Turnaround timing of upstream/downstream units, etc.</li>";
      s += "</ul>";

      s += "<p class='subtitle'>(iii) Unplanned Downtime Controllable</p>";
      s += "<p>The percentage of rated capacity that is lost due to controllable unplanned events.</p>";
      s += "<p>Controllable unplanned events are unexpected shutdowns or slowdowns:</p>";
      s += "<ul>";
      s += "<li>Not included in the current year business plan as planned downtime</li>";
      s += "<li>Not due to Under Utilization as defined above</li>";
      s += "<li>Not due to abnormal events outside the control of the location and/or the corporation (abnormal weather events,";
      s += " non-site/Shell related labor strikes, regional power outages, etc.)";
      s += "</li>";
      s += "</ul>";

      s += "<p class='subtitle'>(iv) Unplanned Downtime Uncontrollable</p>";
      s += "<p>The percentage of rated capacity that is lost due to uncontrollable unplanned events.</p>";
      s += "<p>Uncontrollable Unplanned events are unexpected shutdowns or slowdowns due to abnormal events that account for at";
      s += "  least 1% of the site’s monthly rated capacity. Approval is required before events are categorized as uncontrollable";
      s += " unplanned downtime and if not approved will be classified as controllable unplanned downtime.</p>";
      s += "<p>Common events that may be approved as uncontrollable include (list not exhaustive):</p>";
      s += "<ul>";
      s += "<li>Power outages to a region</li>";
      s += "<li>Unusual weather or acts of nature, only if truly unavoidable (hurricane/typhoon/earthquakes)</li>";
      s += "<li>Regional/national labor strife where the site and company have no influence</li>";
      s += "</ul>";

      s += "<p class='subtitle'>(v) Planned Downtime</p>";
      s += "<p>The percentage of rated capacity that is lost due to shutdown, turnaround, or slowdown activities that are included";
      s += " in the annual business plan.</p>";

      s += "<p class='subtitle'>(vi) Availability</p>";
      s += "<p>The availability of a site is defined as the portion of capacity that was not lost due to planned or unplanned";
      s += " events. This defines a site’s capability to run without any economic slowdowns or shutdowns. The underlying business";
      s += " measure/objective is to drive improvement in reliability of a site (i.e. reduce UPDT and PDT) hence availability being";
      s += " defined as fixed at 100% leaving only the PDT & UPDT as the variable/controllable elements.</p>";

      s += "<p>Availability Internal reporting = 100% - Planned Downtime% - UPDT Controllable%</p>";

      s += "<p>Availability External reporting = 100% - Planned Downtime% - UPDT Controllable% - UPDT Uncontrollable%</p>";

      s += "</div>";
      s += "</div>";
//@formatter:on

      $jbi_app_lp.append(s);
      $jbi_app_lp.show();
    }


    function _addEventHandlers() {

      // Close the settings window
      var $jbi_glossary_close = $("#jbi_glossary_close");
      $jbi_glossary_close.unbind(my.eventTrigger);
      $jbi_glossary_close.on(my.eventTrigger, function () {
        var $jbi_glossary = $("#jbi_glossary");
        $jbi_glossary.hide();
        $jbi_glossary.remove();
      });
    }
  };


  return my;
}(shell.app.execdblp.offlinereader || {}));
