// CoinGecko API integration for price data
const COINGECKO_API = "https://api.coingecko.com/api/v3"

export interface PriceData {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_24h: number  
  price_change_percentage_24h: number
  market_cap: number
  volume_24h: number
  image: string
}

export interface HistoricalPrice {
  timestamp: number
  price: number
}

export interface CandlestickData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Token ID mapping for CoinGecko
const TOKEN_ID_MAP: Record<string, string> = {
  ETH: "ethereum",
  BTC: "bitcoin",
  SOL: "solana",
  MATIC: "matic-network",
  AVAX: "avalanche-2",
  BNB: "binancecoin",
  OP: "optimism",
  ARB: "arbitrum",
  IP: "ethereum", // Fallback to ETH for Story Protocol
}

export const priceService = {
  async getTokenPrice(symbol: string): Promise<PriceData | null> {
    try {
      const tokenId = TOKEN_ID_MAP[symbol.toUpperCase()] || symbol.toLowerCase()
      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
      )

      if (!response.ok) throw new Error("Failed to fetch price")

      const data = await response.json()
      const tokenData = data[tokenId]

      if (!tokenData) return null

      return {
        id: tokenId,
        symbol: symbol.toUpperCase(),
        name: tokenId,
        current_price: tokenData.usd,
        price_change_24h: tokenData.usd_24h_change || 0,
        price_change_percentage_24h: tokenData.usd_24h_change || 0,
        market_cap: tokenData.usd_market_cap || 0,
        volume_24h: tokenData.usd_24h_vol || 0,
        image: `https://assets.coingecko.com/coins/images/1/large/${tokenId}.png`,
      }
    } catch (error) {
      console.error("Error fetching token price:", error)
      return null
    }
  },

  async getHistoricalPrices(symbol: string, days = 30): Promise<HistoricalPrice[]> {
    try {
      const tokenId = TOKEN_ID_MAP[symbol.toUpperCase()] || symbol.toLowerCase()
      const response = await fetch(`${COINGECKO_API}/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}`)

      if (!response.ok) throw new Error("Failed to fetch historical prices")

      const data = await response.json()

      return data.prices.map(([timestamp, price]: [number, number]) => ({
        timestamp,
        price,
      }))
    } catch (error) {
      console.error("Error fetching historical prices:", error)
      return []
    }
  },

  async getCandlestickData(symbol: string, days = 30): Promise<CandlestickData[]> {
    try {
      const tokenId = TOKEN_ID_MAP[symbol.toUpperCase()] || symbol.toLowerCase()
      const response = await fetch(`${COINGECKO_API}/coins/${tokenId}/ohlc?vs_currency=usd&days=${days}`)

      if (!response.ok) throw new Error("Failed to fetch OHLC data")

      const data = await response.json()

      return data.map(([timestamp, open, high, low, close]: [number, number, number, number, number]) => ({
        timestamp,
        open,
        high,
        low,
        close,
        volume: 0, // CoinGecko OHLC doesn't include volume
      }))
    } catch (error) {
      console.error("Error fetching candlestick data:", error)
      return []
    }
  },
}
