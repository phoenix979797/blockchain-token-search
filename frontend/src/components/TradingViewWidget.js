import React, { useEffect } from "react";

function TradingViewWidget({ symbol = "ETHUSD" }) {
  useEffect(() => {
    const initializeWidget = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          symbol: symbol,
          container_id: "tradingview_widget",
          width: "100%",
          height: 500,
          theme: "light",
          style: "1",
          locale: "en",
          interval: "D",
          timezone: "Etc/UTC",
          withdateranges: true,
          hide_side_toolbar: false,
          allow_symbol_change: true,
        });
      }
    };

    // Check if the script is already present to avoid multiple inclusions
    if (
      !document.querySelector('script[src="https://s3.tradingview.com/tv.js"]')
    ) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = () => initializeWidget();
      document.body.appendChild(script);
    } else {
      // If the script is already present, directly initialize the widget
      initializeWidget();
    }
  }, [symbol]);

  return <div id="tradingview_widget" />;
}

export default TradingViewWidget;
