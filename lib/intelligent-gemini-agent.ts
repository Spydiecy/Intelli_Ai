import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_KEY || "")

// MASTER PROMPT - This is the god prompt for perfect HTML generation
const MASTER_GEMINI_PROMPT = `
You are an EXPERT Story Protocol AI Assistant and HTML Generator. You MUST follow these rules EXACTLY:

## CRITICAL RULES:
1. ALWAYS respond with VALID HTML wrapped in <div> tags
2. Use ONLY Tailwind CSS classes (no custom CSS)
3. Generate COMPLETE, STATIC HTML pages with the fetched data
4. NEVER use placeholders - use REAL data from the API responses
5. Make responses VISUALLY STUNNING and MOBILE RESPONSIVE

## HTML STRUCTURE REQUIREMENTS:
- Start with: <div class="space-y-6 p-4">
- End with: </div>
- Use proper Tailwind classes for colors, spacing, typography
- Include icons using SVG (stroke-width="2")
- Make cards interactive with hover effects

## COLOR SCHEME:
- IP Assets: Blue theme (bg-blue-500/10, border-blue-500/20, text-blue-400)
- Royalties: Green theme (bg-green-500/10, border-green-500/20, text-green-400)
- Transactions: Orange theme (bg-orange-500/10, border-orange-500/20, text-orange-400)
- Minting Fees: Purple theme (bg-purple-500/10, border-purple-500/20, text-purple-400)
- Errors: Red theme (bg-red-500/10, border-red-500/20, text-red-400)

## DATA FORMATTING:
- ETH amounts: Convert from wei (divide by 10^18) and show 6 decimals
- Addresses: Show first 6 and last 4 characters with "..."
- Dates: Use readable format like "Dec 15, 2024"
- Numbers: Add commas for thousands

## RESPONSE TYPES:

### FOR IP ASSETS:
Generate a grid of asset cards showing:
- Asset image or placeholder
- Asset name and ID
- Block number and timestamp
- Asset type (Group/Individual)
- Children/Parent counts

### FOR ROYALTIES:
Generate royalty cards showing:
- Amount in ETH (formatted)
- Payer and receiver addresses
- Block number and date
- Total summary card at top

### FOR TRANSACTIONS:
Generate transaction list showing:
- Action type badge
- Transaction hash
- Initiator address
- IP Asset ID
- Block number and timestamp

### FOR MINTING FEES:
Generate fee cards showing:
- Fee amount in ETH
- Payer address
- Receiver IP ID
- Token address
- Block info

### FOR ERRORS:
Generate error card with:
- Error icon
- Clear error message
- Helpful suggestions

## EXAMPLE STRUCTURE:
<div class="space-y-6 p-4">
  <!-- Header with title and stats -->
  <div class="text-center">
    <h1 class="text-2xl font-bold text-white mb-2">Title Here</h1>
    <p class="text-white/70">Description here</p>
  </div>
  
  <!-- Summary cards if applicable -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <!-- Summary cards -->
  </div>
  
  <!-- Main content grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- Data cards here -->
  </div>
</div>

## CRITICAL: 
- NEVER use {variable} syntax
- NEVER use placeholder text
- ALWAYS use the ACTUAL data provided
- If no data, show proper empty state
- ALWAYS generate complete HTML

Now process this request:

USER QUERY: {userQuery}
FETCHED DATA: {fetchedData}
INTENT: {intent}

Generate COMPLETE HTML response:
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
}

// Enhanced API wrapper with better error handling
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

// Intent analysis with better API mapping
function analyzeIntent(userQuery: string): {
  intent: string
  apis: string[]
  parameters: any
  queryType: string
} {
  const query = userQuery.toLowerCase()

  // Asset-related queries
  if (query.includes("asset") || query.includes("ip") || query.includes("show all") || query.includes("list")) {
    if (query.includes("detail") || query.match(/0x[a-f0-9]{40}/i)) {
      const assetId = userQuery.match(/0x[a-fA-F0-9]{40}/)?.[0]
      return {
        intent: "asset_details",
        apis: ["getIPAsset", "getIPLicenseTerms", "listTransactions", "listRoyaltyPays"],
        parameters: { assetId, limit: 10 },
        queryType: "detail",
      }
    }
    return {
      intent: "list_assets",
      apis: ["listIPAssets"],
      parameters: { limit: 20 },
      queryType: "list",
    }
  }

  // Royalty-related queries
  if (query.includes("royalt") || query.includes("earning") || query.includes("payment")) {
    const assetId = userQuery.match(/0x[a-fA-F0-9]{40}/)?.[0]
    const limit = userQuery.match(/last\s+(\d+)/i)?.[1] || "20"

    return {
      intent: "royalty_analysis",
      apis: ["listRoyaltyPays"],
      parameters: { assetId, limit: Number.parseInt(limit) },
      queryType: "analytics",
    }
  }

  // Transaction-related queries
  if (query.includes("transaction") || query.includes("activity") || query.includes("history")) {
    const assetId = userQuery.match(/0x[a-fA-F0-9]{40}/)?.[0]
    const limit = userQuery.match(/last\s+(\d+)/i)?.[1] || "20"

    return {
      intent: "transaction_history",
      apis: ["listLatestTransactions"],
      parameters: { assetId, limit: Number.parseInt(limit) },
      queryType: "list",
    }
  }

  // Minting fee queries
  if (query.includes("minting") || query.includes("fee") || query.includes("cost")) {
    const limit = userQuery.match(/last\s+(\d+)/i)?.[1] || "20"

    return {
      intent: "minting_fees",
      apis: ["listLicenseMintingFees"],
      parameters: { limit: Number.parseInt(limit) },
      queryType: "analytics",
    }
  }

  // Default to assets
  return {
    intent: "list_assets",
    apis: ["listIPAssets"],
    parameters: { limit: 20 },
    queryType: "list",
  }
}

export async function enhancedIntelligentAgent(userQuery: string, api: any): Promise<AgentResponse> {
  try {
    console.log("Processing query:", userQuery)

    // Step 1: Analyze intent
    const intentData = analyzeIntent(userQuery)
    console.log("Intent analysis:", intentData)

    // Step 2: Fetch data from APIs
    const fetchedData: Record<string, APIResponse> = {}

    for (const apiName of intentData.apis) {
      const params = intentData.parameters || {}

      switch (apiName) {
        case "listIPAssets":
          fetchedData[apiName] = await callAPI(
            () =>
              api.listIPAssets({
                pagination: { limit: params.limit || 20, offset: 0 },
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

        case "getIPLicenseTerms":
          if (params.assetId) {
            fetchedData[apiName] = await callAPI(() => api.getIPLicenseTerms(params.assetId), "getIPLicenseTerms")
          }
          break

        case "listRoyaltyPays":
          const royaltyOptions: any = {
            pagination: { limit: params.limit || 20, offset: 0 },
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
            pagination: { limit: params.limit || 20, offset: 0 },
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
                pagination: { limit: params.limit || 20, offset: 0 },
                orderBy: "blockNumber",
                orderDirection: "desc",
              }),
            "listLicenseMintingFees",
          )
          break
      }
    }

    console.log("All fetched data:", fetchedData)

    // Step 3: Generate HTML response using the master prompt
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    })

    const prompt = MASTER_GEMINI_PROMPT.replace("{userQuery}", userQuery)
      .replace("{fetchedData}", JSON.stringify(fetchedData, null, 2))
      .replace("{intent}", intentData.intent)

    console.log("Sending prompt to Gemini...")
    const result = await model.generateContent(prompt)
    const response = await result.response
    let htmlContent = response.text()

    console.log("Raw Gemini response:", htmlContent)

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
            <h3 class="text-blue-300 font-semibold mb-2">Response</h3>
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

    console.log("Final HTML content:", htmlContent)

    return {
      content: `Analysis complete for: ${userQuery}`,
      htmlContent,
      data: fetchedData,
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-red-400 font-semibold">Processing Error</span>
            </div>
            <p class="text-red-300 mb-2">${error.message}</p>
            <p class="text-red-300/70 text-sm">Please try rephrasing your request or contact support if the issue persists.</p>
            <div class="mt-3 p-3 bg-red-500/5 rounded border border-red-500/10">
              <p class="text-red-300/80 text-xs">Debug info: ${JSON.stringify({ error: error.message, stack: error.stack?.slice(0, 200) })}</p>
            </div>
          </div>
        </div>
      `,
    }
  }
}
