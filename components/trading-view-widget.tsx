"use client"

import { useRef, useEffect } from "react"

interface TradingViewWidgetProps {
  symbol?: string
  height?: number
}

export const TradingViewWidget = ({ symbol = "COINBASE:ETHUSD", height = 500 }: TradingViewWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Clean up previous widget if it exists
    if (containerRef.current) {
      containerRef.current.innerHTML = ""
    }

    // Create new widget with the selected symbol
    if (typeof window !== "undefined" && window.TradingView) {
      new window.TradingView.widget({
        width: "100%",
        height: height,
        symbol: symbol,
        interval: "1H",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#131722",
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: containerRef.current,
        hide_side_toolbar: false,
        studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
        overrides: {
          "paneProperties.background": "#131722",
          "paneProperties.vertGridProperties.color": "#232323",
          "paneProperties.horzGridProperties.color": "#232323",
          "scalesProperties.textColor": "#AAA",
        },
      })
    }
  }, [symbol, height])

  return <div ref={containerRef} className="w-full" style={{ height: `${height}px` }} />
}

// Extend Window interface for TradingView
declare global {
  interface Window {
    TradingView: any
  }
}
