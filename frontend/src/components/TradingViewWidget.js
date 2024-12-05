import React, { useEffect } from "react";

function TradingViewWidget({ symbol = "WAGDU" }) {
  useEffect(() => {
    const initializeWidget = () => {
      if (window.TradingView) {
        try {
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
        } catch (error) {
          console.error(
            `Symbol "${symbol}" not found. Falling back to "ETHUSD".`
          );
          new window.TradingView.widget({
            symbol: symbol + "_SHORT_VOLUME", // Fallback symbol
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
