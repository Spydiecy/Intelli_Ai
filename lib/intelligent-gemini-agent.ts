// ENHANCED MASTER PROMPT with time-based analytics and performance insights
const ENHANCED_MASTER_PERPLEXITY_PROMPT = `
You are an EXPERT Story Protocol AI Assistant and Analytics HTML Generator. You MUST follow these rules EXACTLY:

## CRITICAL RULES:
1. ALWAYS respond with VALID HTML wrapped in <div> tags
2. Use ONLY Tailwind CSS classes (no custom CSS)
3. Generate COMPLETE, STATIC HTML pages with the fetched data
4. NEVER use placeholders - use REAL data from the API responses
5. Make responses VISUALLY STUNNING and MOBILE RESPONSIVE
6. Perform ADVANCED ANALYTICS on the data before displaying

## HTML STRUCTURE REQUIREMENTS:
- Start with: <div class="space-y-6 p-4">
- End with: </div>
- Use proper Tailwind classes for colors, spacing, typography
- Include icons using SVG (strokeWidth="2")
- Make cards interactive with hover effects
- Add summary statistics at the top

## COLOR SCHEME:
- IP Assets: Blue theme (bg-blue-500/10, border-blue-500/20, text-blue-400)
- Royalties: Green theme (bg-green-500/10, border-green-500/20, text-green-400)
- Transactions: Orange theme (bg-orange-500/10, border-orange-500/20, text-orange-400)
- Minting Fees: Purple theme (bg-purple-500/10, border-purple-500/20, text-purple-400)
- Performance: Gradient theme (bg-gradient-to-r from-yellow-500/10 to-orange-500/10)
- Errors: Red theme (bg-red-500/10, border-red-500/20, text-red-400)

## ADVANCED DATA PROCESSING:

### TIME-BASED FILTERING:
- For "today's" queries: Filter data by today's date (current timestamp)
- For "recent" queries: Show last 24-48 hours
- Convert timestamps to readable dates
- Group by time periods when relevant

### PERFORMANCE ANALYTICS:
- For "highest" queries: Sort by amount/value DESC
- For "top earning": Calculate total revenue per asset
- For "most active": Count transactions per asset/creator
- Show rankings with position numbers

### ETH CALCULATIONS:
- Convert wei to ETH: divide by 10^18
- Format to 6 decimal places for precision
- Show In IP by converting 1 IP=0.0014 eth use this conversion do not show in ETH or wei 
- Calculate totals and averages

## DATA FORMATTING:
- ETH amounts: Always show IN IP Token Amounts Only
- Addresses: Show first 6 and last 4 characters with "..."
- Dates: Use readable format .
- Numbers: Add commas for thousands
- Percentages: Show with 2 decimal places
- Rankings: Use 🥇🥈🥉 for top 3, then numbers
- Remember my time is given in unix date so convert it into today's date and time.
only show the small size logos and images.

## EXAMPLE ENHANCED STRUCTURE:
<div class="space-y-6 p-4">
  <!-- Header with advanced stats -->
  <div class="text-center">
    <h1 class="text-2xl font-bold text-white mb-2">Analytics Title</h1>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      <!-- Summary metrics -->
    </div>
  </div>
  
  <!-- Performance indicators -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <!-- Key performance cards -->
  </div>
  
  <!-- Main data visualization -->
  <div class="space-y-4">
    <!-- Ranked/sorted data cards -->
  </div>
</div>

## CRITICAL REQUIREMENTS:
- ALWAYS perform the analytics described above
- NEVER show raw data without processing
- ALWAYS include summary statistics
- Show rankings and comparisons
- Filter by time when requested
- Calculate totals and averages
- Do not include any dummy data only use the real one
- Use actual data, never placeholders
- Do not include complete address write short form of address in ..
- Everything in black theme if any image url comes then show the image also with src of the link given
- In list all ip assets only list the ip asset details with image in table format not more than 10 in length in black theme
- Do not show any dummy data. only real data show all data
- Generate COMPLETE ANALYTICAL HTML response
-show the mintin fees logo in small size
Now process this request with ADVANCED ANALYTICS:

USER QUERY: {userQuery}
FETCHED DATA: {fetchedData}
INTENT: {intent}
CURRENT TIMESTAMP: {currentTimestamp}
`

interface APIResponse {
  data?: any[]
  error?: string
  success?: boolean
}

interface AgentResponse {
  content: string
  htmlContent: string
  data?: any
  perplexityResponse?: any
}

interface PerplexityResponse {
  id: string
  model: string
  created: number
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    search_context_size: string
  }
  citations: string[]
  search_results: Array<{
    title: string
    url: string
    date: string | null
  }>
  object: string
  choices: Array<{
    index: number
    finish_reason: string
    message: {
      role: string
      content: string
    }
    delta: {
      role: string
      content: string
    }
  }>
}

// Enhanced API wrapper with better error handling and retry logic
async function callAPI(apiFunction: () => Promise<any>, apiName: string): Promise<APIResponse> {
  try {
    console.log(`Calling API: ${apiName}`)
    const response = await apiFunction()
    console.log(`API ${apiName} response:`, response)

    if (response && response.data) {
      return { data: response.data, success: true }
    } else if (response && Array.isArray(response)) {
      return { data: response, success: true }
    } else {
      return { data: [], success: true }
    }
  } catch (error: any) {
    console.error(`API ${apiName} error:`, error)
    return { error: error.message, success: false }
  }
}

// Enhanced intent analysis with better time-based and performance detection
function analyzeIntent(userQuery: string): {
  intent: string
  apis: string[]
  parameters: any
  queryType: string
  timeFilter?: string
  analyticsType?: string
} {
  const query = userQuery.toLowerCase()

  // Time-based queries
  const isToday = query.includes("today") || query.includes("today's")
  const isRecent = query.includes("recent") || query.includes("latest") || query.includes("last")
  const isHighest =
    query.includes("highest") || query.includes("top") || query.includes("best") || query.includes("most")

  // Create asset intent
  if (query.includes("create") && (query.includes("asset") || query.includes("ip"))) {
    return {
      intent: "create_asset",
      apis: [],
      parameters: {},
      queryType: "creation",
    }
  }

  // Asset-related queries
  if (query.includes("asset") || query.includes("ip")) {
    if (query.includes("detail") || query.match(/0x[a-f0-9]{40}/i)) {
      const assetId = userQuery.match(/0x[a-fA-F0-9]{40}/)?.[0]
      return {
        intent: "asset_details",
        apis: ["getIPAsset", "listRoyaltyPays", "listLatestTransactions"],
        parameters: { assetId, limit: 20 },
        queryType: "detail",
      }
    }

    if (isHighest || query.includes("earning") || query.includes("performance")) {
      return {
        intent: "top_assets_analysis",
        apis: ["listIPAssets", "listRoyaltyPays"],
        parameters: { limit: 50 },
        queryType: "analytics",
        analyticsType: "performance",
      }
    }

    return {
      intent: "list_assets",
      apis: ["listIPAssets"],
      parameters: { limit: 30 },
      queryType: "list",
    }
  }

  // Royalty-related queries with enhanced analytics
  if (query.includes("royalt") || query.includes("earning") || query.includes("payment")) {
    const limit = userQuery.match(/last\s+(\d+)/i)?.[1] || (isToday ? "100" : "50")

    if (isToday) {
      return {
        intent: "todays_royalties",
        apis: ["listRoyaltyPays"],
        parameters: { limit: Number.parseInt(limit) },
        queryType: "analytics",
        timeFilter: "today",
        analyticsType: "time_based",
      }
    }

    if (isHighest) {
      return {
        intent: "highest_royalties",
        apis: ["listRoyaltyPays"],
        parameters: { limit: Number.parseInt(limit) },
        queryType: "analytics",
        analyticsType: "performance",
      }
    }

    return {
      intent: "royalty_analysis",
      apis: ["listRoyaltyPays"],
      parameters: { limit: Number.parseInt(limit) },
      queryType: "analytics",
    }
  }

  // Transaction-related queries with time filtering
  if (query.includes("transaction") || query.includes("activity") || query.includes("history")) {
    const limit = userQuery.match(/last\s+(\d+)/i)?.[1] || (isToday ? "100" : "50")

    if (isToday) {
      return {
        intent: "todays_transactions",
        apis: ["listLatestTransactions"],
        parameters: { limit: Number.parseInt(limit) },
        queryType: "analytics",
        timeFilter: "today",
        analyticsType: "time_based",
      }
    }

    if (isHighest || query.includes("volume")) {
      return {
        intent: "highest_transactions",
        apis: ["listLatestTransactions"],
        parameters: { limit: Number.parseInt(limit) },
        queryType: "analytics",
        analyticsType: "performance",
      }
    }

    return {
      intent: "transaction_history",
      apis: ["listLatestTransactions"],
      parameters: { limit: Number.parseInt(limit) },
      queryType: "list",
    }
  }

  // Minting fee queries
  if (query.includes("minting") || query.includes("fee") || query.includes("cost")) {
    const limit = userQuery.match(/last\s+(\d+)/i)?.[1] || "30"

    if (isToday) {
      return {
        intent: "todays_fees",
        apis: ["listLicenseMintingFees"],
        parameters: { limit: Number.parseInt(limit) },
        queryType: "analytics",
        timeFilter: "today",
        analyticsType: "time_based",
      }
    }

    if (isHighest) {
      return {
        intent: "highest_fees",
        apis: ["listLicenseMintingFees"],
        parameters: { limit: Number.parseInt(limit) },
        queryType: "analytics",
        analyticsType: "performance",
      }
    }

    return {
      intent: "minting_fees",
      apis: ["listLicenseMintingFees"],
      parameters: { limit: Number.parseInt(limit) },
      queryType: "analytics",
    }
  }

  // Default to general query (use Perplexity for general questions)
  return {
    intent: "general_query",
    apis: [],
    parameters: { limit: 25 },
    queryType: "general",
  }
}

// Perplexity AI API call function
async function callPerplexityAI(prompt: string): Promise<PerplexityResponse> {
  try {
    console.log("Calling Perplexity AI...")

    const options = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_PER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        search_mode: "web",
        reasoning_effort: "high",
        temperature: 0.2,
        top_p: 0.9,
        return_images: false,
        return_related_questions: false,
        top_k: 0,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 0,
        web_search_options: {
          search_context_size: "low",
        },
        model: "sonar-pro",
        messages: [
          {
            content: prompt,
            role: "user",
          },
        ],
      }),
    }

    const response = await fetch("https://api.perplexity.ai/chat/completions", options)

    if (!response.ok) {
      throw new Error(`Perplexity API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Perplexity AI response:", data)

    return data
  } catch (error: any) {
    console.error("Perplexity AI error:", error)
    throw error
  }
}

// Generate beautiful HTML for Perplexity response with web results
function generatePerplexityHTML(perplexityResponse: PerplexityResponse, userQuery: string): string {
  const { choices, citations, search_results, usage } = perplexityResponse
  const content = choices[0]?.message?.content || "No response available"

  return `
    <div class="space-y-6 p-4">
      <!-- AI Response -->
      <div class="p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20">
        <div class="flex items-center gap-2 mb-4">
          <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
          <h2 class="text-xl font-semibold text-purple-300">AI Analysis</h2>
        </div>
        <div class="text-white/90 leading-relaxed whitespace-pre-wrap">${content}</div>
      </div>
    </div>
  `
}

export async function enhancedIntelligentAgent(userQuery: string, api: any): Promise<AgentResponse> {
  try {
    console.log("Processing enhanced query:", userQuery)

    // Step 1: Analyze intent with enhanced detection
    const intentData = analyzeIntent(userQuery)
    console.log("Enhanced intent analysis:", intentData)

    // Step 2: Check if it's a general query (use Perplexity) or specific data query
    if (intentData.queryType === "general" || intentData.apis.length === 0) {
      console.log("Using Perplexity AI for general query...")
      const perplexityResponse = await callPerplexityAI(userQuery)
      const htmlContent = generatePerplexityHTML(perplexityResponse, userQuery)

      return {
        content: `Perplexity AI research complete for: ${userQuery}`,
        htmlContent,
        data: {},
        perplexityResponse,
      }
    }

    // Step 3: Fetch data from APIs for specific Story Protocol queries
    const fetchedData: Record<string, APIResponse> = {}

    for (const apiName of intentData.apis) {
      const params = intentData.parameters || {}

      switch (apiName) {
        case "listIPAssets":
          fetchedData[apiName] = await callAPI(
            () =>
              api.listIPAssets({
                pagination: { limit: params.limit || 30, offset: 0 },
                orderBy: "blockNumber",
                orderDirection: "desc",
              }),
            "listIPAssets",
          )
          break

        case "getIPAsset":
          if (params.assetId) {
            fetchedData[apiName] = await callAPI(() => api.getIPAsset(params.assetId), "getIPAsset")
          }
          break

        case "listRoyaltyPays":
          const royaltyOptions: any = {
            pagination: { limit: params.limit || 50, offset: 0 },
            orderBy: "blockNumber",
            orderDirection: "desc",
          }

          if (params.assetId) {
            royaltyOptions.where = {
              OR: [{ payerIpId: params.assetId }, { receiverIpId: params.assetId }],
            }
          }

          fetchedData[apiName] = await callAPI(() => api.listRoyaltyPays(royaltyOptions), "listRoyaltyPays")
          break

        case "listLatestTransactions":
          const txOptions: any = {
            pagination: { limit: params.limit || 50, offset: 0 },
            orderBy: "blockNumber",
            orderDirection: "desc",
          }

          if (params.assetId) {
            txOptions.where = { ipId: params.assetId }
          }

          fetchedData[apiName] = await callAPI(() => api.listLatestTransactions(txOptions), "listLatestTransactions")
          break

        case "listLicenseMintingFees":
          fetchedData[apiName] = await callAPI(
            () =>
              api.listLicenseMintingFees({
                pagination: { limit: params.limit || 30, offset: 0 },
                orderBy: "blockNumber",
                orderDirection: "desc",
              }),
            "listLicenseMintingFees",
          )
          break
      }
    }

    console.log("All enhanced fetched data:", fetchedData)

    // Step 4: Use Perplexity AI to analyze the blockchain data
    const dataAnalysisPrompt = `${ENHANCED_MASTER_PERPLEXITY_PROMPT.replace("{userQuery}", userQuery)
      .replace("{fetchedData}", JSON.stringify(fetchedData, null, 2))
      .replace("{intent}", intentData.intent)
      .replace("{currentTimestamp}", Math.floor(Date.now() / 1000).toString())}`

    const perplexityResponse = await callPerplexityAI(dataAnalysisPrompt)
    let htmlContent = perplexityResponse.choices[0]?.message?.content || ""

    // Clean and extract HTML
    htmlContent = htmlContent
      .replace(/```html\n?/g, "")
      .replace(/\n?```/g, "")
      .replace(/```/g, "")
      .trim()

    // Ensure we have proper HTML structure
    if (!htmlContent.includes("<div")) {
      htmlContent = `
        <div class="space-y-6 p-4">
          <div class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h3 class="text-blue-300 font-semibold mb-2">Enhanced Response</h3>
            <p class="text-white/80">${htmlContent}</p>
          </div>
        </div>
      `
    }

    // Validate HTML starts and ends properly
    if (!htmlContent.startsWith("<div")) {
      const match = htmlContent.match(/<div[\s\S]*<\/div>/i)
      if (match) {
        htmlContent = match[0]
      }
    }

    console.log("Final enhanced HTML content:", htmlContent)

    return {
      content: `Enhanced analysis complete for: ${userQuery}`,
      htmlContent,
      data: fetchedData,
      perplexityResponse,
    }
  } catch (error: any) {
    console.error("Enhanced agent error:", error)

    return {
      content: "I encountered an error processing your request.",
      htmlContent: `
        <div class="space-y-4 p-4">
          <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-red-400 font-semibold">Perplexity Processing Error</span>
            </div>
            <p class="text-red-300 mb-2">${error.message}</p>
            <p class="text-red-300/70 text-sm">The Perplexity AI engine encountered an issue. Please try a different query or contact support.</p>
            <div class="mt-3 p-3 bg-red-500/5 rounded border border-red-500/10">
              <p class="text-red-300/80 text-xs">Debug info: ${JSON.stringify({ error: error.message, timestamp: new Date().toISOString() })}</p>
            </div>
          </div>
        </div>
      `,
    }
  }
}
