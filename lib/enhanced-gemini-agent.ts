"use client"

import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_KEY || "")

const ENHANCED_GEMINI_PROMPT_TEMPLATE = `
You are an advanced AI assistant specialized in Story Protocol IP management. Analyze the user query and determine the appropriate action. Respond with JSON only.

Available actions:
- create_ip_asset: User wants to create/register new IP asset
- ip_assets: User wants to see all IP assets
- asset_detail: User wants details of specific asset (extract asset ID)
- transactions: User wants to see transaction history
- royalties: User wants to see royalty payments (can be for specific asset)
- minting_fees: User wants to see minting fees
- bridge: User wants to bridge/swap tokens cross-chain
- conversational: General conversation

Extract parameters:
- Asset IDs: Look for 0x followed by 40 hex characters
- Numbers: Extract "last X" or specific counts
- Tokens: Extract token symbols like USDC, ETH, etc.

Examples:
- "Show royalties for asset 0x123..." → asset_detail with assetId
- "Show last 5 transactions" → transactions
- "Create new IP asset" → create_ip_asset
- "Show all royalties" → royalties
- "Bridge USDC" → bridge

Response format (JSON only):
{
  "type": "action_type",
  "parameters": {
    "assetId": "extracted_asset_id_if_any",
    "limit": "extracted_number_if_any",
    "token": "extracted_token_if_any"
  },
  "explanation": "Brief explanation of what will be done"
}

User Query: `

export async function enhancedGeminiAgent(userQuery: string): Promise<any> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const result = await model.generateContent(ENHANCED_GEMINI_PROMPT_TEMPLATE + userQuery)
    const response = await result.response
    const rawText = response.text()

    // Extract JSON from response
    const jsonMatch = rawText.match(/{[\s\S]*}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    // Fallback response
    return {
      type: "conversational",
      explanation: rawText.trim() || "I'm here to help with Story Protocol operations!",
    }
  } catch (error) {
    console.error("Enhanced Gemini AI error:", error)
    return {
      type: "conversational",
      explanation: "I'm having trouble processing your request. Please try again or rephrase your question.",
    }
  }
}
