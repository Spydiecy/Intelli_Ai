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

class FixedGaiaService {
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

  updateContext(key: string, value: any) {
    this.context = { ...this.context, [key]: value }
  }

  getContext(): ConversationContext {
    return this.context
  }
}

// Create singleton instance
const fixedGaiaService = new FixedGaiaService()

// Enhanced intent detection patterns with more comprehensive coverage
const ENHANCED_INTENT_PATTERNS = {
  ip_assets: [
    /show.*ip.*assets?/i,
    /list.*ip.*assets?/i,
    /display.*ip.*assets?/i,
    /view.*ip.*assets?/i,
    /get.*ip.*assets?/i,
    /recent.*ip.*assets?/i,
    /latest.*ip.*assets?/i,
    /ip.*assets?/i,
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
    /list.*transactions?/i,
  ],
  royalties: [
    /royalt(y|ies)/i,
    /royalty.*payments?/i,
    /earnings?/i,
    /revenue/i,
    /show.*royalt/i,
    /list.*royalt/i,
  ],
  license_tokens: [
    /license.*tokens?/i,
    /licensing/i,
    /licenses?/i,
    /show.*license/i,
    /display.*license/i,
    /list.*license/i,
  ],
  minting_fees: [
    /minting.*fees?/i,
    /mint.*cost/i,
    /mint.*fees?/i,
    /fees?/i,
    /show.*fees?/i,
    /display.*fees?/i,
    /list.*fees?/i,
  ],
  supported_chains: [
    /supported.*chains?/i,
    /available.*chains?/i,
    /chains?/i,
    /networks?/i,
    /show.*chains?/i,
    /list.*chains?/i,
    /get.*chains?/i,
    /display.*chains?/i,
  ],
  token_list: [
    /tokens?.*story/i,
    /story.*tokens?/i,
    /get.*tokens?/i,
    /show.*tokens?/i,
    /list.*tokens?/i,
    /available.*tokens?/i,
    /display.*tokens?/i,
    /tokens?.*on.*story/i,
  ],
  swap_estimate: [
    /swap/i,
    /cross.*chain/i,
    /bridge.*tokens?/i,
    /estimate/i,
    /cross.*chain.*swap/i,
  ],
  bridge: [/^bridge$/i, /go.*bridge/i, /bridge.*page/i, /open.*bridge/i],
  price_history: [
    /price.*history/i,
    /price.*chart/i,
    /story.*price/i,
    /token.*price/i,
    /show.*price/i,
    /price.*data/i,
  ],
  educational: [
    /what.*is.*cross.*chain.*bridging/i,
    /explain.*cross.*chain/i,
    /what.*is.*story.*protocol/i,
    /how.*does.*story.*work/i,
    /what.*is.*ip.*licensing/i,
    /explain.*ip.*licensing/i,
    /how.*do.*royalties.*work/i,
    /what.*are.*royalties/i,
    /benefits.*of.*ip.*licensing/i,
    /how.*to.*protect.*ip/i,
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

// Enhanced intent detection with better asset ID recognition
function detectIntent(userInput: string): { type: string; confidence: number; parameters?: any } {
  const input = userInput.toLowerCase().trim()

  // Check for asset ID patterns (Ethereum addresses)
  const assetIdMatch = input.match(/0x[a-fA-F0-9]{40}/)
  if (assetIdMatch) {
    return {
      type: "asset_detail",
      confidence: 0.95,
      parameters: { assetId: assetIdMatch[0] },
    }
  }

  // Check for conversational patterns first
  for (const pattern of CONVERSATIONAL_PATTERNS) {
    if (pattern.test(input)) {
      return { type: "conversational", confidence: 0.9 }
    }
  }

  // Check for specific intents with enhanced patterns
  for (const [intentType, patterns] of Object.entries(ENHANCED_INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(input)) {
        return { type: intentType, confidence: 0.85 }
      }
    }
  }

  // Check for educational content with lower confidence
  if (input.includes("what") || input.includes("how") || input.includes("explain")) {
    return { type: "educational", confidence: 0.6 }
  }

  // Default to general if no specific intent found
  return { type: "general", confidence: 0.4 }
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
    supported_chains: ["Show available tokens", "Bridge tokens", "Cross-chain swaps", "Show IP assets"],
    token_list: ["Show supported chains", "Bridge tokens", "Show price history", "Show IP assets"],
    minting_fees: ["Show license tokens", "Create IP asset", "Show royalty payments", "Show transactions"],
    license_tokens: ["Show minting fees", "Show royalty payments", "Create IP asset", "Show IP assets"],
    educational: ["Show me examples", "Create an IP asset", "Show recent transactions", "What are the benefits?"],
    asset_detail: ["Show related assets", "View transactions", "Check royalties", "Show license tokens"],
    general: [
      "Show me recent IP assets",
      "List latest transactions",
      "What is intellectual property?",
      "How to create an IP asset?",
    ],
  }

  return suggestions[intent] || suggestions.general
}

// Educational content database
const EDUCATIONAL_CONTENT = {
  "cross-chain bridging": `
🌉 **Cross-Chain Bridging Explained:**

Cross-chain bridging allows you to transfer assets between different blockchain networks. Here's how it works:

• **Interoperability**: Move tokens and data across different blockchains
• **Liquidity Access**: Access liquidity pools on multiple networks
• **Cost Optimization**: Use cheaper networks for certain operations
• **Risk Distribution**: Spread assets across multiple secure networks

**How it works:**
1. Lock assets on the source chain
2. Mint equivalent assets on the destination chain
3. Burn assets when bridging back
4. Unlock original assets on source chain

**Benefits:**
- Access to different DeFi ecosystems
- Lower transaction fees on some networks
- Faster transaction times
- Portfolio diversification across chains

Try asking: "Show supported chains" or "Bridge tokens"
  `,
  "story protocol": `
📚 **Story Protocol Overview:**

Story Protocol is a blockchain designed specifically for intellectual property management and monetization.

**Key Features:**
• **IP Registration**: Register and protect your intellectual property on-chain
• **Programmable Licensing**: Create flexible, automated licensing agreements
• **Royalty Distribution**: Automatic royalty payments to creators and licensors
• **Composable IP**: Build upon existing IP with clear licensing terms

**Use Cases:**
- Digital art and NFTs
- Music and media licensing
- Software and code licensing
- Brand and trademark management
- Academic and research IP

**Benefits:**
- Transparent ownership records
- Automated royalty payments
- Global accessibility
- Reduced legal complexity

Try asking: "Show me recent IP assets" or "Create a new IP asset"
  `,
  "ip licensing": `
🎓 **IP Licensing Benefits:**

Intellectual Property licensing allows you to monetize your creations while maintaining ownership.

**Key Benefits:**
• **Revenue Generation**: Earn ongoing royalties from your IP
• **Market Expansion**: Allow others to use your IP in different markets
• **Risk Mitigation**: Share development and marketing risks
• **Brand Building**: Increase visibility and recognition

**Types of Licenses:**
- Exclusive: Only one licensee can use the IP
- Non-exclusive: Multiple licensees can use the IP
- Sole: Only licensor and one licensee can use the IP

**Royalty Models:**
- Fixed fee per use
- Percentage of revenue
- Tiered pricing based on usage
- Hybrid models

Try asking: "Show license tokens" or "Show royalty payments"
  `,
  "royalties": `
💰 **How Royalties Work:**

Royalties are payments made to IP owners for the use of their intellectual property.

**Types of Royalties:**
• **Usage-based**: Pay per use or view
• **Revenue-based**: Percentage of sales/revenue
• **Time-based**: Fixed payments over time
• **Hybrid**: Combination of different models

**On Story Protocol:**
- Automated smart contract payments
- Transparent tracking and reporting
- Multi-party royalty splits
- Cross-chain royalty distribution

**Benefits for Creators:**
- Passive income generation
- Fair compensation for IP use
- Transparent payment tracking
- Global reach and accessibility

Try asking: "Show royalty payments" or "Create an IP asset"
  `,
}

// Main enhanced agent function
export async function fixedGaiaAgent(userInput: string): Promise<GaiaAgentResponse> {
  try {
    // Detect intent first
    const { type: detectedIntent, confidence, parameters } = detectIntent(userInput)
    console.log("Detected intent:", detectedIntent, "Confidence:", confidence, "Parameters:", parameters)

    // Handle educational queries with built-in content
    if (detectedIntent === "educational") {
      const educationalResponse = handleEducationalQuery(userInput)
      if (educationalResponse) {
        return educationalResponse
      }
    }

    // Handle conversational queries
    if (detectedIntent === "conversational" || confidence < 0.5) {
      return await handleConversationalQuery(userInput, detectedIntent, confidence)
    }

    // Handle structured queries with high confidence
    if (confidence >= 0.7) {
      return {
        type: detectedIntent,
        parameters,
        explanation: getIntentExplanation(detectedIntent),
        confidence,
        suggestions: generateSuggestions(detectedIntent, userInput),
      }
    }

    // For medium confidence, try AI assistance
    return await handleHybridQuery(userInput, detectedIntent, confidence)
  } catch (error) {
    console.error("Error in fixedGaiaAgent:", error)
    return handleFallback(userInput)
  }
}

// Handle educational queries with built-in content
function handleEducationalQuery(userInput: string): GaiaAgentResponse | null {
  const input = userInput.toLowerCase()

  for (const [topic, content] of Object.entries(EDUCATIONAL_CONTENT)) {
    if (input.includes(topic.replace("-", " ")) || input.includes(topic)) {
      return {
        type: "educational",
        explanation: content,
        conversational: true,
        confidence: 0.9,
        suggestions: generateSuggestions("educational", userInput),
      }
    }
  }

  return null
}

// Handle conversational queries
async function handleConversationalQuery(
  userInput: string,
  intent: string,
  confidence: number,
): Promise<GaiaAgentResponse> {
  // Handle simple greetings and responses without AI call
  const input = userInput.toLowerCase().trim()

  if (input.match(/^(hi|hello|hey)$/i)) {
    return {
      type: "conversational",
      explanation:
        "Hello! I'm your Story Protocol AI assistant. I can help you with IP assets, transactions, royalties, and more. What would you like to explore?",
      conversational: true,
      confidence: 0.9,
      suggestions: ["Show recent IP assets", "What is Story Protocol?", "Create an IP asset", "Show transactions"],
    }
  }

  if (input.match(/^(thanks?|thank you)$/i)) {
    return {
      type: "conversational",
      explanation: "You're welcome! Is there anything else I can help you with regarding Story Protocol?",
      conversational: true,
      confidence: 0.9,
      suggestions: ["Show IP assets", "Show transactions", "What can you do?", "Show royalty payments"],
    }
  }

  if (input.match(/what.*can.*you.*do/i)) {
    return {
      type: "conversational",
      explanation: `I can help you with many Story Protocol tasks:

🔍 **Data & Analytics:**
• Show IP assets and filter them
• Display transactions and royalty payments
• Show license tokens and minting fees
• View supported chains and available tokens

🎨 **Asset Management:**
• Create new IP assets
• View asset details
• Track asset relationships

📊 **Market Data:**
• Show price history for Story token
• Cross-chain bridging information

🎓 **Education:**
• Explain Story Protocol concepts
• Guide you through IP licensing
• Help understand royalties and fees

Just ask me anything like "Show recent IP assets" or "What is cross-chain bridging?"`,
      conversational: true,
      confidence: 0.9,
      suggestions: ["Show recent IP assets", "Create an IP asset", "Show transactions", "What is Story Protocol?"],
    }
  }

  // For other conversational queries, try AI if available
  try {
    const conversationalPrompt = `You are a helpful AI assistant for Story Protocol, a blockchain platform for intellectual property. 

User said: "${userInput}"

Respond naturally and conversationally. Keep responses concise but informative. Always be helpful and friendly.`

    const messages: GaiaMessage[] = [
      { role: "system", content: conversationalPrompt },
      { role: "user", content: userInput },
    ]

    const response = await fixedGaiaService.chatCompletion(messages, { temperature: 0.8 })

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

// Handle hybrid queries (medium confidence)
async function handleHybridQuery(userInput: string, intent: string, confidence: number): Promise<GaiaAgentResponse> {
  try {
    const hybridPrompt = `You are an AI assistant for Story Protocol. The user said: "${userInput}"

Analyze if this is a request for specific data/action or a general question.

For data requests, respond with JSON:
{
  "type": "action_type",
  "parameters": {},
  "explanation": "brief explanation"
}

For general questions, respond naturally.

Available action types: ip_assets, filter_ip_assets, create_ip_asset, transactions, royalties, license_tokens, minting_fees, supported_chains, token_list, swap_estimate, asset_detail, educational, bridge, price_history`

    const messages: GaiaMessage[] = [
      { role: "system", content: hybridPrompt },
      { role: "user", content: userInput },
    ]

    const response = await fixedGaiaService.chatCompletion(messages, { temperature: 0.6 })

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

// Enhanced fallback handler
function handleFallback(userInput: string): GaiaAgentResponse {
  const lowerInput = userInput.toLowerCase()

  // Enhanced fallback logic with better pattern matching
  if (lowerInput.includes("supported") && lowerInput.includes("chain")) {
    return {
      type: "supported_chains",
      explanation: "I'll show you the supported blockchain networks.",
      suggestions: ["Show available tokens", "Bridge tokens", "Cross-chain swaps", "Show IP assets"],
    }
  } else if (lowerInput.includes("token") && (lowerInput.includes("story") || lowerInput.includes("list"))) {
    return {
      type: "token_list",
      explanation: "I'll show you the available tokens on Story Protocol.",
      parameters: { chainId: 1315    },
      suggestions: ["Show supported chains", "Bridge tokens", "Show price history", "Show IP assets"],
    }
  } else if (lowerInput.includes("minting") && lowerInput.includes("fee")) {
    return {
      type: "minting_fees",
      explanation: "I'll show you the minting fees for license tokens.",
      suggestions: ["Show license tokens", "Create IP asset", "Show royalty payments", "Show transactions"],
    }
  } else if (lowerInput.includes("license") && lowerInput.includes("token")) {
    return {
      type: "license_tokens",
      explanation: "I'll show you the license tokens.",
      suggestions: ["Show minting fees", "Show royalty payments", "Create IP asset", "Show IP assets"],
    }
  } else if (lowerInput.includes("cross") && lowerInput.includes("chain")) {
    return {
      type: "educational",
      explanation: EDUCATIONAL_CONTENT["cross-chain bridging"],
      conversational: true,
      suggestions: ["Show supported chains", "Bridge tokens", "Show available tokens", "Show IP assets"],
    }
  } else if (lowerInput.includes("ip asset") && lowerInput.includes("filter")) {
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
  } else {
    return {
      type: "conversational",
      explanation:
        "I'm here to help with Story Protocol! You can ask me about IP assets, transactions, royalties, creating assets, supported chains, tokens, minting fees, or general questions about the protocol.",
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
    minting_fees: "I'll show you minting fees for license tokens.",
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

// Export the fixed service
export { fixedGaiaService }

// Backward compatibility
export const gaiaAgent = fixedGaiaAgent
