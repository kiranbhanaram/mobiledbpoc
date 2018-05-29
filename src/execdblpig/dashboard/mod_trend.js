shell.app.execdblp.dashboard = ( function (my) {

  my._buildTrend = function () {
    addHTML();

    function addHTML() {
      var configTrendContainers = getConfigTrend();
      if (!configTrendContainers) {
        return;
      }

      // create a placeholder for the entire section
      $("#jbi_trend").html("<div id='jbi_trend_chart'></div>");


      // create the HTML for the trend section
      for (var i = 0; i < configTrendContainers.length; i++) {
        addContainerContent(configTrendContainers[i], i);
      }
    }

    function addContainerContent(config, i) {

      // get the kpi data
      var $body = $("body"),
        customData = $body.data("customDataApp"),
        customConfig = $body.data("customConfig");

      if (!customData || !customData.datasets || !customData.datasets[config.business]) {
        return;
      }

      var businessData = customData.datasets[config.business],
        containerConfig = customConfig[config.config],
        containerContentDOMId = "jbi_trend_chart_" + ( i + 1 ),
        dataIds = config.data.split(";"),
        containerText = "",
        $jbiTrendChart = $("#jbi_trend_chart");

      // check if data is available
      if (!businessData || !businessData.kpis) {
        $jbiTrendChart.html("<div style='padding:10px;box-sizing: border-box;width:100%;height:100%;'><div class='message-placeholder'><div class='message'>No data available.</div></div></div>")
        return;
      }

      dataIds.forEach(function (id) {
        if (containerText !== "") {
          containerText += " and ";
        }
        if (businessData.kpis[id]) {
          containerText += businessData.kpis[id].text;
        }
      });


      var s = "";
//@formatter:off
      s += "<div class='jbi_trend_chart'>";
      s += "<div class='jbi_trend_chart_item'>";
      s += "<div class='jbi_trend_chart_container' id='" + containerContentDOMId + "Content'></div>";
      s += "<div class='jbi_trend_chart_title'>" + containerText + "</div>";
      s += "</div>";
      s += "</div>";
//@formatter:on

      $jbiTrendChart.append(s);

      my._createChart(
        containerContentDOMId,
        containerConfig.chart,
        config.data,
        businessData
      );

    }


    // HELPER FUNCTIONS

    /**
     * Get the trend specific configuration
     * @returns {object} the configuration settings
     */
    function getConfigTrend() {
      var customConfig = $("body").data("customConfig");
      if (!customConfig
        || !customConfig["TREND"]) {
        return null;
      }
      return customConfig["TREND"];
    }

    /**
     * Get the base64 image for the trend icon
     * @param direction {string} Either up or down
     * @returns {string} The base64 representation of the image
     */
    function getTrendIcon(direction) {
      if (direction === "up") {
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAACXBIWXMAABJ0AAASdAHeZh94AAACR0lEQVRIS62WzUtUURiHZ9SkReXGhVGMi8hE/AAXbduEtBAXQrUJwmgjuWgjDEStMmj+hcxZaBoRgqAgUhG0qAjRxWwKUZpKqUyQibRG7vS8t98UwzlO4zgPPJ7zfp073nsZJlIKQRAcyeVycdZRfIVTeINcs1rKgwOiHJRkzengXjyBx0nFWLtwTPUFliqNlgZDVzR8leWg0l6oH8Cz9H5nfYRRlXaH5nF8o7BkOLyKuQS+xsNKu1CcwPsKy4L5flxWWAiF6/hC4b7gnDv4WOE/SAbaVgRu33OOPKcwvMAsyfMKC6C2gl8wjW9xEV/iM5zBad/DJt+KaYXhVQ3vW0FjI57EU9iCbdiBTThvg2p1oP6Ucsw2NjyhfMkw8xCT+E4pB2o9OGybEWxX/r/wyexVncRxi1k/hAUP9l9Q37CmBTymfFF0gTl8oJTNf9LWgf5D1LesKUtQr3xR6LUHfk9hCPGqtl6oB/YnzUUalNsV+lKYUPgXcmvaOnBuLfWsNT0hiCnvhZ4leuIKC6D2WVsHu0PUM9bUh9eUd6C2hgMKHaita+tArRNT+eBjuPFArVtbL9RvaetA7Tb25oOv2BQGFYQzf2obBmdwWmFF4LxBTCr8Awl7ey4o3Bf2wNH/dcNFtrFRYdlwxg/sUFgIBfse+4VdSu0JPnwdsxm8qJQfGo7iKt5lqEbpotBXTX+f3SLW00oXh177pZLQ0E1sYVurcoh67NfLJdzEGXJ7+8WSh+HL+B7tNu7gMmbR+IZDHF6tdg+RyG+AGXPS+E2WXgAAAABJRU5ErkJggg==';
      } else if (direction === "down") {
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAACXBIWXMAABJ0AAASdAHeZh94AAACRUlEQVRIS62Wy0tUYRjGx0sqqBDiiIhEXkIhCIUgcCUIgm4MRHLlplByY7hxqdDGZX9BBBJBGIiguFUhSAQvGzeiLfKWBoWBlxnm+HuPjx4O54zO7YGf3/c+3/u+33ecmW8mkooSiUQjfIQ1OIM9mHMcZ1ApmYkGeWrkMH6BVqiBKFY1Yy0MwQGc4LWrNDVRNAxxCvvggeykIrcBFmCL/DLZyUXiNCwrTEvU9cIZGzXLCorFT4bCjMQm9vrFoUqWJ8wR+K4wK9GnG3YUeuIJTAUKsxabvIcPCl1jBgYU5kQcON9OrdDd5BJKFQbE2i70KwyItXlNfcIfg7e2o73nF+WHipyH5PyGLlk+sb6qqU/kP4Ntm7wj6aX8pNJh/sFzWbfC29TUJ/xiiNnkMzTIv1PkRcH+tU9kuSLe0jQgDudYwjrUyLtX1JSQn2Csl2U9tjUNiLU9+zNNwWN5KYmaUjsho/tEjD/dhRCxdmEnm2TSJi9lUWMXZAyqYF+2T/QuYC1uyXUEX+WnJWqbwG7hY1k+0beetT83gfehCRGJJ3AEh2BN9+EX7MAxnCvVJ/zXMH4TrECnG+RQ9PSekAexK+CvwpyIfoNsMqvwWhhT4F1oWYgNyiD8JWCTH/BGYcaixym8UOgXC+VgX6GTstISdZXU2w+NV7LCRWIhSd9gCZ7KvlPUFJE7ymhqkX2/KOoAe5suQg/FjxjLbY25Na2AVuYTjDFG++rOd4vTFQ3sk22/uewGth8Jdp3YJfkfNgj7lJpEkcgVn89c3ptQCB8AAAAASUVORK5CYII=';
      }
    }

  };


  return my;

}(shell.app.execdblp.dashboard));
