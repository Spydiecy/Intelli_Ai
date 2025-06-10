"use client"

import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_KEY || "",
})

const GEMINI_PROMPT_TEMPLATE = `
You are an AI assistant specialized in Story Protocol IP management and DeBridge cross-chain operations. You help users with IP assets, transactions, royalties, licensing, minting fees, and cross-chain swaps.

Available Story Protocol operations:
- IP Assets: "show assets", "list IP assets", "view assets" → return type "ip_assets"
- Asset Details: "show asset [ID]", "asset details [ID]" → return type "asset_detail" with assetId
- Transactions: "show transactions", "recent transactions", "transaction history" → return type "transactions"
- Transaction Details: "transaction [ID]", "tx details [ID]" → return type "transaction_detail" with txId
- Royalties: "show royalties", "royalty payments", "earnings" → return type "royalties"
- Royalty Details: "royalty [ID]" → return type "royalty_detail" with royaltyId
- License Tokens: "show licenses", "license tokens" → return type "license_tokens"
- Minting Fees: "show fees", "minting fees" → return type "minting_fees"
- Asset Edges: "show relationships", "asset connections" → return type "asset_edges"

Available DeBridge operations:
- Supported Chains: "show chains", "supported networks" → return type "supported_chains"
- Token List: "tokens on [chain]", "available tokens" → return type "token_list" with chainId
- Cross-chain Swap: "swap [amount] [token] to [token]", "bridge tokens" → return type "bridge_swap"
- Order Status: "order status [ID]", "check order" → return type "order_status" with orderId
- Same-chain Swap: "swap on [chain]" → return type "chain_swap"

Price and Market Data:
- Token Price: "price of [token]", "[token] price" → return type "token_price" with token_name
- Price History: "price history [token]", "historical price" → return type "price_history" with token_name
- Candlestick Chart: "candlestick [token]", "OHLC chart" → return type "candlestick" with token_name

Response format:
{
  "type": "operation_type",
  "parameters": {
    "assetId": "asset_id_if_needed",
    "txId": "transaction_id_if_needed", 
    "chainId": "chain_id_if_needed",
    "token_name": "token_symbol_if_needed",
    "amount": "amount_if_needed"
  },
  "explanation": "Brief explanation of what will be done"
}

For general questions, return type "general_answer" with explanation.

User Query:
`

export async function geminiAgent(userQuery: string): Promise<any> {
  const prompt = GEMINI_PROMPT_TEMPLATE + userQuery

  try {
    const response: any = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    })

    const rawText = response.text

    try {
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/{[\s\S]*}/)

      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0]
        return JSON.parse(jsonString)
      } else {
        return {
          type: "general_answer",
          explanation: rawText.trim(),
        }
      }
    } catch (error) {
      console.error("Failed to parse Gemini response:", error)
      return {
        type: "general_answer",
        explanation: rawText.trim(),
      }
    }
  } catch (error) {
    console.error("Gemini API error:", error)
    return {
      type: "general_answer",
      explanation: "I'm having trouble processing your request. Please try again.",
    }
  }
}
