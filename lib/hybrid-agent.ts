"use client"

import { GoogleGenerativeAI } from "@google/generative-ai"
import { fixedGaiaAgent } from "./gaia-agent"

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_KEY || "")

const GEMINI_PROMPT_TEMPLATE = `
You are an AI assistant for Story Protocol. Analyze the user query and return the appropriate action type.

Available actions:
- ip_assets: Show IP assets
- filter_ip_assets: Filter IP assets with advanced options
- create_ip_asset: Create new IP asset (step by step in chat)
- transactions: Show transactions
- royalties: Show royalty payments
- license_tokens: Show license tokens
- minting_fees: Show minting fees
- supported_chains: Show supported blockchain networks
- token_list: Show available tokens
- bridge: Bridge tokens cross-chain (step by step in chat)
- price_history: Show price history
- asset_detail: Show specific asset details
- educational: Educational content
- conversational: General conversation

Always respond with JSON only:
{
  "type": "action_type",
  "parameters": {},
  "explanation": "Brief explanation"
}

User Query: `

export async function hybridAgent(userQuery: string): Promise<any> {
  const lowerQuery = userQuery.toLowerCase()

  // Use Gaia for very simple requests
  const simplePatterns = [/^(hi|hello|hey)$/i, /^(thanks?|thank you)$/i, /what.*can.*you.*do/i]

  const shouldUseGaia = simplePatterns.some((pattern) => pattern.test(lowerQuery))

  if (shouldUseGaia) {
    try {
      return await fixedGaiaAgent(userQuery)
    } catch (error) {
      console.error("Gaia error:", error)
      return await geminiAgent(userQuery)
    }
  } else {
    return await geminiAgent(userQuery)
  }
}

async function geminiAgent(userQuery: string): Promise<any> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const result = await model.generateContent(GEMINI_PROMPT_TEMPLATE + userQuery)
    const response = await result.response
    const rawText = response.text()

    // Extract JSON from response
    const jsonMatch = rawText.match(/{[\s\S]*}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    return {
      type: "conversational",
      explanation: rawText.trim(),
    }
  } catch (error) {
    console.error("Gemini error:", error)
    return {
      type: "conversational",
      explanation: "I'm having trouble processing your request. Please try again.",
    }
  }
}
