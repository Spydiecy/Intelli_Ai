"use client"

import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_KEY || "")

const GEMINI_PROMPT_TEMPLATE = `
You are an AI assistant specialized in Story Protocol IP management and DeBridge cross-chain operations. You help users with IP assets, transactions, royalties, licensing, minting fees, and cross-chain swaps.

Available Story Protocol operations:
- IP Assets: "show assets", "list IP assets", "view assets" → return type "ip_assets"
- Filter IP Assets: "filter assets", "search assets", "advanced filter" → return type "filter_ip_assets"
- Create IP Asset: "create asset", "new IP asset", "register IP" → return type "create_ip_asset"
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
- Bridge: "bridge", "cross-chain bridge" → return type "bridge"
- Order Status: "order status [ID]", "check order" → return type "order_status" with orderId
- Same-chain Swap: "swap on [chain]" → return type "chain_swap"

Price and Market Data:
- Token Price: "price of [token]", "[token] price" → return type "token_price" with token_name
- Price History: "price history [token]", "historical price" → return type "price_history" with token_name
- Candlestick Chart: "candlestick [token]", "OHLC chart" → return type "candlestick" with token_name

Educational Content:
- What is Story Protocol: "what is story protocol", "explain story" → return type "educational"
- How royalties work: "how do royalties work", "explain royalties" → return type "educational"
- IP licensing benefits: "benefits of IP licensing", "why license IP" → return type "educational"
- Cross-chain bridging: "what is bridging", "explain cross-chain" → return type "educational"

Response format (JSON only):
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

For general questions, return type "conversational" with explanation.
Always respond with valid JSON only.

User Query: `

export async function geminiAgent(userQuery: string): Promise<any> {
  const prompt = GEMINI_PROMPT_TEMPLATE + userQuery

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const rawText = response.text()

    try {
      // Try to extract JSON from the response
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/{[\s\S]*}/)

      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0]
        return JSON.parse(jsonString)
      } else {
        // If no JSON found, treat as conversational
        return {
          type: "conversational",
          explanation: rawText.trim(),
        }
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError)
      return {
        type: "conversational",
        explanation: rawText.trim(),
      }
    }
  } catch (error) {
    console.error("Gemini API error:", error)
    return {
      type: "conversational",
      explanation: "I'm having trouble processing your request. Please try again.",
    }
  }
}

// Hybrid agent that uses Gaia for simple requests and Gemini for complex ones
export async function hybridAgent(userQuery: string): Promise<any> {
  const lowerQuery = userQuery.toLowerCase()
  
  // Use Gaia for very simple requests to maintain the illusion
  const simpleGaiaPatterns = [
    /^(hi|hello|hey)$/i,
    /^(thanks?|thank you)$/i,
    /what.*can.*you.*do/i,
  ]

  const shouldUseGaia = simpleGaiaPatterns.some(pattern => pattern.test(lowerQuery))

  if (shouldUseGaia) {
    // Import and use Gaia for simple requests
    try {
      const { fixedGaiaAgent } = await import('./gaia-agent')
      return await fixedGaiaAgent(userQuery)
    } catch (error) {
      console.error("Gaia fallback error:", error)
      // Fallback to Gemini if Gaia fails
      return await geminiAgent(userQuery)
    }
  } else {
    // Use Gemini for complex requests but brand as Gaia
    const geminiResponse = await geminiAgent(userQuery)
    
    // Add Gaia branding to the response
    return {
      ...geminiResponse,
      powered_by: "gaia", // Hidden flag to show Gaia branding
    }
  }
}
