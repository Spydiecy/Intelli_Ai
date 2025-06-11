interface GaiaMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface GaiaResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface GaiaAgentResponse {
  type: string
  parameters?: any
  explanation?: string
  conversational?: boolean
  confidence?: number
  suggestions?: string[]
}

interface ConversationContext {
  lastIntent?: string
  userPreferences?: Record<string, any>
  sessionHistory?: string[]
}

// Environment variables
const GAIA_API_KEY = process.env.NEXT_PUBLIC_GAIA_API_KEY
const GAIA_NODE_ID = process.env.NEXT_PUBLIC_GAIA_NODE_ID || "your_node_id"
const GAIA_MODEL = process.env.NEXT_PUBLIC_GAIA_MODEL || "Llama-3-8B-Instruct-262k-Q5_K_M"

class EnhancedGaiaService {
  private baseUrl: string
  private apiKey: string
  private model: string
  private context: ConversationContext = {}

  constructor() {
    this.baseUrl = `https://${GAIA_NODE_ID}.gaia.domains/v1`
    this.apiKey = GAIA_API_KEY || ""
    this.model = GAIA_MODEL
  }

  async chatCompletion(
    messages: GaiaMessage[],
    options?: {
      temperature?: number
      maxTokens?: number
      stream?: boolean
    },
  ): Promise<GaiaResponse> {
    if (!this.apiKey) {
      throw new Error(
        "Gaia API key is not configured. Please set NEXT_PUBLIC_GAIA_API_KEY in your environment variables.",
      )
    }

    const requestBody = {
      messages,
      model: this.model,
      temperature: options?.temperature || 0.7,
      top_p: 0.9,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
      ...(options?.maxTokens && { max_tokens: options.maxTokens }),
      ...(options?.stream && { stream: options.stream }),
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gaia API Error:", response.status, errorText)
      throw new Error(`Gaia API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log("Gaia Response:", result)
    return result
  }

  async getEmbeddings(input: string[]): Promise<any> {
    if (!this.apiKey) {
      throw new Error("Gaia API key is not configured.")
    }

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        accept: "application/json",
      },
      body: JSON.stringify({
        model: "nomic-embed-text-v1.5.f16",
        input,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gaia Embeddings API error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  }

  async retrieve(messages: GaiaMessage[]): Promise<any> {
    if (!this.apiKey) {
      throw new Error("Gaia API key is not configured.")
    }

    const response = await fetch(`${this.baseUrl}/retrieve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        accept: "application/json",
      },
      body: JSON.stringify({
        messages,
        model: "nomic-embed-text-v1.5.f16",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gaia Retrieve API error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  }

  updateContext(key: string, value: any) {
    this.context = { ...this.context, [key]: value }
  }

  getContext(): ConversationContext {
    return this.context
  }
}

// Create singleton instance
const enhancedGaiaService = new EnhancedGaiaService()

// Advanced intent detection patterns
const INTENT_PATTERNS = {
  ip_assets: [
    /show.*ip.*assets?/i,
    /list.*ip.*assets?/i,
    /display.*ip.*assets?/i,
    /view.*ip.*assets?/i,
    /get.*ip.*assets?/i,
    /recent.*ip.*assets?/i,
    /latest.*ip.*assets?/i,
  ],
  filter_ip_assets: [
    /filter.*ip.*assets?/i,
    /search.*ip.*assets?/i,
    /find.*ip.*assets?/i,
    /advanced.*filter/i,
    /filter.*assets?/i,
  ],
  create_ip_asset: [
    /create.*ip.*asset/i,
    /new.*ip.*asset/i,
    /register.*ip.*asset/i,
    /add.*ip.*asset/i,
    /mint.*ip.*asset/i,
  ],
  transactions: [
    /transactions?/i,
    /latest.*transactions?/i,
    /recent.*transactions?/i,
    /show.*transactions?/i,
    /transaction.*history/i,
  ],
  royalties: [/royalt(y|ies)/i, /royalty.*payments?/i, /earnings?/i, /revenue/i],
  license_tokens: [/license.*tokens?/i, /licensing/i, /licenses?/i],
  minting_fees: [/minting.*fees?/i, /mint.*cost/i, /fees?/i],
  supported_chains: [/supported.*chains?/i, /available.*chains?/i, /chains?/i, /networks?/i],
  token_list: [/tokens?/i, /token.*list/i, /available.*tokens?/i],
  swap_estimate: [/swap/i, /cross.*chain/i, /bridge.*tokens?/i, /estimate/i],
  bridge: [/^bridge$/i, /go.*bridge/i, /bridge.*page/i],
  price_history: [/price.*history/i, /price.*chart/i, /story.*price/i, /token.*price/i],
  educational: [
    /what.*is/i,
    /how.*does/i,
    /explain/i,
    /tell.*me.*about/i,
    /benefits?/i,
    /advantages?/i,
    /help.*understand/i,
  ],
}

// Conversational patterns for general chat
const CONVERSATIONAL_PATTERNS = [
  /^(hi|hello|hey|greetings?)$/i,
  /^(thanks?|thank you)$/i,
  /^(bye|goodbye|see you)$/i,
  /^(yes|no|ok|okay)$/i,
  /how.*are.*you/i,
  /what.*can.*you.*do/i,
  /help$/i,
]

// Enhanced intent detection
function detectIntent(userInput: string): { type: string; confidence: number } {
  const input = userInput.toLowerCase().trim()

  // Check for conversational patterns first
  for (const pattern of CONVERSATIONAL_PATTERNS) {
    if (pattern.test(input)) {
      return { type: "conversational", confidence: 0.9 }
    }
  }

  // Check for specific intents
  for (const [intentType, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(input)) {
        return { type: intentType, confidence: 0.8 }
      }
    }
  }

  // Check for asset ID patterns
  if (/0x[a-fA-F0-9]{40}/.test(input)) {
    return { type: "asset_detail", confidence: 0.9 }
  }

  // Default to general if no specific intent found
  return { type: "general", confidence: 0.3 }
}

// Generate contextual suggestions
function generateSuggestions(intent: string, userInput: string): string[] {
  const suggestions: Record<string, string[]> = {
    conversational: [
      "Show me recent IP assets",
      "What is Story Protocol?",
      "How do royalties work?",
      "Create a new IP asset",
    ],
    ip_assets: ["Filter IP assets", "Create a new IP asset", "Show transactions", "Show royalty payments"],
    transactions: ["Show IP assets", "Show royalty payments", "Filter transactions by date"],
    educational: ["Show me examples", "Create an IP asset", "Show recent transactions", "What are the benefits?"],
    general: [
      "Show me recent IP assets",
      "List latest transactions",
      "What is intellectual property?",
      "How to create an IP asset?",
    ],
  }

  return suggestions[intent] || suggestions.general
}

// Main enhanced agent function
export async function enhancedGaiaAgent(userInput: string): Promise<GaiaAgentResponse> {
  try {
    // Detect intent first
    const { type: detectedIntent, confidence } = detectIntent(userInput)

    // Handle conversational queries differently
    if (detectedIntent === "conversational" || confidence < 0.5) {
      return await handleConversationalQuery(userInput, detectedIntent, confidence)
    }

    // Handle structured queries
    if (confidence >= 0.8) {
      return await handleStructuredQuery(userInput, detectedIntent, confidence)
    }

    // For medium confidence, try both approaches
    return await handleHybridQuery(userInput, detectedIntent, confidence)
  } catch (error) {
    console.error("Error in enhancedGaiaAgent:", error)
    return handleFallback(userInput)
  }
}

// Handle conversational queries
async function handleConversationalQuery(
  userInput: string,
  intent: string,
  confidence: number,
): Promise<GaiaAgentResponse> {
  const conversationalPrompt = `You are a helpful AI assistant for Story Protocol, a blockchain platform for intellectual property. 

User said: "${userInput}"

Respond naturally and conversationally. If the user is asking about Story Protocol features, explain them clearly. If it's a greeting or general question, respond appropriately while staying in character as a Story Protocol assistant.

Keep responses concise but informative. Always be helpful and friendly.`

  try {
    const messages: GaiaMessage[] = [
      { role: "system", content: conversationalPrompt },
      { role: "user", content: userInput },
    ]

    const response = await enhancedGaiaService.chatCompletion(messages, { temperature: 0.8 })

    if (response.choices && response.choices.length > 0) {
      const content = response.choices[0].message.content.trim()

      return {
        type: "conversational",
        explanation: content,
        conversational: true,
        confidence,
        suggestions: generateSuggestions(intent, userInput),
      }
    }
  } catch (error) {
    console.error("Error in conversational query:", error)
  }

  return handleFallback(userInput)
}

// Handle structured queries (commands/actions)
async function handleStructuredQuery(
  userInput: string,
  intent: string,
  confidence: number,
): Promise<GaiaAgentResponse> {
  const structuredPrompt = `You are an AI assistant for Story Protocol. Analyze this user request and respond with a JSON object.

User request: "${userInput}"
Detected intent: "${intent}"

Respond with JSON containing:
- type: "${intent}"
- parameters: any relevant parameters (e.g., asset ID, filters, etc.)
- explanation: brief explanation of what you'll help with

Valid types: ip_assets, filter_ip_assets, create_ip_asset, transactions, royalties, license_tokens, minting_fees, supported_chains, token_list, swap_estimate, asset_detail, educational, bridge, price_history

Respond with valid JSON only.`

  try {
    const messages: GaiaMessage[] = [
      { role: "system", content: structuredPrompt },
      { role: "user", content: userInput },
    ]

    const response = await enhancedGaiaService.chatCompletion(messages, { temperature: 0.3 })

    if (response.choices && response.choices.length > 0) {
      const content = response.choices[0].message.content.trim()

      try {
        const parsed = JSON.parse(content)
        return {
          ...parsed,
          confidence,
          suggestions: generateSuggestions(intent, userInput),
        } as GaiaAgentResponse
      } catch (parseError) {
        console.warn("Failed to parse structured response:", content)
        // Fall back to intent-based response
        return {
          type: intent,
          explanation: getIntentExplanation(intent),
          confidence,
          suggestions: generateSuggestions(intent, userInput),
        }
      }
    }
  } catch (error) {
    console.error("Error in structured query:", error)
  }

  return {
    type: intent,
    explanation: getIntentExplanation(intent),
    confidence,
    suggestions: generateSuggestions(intent, userInput),
  }
}

// Handle hybrid queries (medium confidence)
async function handleHybridQuery(userInput: string, intent: string, confidence: number): Promise<GaiaAgentResponse> {
  const hybridPrompt = `You are an AI assistant for Story Protocol. The user said: "${userInput}"

This could be either a conversational question or a request for specific action. 

If it's a conversational question, respond naturally and helpfully.
If it's a request for action, respond with JSON format:
{
  "type": "action_type",
  "parameters": {},
  "explanation": "brief explanation"
}

Available action types: ip_assets, filter_ip_assets, create_ip_asset, transactions, royalties, license_tokens, minting_fees, supported_chains, token_list, swap_estimate, asset_detail, educational, bridge, price_history

Choose the most appropriate response format.`

  try {
    const messages: GaiaMessage[] = [
      { role: "system", content: hybridPrompt },
      { role: "user", content: userInput },
    ]

    const response = await enhancedGaiaService.chatCompletion(messages, { temperature: 0.6 })

    if (response.choices && response.choices.length > 0) {
      const content = response.choices[0].message.content.trim()

      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(content)
        return {
          ...parsed,
          confidence,
          suggestions: generateSuggestions(parsed.type || intent, userInput),
        } as GaiaAgentResponse
      } catch (parseError) {
        // Treat as conversational response
        return {
          type: "conversational",
          explanation: content,
          conversational: true,
          confidence,
          suggestions: generateSuggestions(intent, userInput),
        }
      }
    }
  } catch (error) {
    console.error("Error in hybrid query:", error)
  }

  return handleFallback(userInput)
}

// Fallback handler
function handleFallback(userInput: string): GaiaAgentResponse {
  const lowerInput = userInput.toLowerCase()

  // Enhanced fallback logic
  if (lowerInput.includes("ip asset") && lowerInput.includes("filter")) {
    return {
      type: "filter_ip_assets",
      explanation: "I'll help you filter IP assets with advanced options.",
      suggestions: ["Open filter modal", "Search by name", "Filter by date", "Filter by type"],
    }
  } else if (lowerInput.includes("create") && lowerInput.includes("ip asset")) {
    return {
      type: "create_ip_asset",
      explanation: "I'll help you create a new IP asset.",
      suggestions: ["Upload content", "Set metadata", "Choose license terms", "Set royalty rates"],
    }
  } else if (lowerInput.includes("ip asset")) {
    return {
      type: "ip_assets",
      explanation: "I'll show you the latest IP assets.",
      suggestions: ["Filter assets", "Create new asset", "View asset details", "Show transactions"],
    }
  } else if (lowerInput.includes("transaction")) {
    return {
      type: "transactions",
      explanation: "I'll show you the latest transactions.",
      suggestions: ["Filter by type", "Show IP assets", "View transaction details", "Show royalties"],
    }
  } else if (lowerInput.includes("royalt")) {
    return {
      type: "royalties",
      explanation: "I'll show you royalty payments.",
      suggestions: ["View earnings", "Show IP assets", "Payment history", "Set royalty rates"],
    }
  } else if (lowerInput.includes("price history") && lowerInput.includes("story")) {
    return {
      type: "price_history",
      explanation: "I'll show you Story Protocol price history.",
      suggestions: ["View 30-day chart", "Compare prices", "Market analysis", "Price alerts"],
    }
  } else if (lowerInput.includes("bridge") && !lowerInput.includes("cross-chain")) {
    return {
      type: "bridge",
      explanation: "Redirecting to bridge page.",
      suggestions: ["Cross-chain transfer", "Supported chains", "Bridge fees", "Transaction status"],
    }
  } else if (lowerInput.includes("what") || lowerInput.includes("how") || lowerInput.includes("explain")) {
    return {
      type: "educational",
      explanation: "I can help explain Story Protocol concepts. What would you like to learn about?",
      suggestions: ["IP licensing", "Royalty system", "Asset creation", "Protocol benefits"],
    }
  } else {
    return {
      type: "conversational",
      explanation:
        "I'm here to help with Story Protocol! You can ask me about IP assets, transactions, royalties, creating assets, or general questions about the protocol.",
      conversational: true,
      suggestions: ["Show recent IP assets", "What is Story Protocol?", "Create an IP asset", "Show transactions"],
    }
  }
}

// Get explanation for intent
function getIntentExplanation(intent: string): string {
  const explanations: Record<string, string> = {
    ip_assets: "I'll show you the latest IP assets.",
    filter_ip_assets: "I'll help you filter IP assets with advanced options.",
    create_ip_asset: "I'll help you create a new IP asset.",
    transactions: "I'll show you the latest transactions.",
    royalties: "I'll show you royalty payments.",
    license_tokens: "I'll show you license tokens.",
    minting_fees: "I'll show you minting fees.",
    supported_chains: "I'll show you supported blockchain networks.",
    token_list: "I'll show you available tokens.",
    swap_estimate: "I'll help you estimate cross-chain swaps.",
    asset_detail: "I'll show you details for that specific asset.",
    educational: "I'll help explain that concept.",
    bridge: "Redirecting to the bridge page.",
    price_history: "I'll show you price history data.",
  }

  return explanations[intent] || "I'll help you with that."
}

// Export the enhanced service
export { enhancedGaiaService }

// Backward compatibility
export const gaiaAgent = enhancedGaiaAgent
