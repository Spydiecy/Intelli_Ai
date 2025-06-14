
"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, User, Loader2, Sparkles, TrendingUp, RefreshCw, Upload, CheckCircle } from "lucide-react"
import { enhancedIntelligentAgent } from "@/lib/intelligent-gemini-agent"
import { api } from "@/lib/api"
import { createIPAsset, type CreateIPAssetParams } from "@/lib/create-story-asset"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  htmlContent?: string
  timestamp: number
  isProcessing?: boolean
  data?: any
  requiresInput?: boolean
  inputType?: "text" | "file" | "confirm"
  inputPlaceholder?: string
  stepData?: any
}

interface QuerySuggestion {
  text: string
  category: string
  icon: string
  description: string
}

interface CreateAssetFlow {
  active: boolean
  step: number
  data: {
    title?: string
    description?: string
    creatorName?: string
    imageFile?: File
    imageUrl?: string
  }
}

export default function EnhancedAIChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome to Enhanced Story Protocol AI! 🚀",
      htmlContent: `
        <div class="space-y-8 p-6">
          <div class="text-center">
            <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-white mb-3">Enhanced Story Protocol AI</h1>
            <p class="text-white/70 text-lg">Your intelligent companion with perfect HTML generation, real-time analytics, and IP asset creation</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
              <h3 class="font-semibold text-blue-300 mb-3 text-lg">🎨 IP Asset Operations</h3>
              <ul class="text-sm text-white/70 space-y-2">
                <li>• Create new IP assets</li>
                <li>• View all assets with rich cards</li>
                <li>• Get detailed asset information</li>
                <li>• Search by ID or name</li>
              </ul>
            </div>
            
            <div class="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
              <h3 class="font-semibold text-green-300 mb-3 text-lg">💰 Royalty Analytics</h3>
              <ul class="text-sm text-white/70 space-y-2">
                <li>• Today's royalty payments</li>
                <li>• Highest earning assets</li>
                <li>• ETH amount calculations</li>
                <li>• Revenue summaries</li>
              </ul>
            </div>
            
            <div class="p-6 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20">
              <h3 class="font-semibold text-orange-300 mb-3 text-lg">📊 Transaction Analytics</h3>
              <ul class="text-sm text-white/70 space-y-2">
                <li>• Today's transactions</li>
                <li>• Highest value transfers</li>
                <li>• Real-time activity tracking</li>
                <li>• Transaction categorization</li>
              </ul>
            </div>
            
            <div class="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
              <h3 class="font-semibold text-purple-300 mb-3 text-lg">💎 Advanced Features</h3>
              <ul class="text-sm text-white/70 space-y-2">
                <li>• Minting fee analysis</li>
                <li>• Time-based filtering</li>
                <li>• Performance rankings</li>
                <li>• Custom analytics</li>
              </ul>
            </div>
          </div>
          
          <div class="text-center">
            <p class="text-white/60 text-base mb-6">Try these enhanced queries:</p>
            <div class="flex flex-wrap gap-3 justify-center">
              <span class="px-4 py-2 bg-white/10 rounded-full text-sm text-white/80">"Create new IP asset"</span>
              <span class="px-4 py-2 bg-white/10 rounded-full text-sm text-white/80">"Show today's royalties"</span>
              <span class="px-4 py-2 bg-white/10 rounded-full text-sm text-white/80">"Highest earning assets"</span>
              <span class="px-4 py-2 bg-white/10 rounded-full text-sm text-white/80">"Today's transactions"</span>
            </div>
          </div>
        </div>
      `,
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showAllSuggestions, setShowAllSuggestions] = useState(false)
  const [createAssetFlow, setCreateAssetFlow] = useState<CreateAssetFlow>({
    active: false,
    step: 0,
    data: {},
  })

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const addMessage = (
    role: "user" | "assistant",
    content: string,
    options: {
      htmlContent?: string
      data?: any
      isProcessing?: boolean
      requiresInput?: boolean
      inputType?: "text" | "file" | "confirm"
      inputPlaceholder?: string
      stepData?: any
    } = {},
  ) => {
    const message: Message = {
      id: Date.now().toString() + Math.random(),
      role,
      content,
      timestamp: Date.now(),
      ...options,
    }
    setMessages((prev) => [...prev, message])
    return message.id
  }

  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)))
  }

  // Handle Create Asset Flow
  const handleCreateAssetFlow = async (userInput: string) => {
    const { step, data } = createAssetFlow

    switch (step) {
      case 1: // Asset Title
        setCreateAssetFlow({
          ...createAssetFlow,
          step: 2,
          data: { ...data, title: userInput },
        })
        addMessage("assistant", `✅ **Asset Title:** ${userInput}`, {
          htmlContent: `
              <div class="space-y-4 p-4">
                <div class="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span class="text-green-300 font-semibold">Asset Title Set</span>
                  </div>
                  <p class="text-white/80">${userInput}</p>
                </div>
                <div class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h3 class="text-blue-300 font-semibold mb-2">📝 Step 2/4: Asset Description</h3>
                  <p class="text-white/70">Please provide a detailed description for your IP asset:</p>
                </div>
              </div>
            `,
          requiresInput: true,
          inputType: "text",
          inputPlaceholder: "Enter asset description...",
        })
        break

      case 2: // Description
        setCreateAssetFlow({
          ...createAssetFlow,
          step: 3,
          data: { ...data, description: userInput },
        })
        addMessage("assistant", `✅ **Description:** ${userInput}`, {
          htmlContent: `
              <div class="space-y-4 p-4">
                <div class="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span class="text-green-300 font-semibold">Description Set</span>
                  </div>
                  <p class="text-white/80">${userInput}</p>
                </div>
                <div class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h3 class="text-blue-300 font-semibold mb-2">👤 Step 3/4: Creator Name</h3>
                  <p class="text-white/70">What's your creator name?</p>
                </div>
              </div>
            `,
          requiresInput: true,
          inputType: "text",
          inputPlaceholder: "Enter creator name...",
        })
        break

      case 3: // Creator Name
        setCreateAssetFlow({
          ...createAssetFlow,
          step: 4,
          data: { ...data, creatorName: userInput },
        })
        addMessage("assistant", `✅ **Creator:** ${userInput}`, {
          htmlContent: `
              <div class="space-y-4 p-4">
                <div class="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span class="text-green-300 font-semibold">Creator Name Set</span>
                  </div>
                  <p class="text-white/80">${userInput}</p>
                </div>
                <div class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h3 class="text-blue-300 font-semibold mb-2">🖼️ Step 4/4: Asset Image</h3>
                  <p class="text-white/70">Would you like to upload an image for your IP asset?</p>
                </div>
              </div>
            `,
          requiresInput: true,
          inputType: "file",
          inputPlaceholder: "Upload image or type 'skip'...",
        })
        break

      case 4: // Image Upload or Skip
        const processingId = addMessage("assistant", "🚀 **Creating your IP asset...**", {
          isProcessing: true,
          htmlContent: `
            <div class="flex items-center gap-4 p-6">
              <svg class="w-8 h-8 animate-spin text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <div class="space-y-2">
                <div class="text-blue-400 font-medium text-lg">Creating your IP asset...</div>
                <div class="text-blue-300/70">Registering on Story Protocol blockchain</div>
              </div>
            </div>
          `,
        })

        try {
          const assetParams: CreateIPAssetParams = {
            title: data.title!,
            description: data.description!,
            creatorName: data.creatorName!,
            imageFile: data.imageFile,
          }

          const result = await createIPAsset(assetParams)

          updateMessage(processingId, {
            content: `🎉 IP Asset Created Successfully!`,
            htmlContent: `
              <div class="space-y-6 p-6">
                <div class="text-center">
                  <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h2 class="text-2xl font-bold text-green-400 mb-2">🎉 IP Asset Created Successfully!</h2>
                  <p class="text-green-300">Your intellectual property is now protected on Story Protocol!</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h3 class="text-blue-300 font-semibold mb-3">📋 Asset Details</h3>
                    <div class="space-y-2 text-sm">
                      <div><span class="text-white/60">Name:</span> <span class="text-white">${data.title}</span></div>
                      <div><span class="text-white/60">IP Asset ID:</span> <span class="text-white font-mono">${result.ipId.slice(0, 10)}...${result.ipId.slice(-8)}</span></div>
                      <div><span class="text-white/60">Token ID:</span> <span class="text-white">${result.tokenId}</span></div>
                      <div><span class="text-white/60">Creator:</span> <span class="text-white">${data.creatorName}</span></div>
                    </div>
                  </div>

                  <div class="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <h3 class="text-purple-300 font-semibold mb-3">🔗 Blockchain Info</h3>
                    <div class="space-y-2 text-sm">
                      <div><span class="text-white/60">Contract:</span> <span class="text-white font-mono">${result.spgNftContract.slice(0, 10)}...${result.spgNftContract.slice(-8)}</span></div>
                      <div><span class="text-white/60">Wallet:</span> <span class="text-white font-mono">${result.walletAddress.slice(0, 10)}...${result.walletAddress.slice(-8)}</span></div>
                      <div><span class="text-white/60">TX Hash:</span> <span class="text-white font-mono">${result.txHash.slice(0, 10)}...${result.txHash.slice(-8)}</span></div>
                    </div>
                  </div>
                </div>

                <div class="flex flex-wrap gap-3 justify-center">
                  <a href="${result.explorerUrl}" target="_blank" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                    View on Explorer
                  </a>
                  <a href="${result.ipMetadataUri}" target="_blank" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">
                    IP Metadata
                  </a>
                  <a href="${result.nftMetadataUri}" target="_blank" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
                    NFT Metadata
                  </a>
                </div>
              </div>
            `,
            isProcessing: false,
          })

          // Reset flow
          setCreateAssetFlow({ active: false, step: 0, data: {} })
        } catch (error: any) {
          updateMessage(processingId, {
            content: `❌ **Error creating IP asset:** ${error.message}`,
            htmlContent: `
              <div class="space-y-4 p-4">
                <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="text-red-400 font-semibold">Creation Failed</span>
                  </div>
                  <p class="text-red-300">${error.message}</p>
                  <p class="text-red-300/70 text-sm mt-2">Please try again or contact support if the issue persists.</p>
                </div>
              </div>
            `,
            isProcessing: false,
          })
          setCreateAssetFlow({ active: false, step: 0, data: {} })
        }
        break
    }
  }

  const renderInputField = (message: Message) => {
    if (!message.requiresInput) return null

    if (message.inputType === "file") {
      return (
        <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                setCreateAssetFlow((prev) => ({
                  ...prev,
                  data: { ...prev.data, imageFile: file },
                }))
                handleCreateAssetFlow("Image uploaded")
              }
            }}
            className="hidden"
          />
          <div className="flex gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Image
            </Button>
            <Button
              onClick={() => handleCreateAssetFlow("skip")}
              variant="outline"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              Skip Image
            </Button>
          </div>
        </div>
      )
    }

    return null
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const currentInput = input.trim()
    addMessage("user", currentInput)
    setInput("")
    setLoading(true)

    try {
      // Handle active flows first
      if (createAssetFlow.active) {
        await handleCreateAssetFlow(currentInput)
        setLoading(false)
        return
      }

      // Check for create asset intent
      if (currentInput.toLowerCase().includes("create") && (currentInput.toLowerCase().includes("asset") || currentInput.toLowerCase().includes("ip"))) {
        setCreateAssetFlow({ active: true, step: 1, data: {} })
        addMessage("assistant", `🎨 Create New IP Asset`, {
          htmlContent: `
              <div class="space-y-6 p-6">
                <div class="text-center">
                  <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                  </div>
                  <h2 class="text-2xl font-bold text-white mb-2">🎨 Create New IP Asset</h2>
                  <p class="text-white/70">Let's register your intellectual property on Story Protocol!</p>
                </div>

                <div class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h3 class="text-blue-300 font-semibold mb-2">📝 Step 1/4: Asset Title</h3>
                  <p class="text-white/70">What's the name/title of your IP asset?</p>
                </div>
              </div>
            `,
          requiresInput: true,
          inputType: "text",
          inputPlaceholder: "Enter asset name...",
        })
        setLoading(false)
        return
      }

      const processingId = addMessage("assistant", "Processing your request...", {
        isProcessing: true,
        htmlContent: `
          <div class="flex items-center gap-4 p-6">
            <svg class="w-8 h-8 animate-spin text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <div class="space-y-2">
              <div class="text-blue-400 font-medium text-lg">Analyzing your request...</div>
              <div class="text-blue-300/70">Determining APIs • Fetching data • Generating HTML</div>
            </div>
          </div>
        `,
      })

      console.log("Starting enhanced agent processing...")
      const response = await enhancedIntelligentAgent(currentInput, api)
      console.log("Agent response received:", response)

      updateMessage(processingId, {
        content: response.content || "Here's what I found:",
        htmlContent: response.htmlContent,
        data: response.data,
        isProcessing: false,
      })
    } catch (error: any) {
      console.error("Error in handleSendMessage:", error)
      const processingId = addMessage("assistant", "Processing your request...", {
        isProcessing: true,
      })
      updateMessage(processingId, {
        content: "I encountered an error processing your request.",
        htmlContent: `
          <div class="space-y-4 p-4">
            <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-red-400 font-semibold">Processing Error</span>
              </div>
              <p class="text-red-300 mb-2">${error.message}</p>
              <p class="text-red-300/70 text-sm">Please try one of the suggested queries below or contact support.</p>
            </div>
          </div>
        `,
        isProcessing: false,
      })
    } finally {
      setLoading(false)
    }
  }

  // Enhanced query suggestions with more specific analytics
  const querySuggestions: QuerySuggestion[] = [
    // IP Assets
    { text: "Show all IP assets", category: "Assets", icon: "📋", description: "View all registered IP assets" },
    { text: "Create new IP asset", category: "Assets", icon: "🎨", description: "Register new intellectual property" },
    { text: "Show highest value IP assets", category: "Assets", icon: "💎", description: "Most valuable assets by royalties" },

    // Time-based Analytics
    { text: "Show today's royalties", category: "Today's Data", icon: "💰", description: "Today's royalty payments" },
    { text: "Show today's transactions", category: "Today's Data", icon: "⚡", description: "Today's blockchain activity" },
    { text: "Show today's minting fees", category: "Today's Data", icon: "💎", description: "Today's minting costs" },

    // Performance Analytics
    { text: "Show highest royalty payments", category: "Performance", icon: "📈", description: "Top earning transactions" },
    { text: "Show top earning assets", category: "Performance", icon: "🏆", description: "Assets by total revenue" },
    { text: "Show highest transaction volumes", category: "Performance", icon: "📊", description: "Most active assets" },

    // Recent Activity
    { text: "Show recent transactions", category: "Recent Activity", icon: "⚡", description: "Latest blockchain activity" },
    { text: "Show latest royalty payments", category: "Recent Activity", icon: "💸", description: "Recent royalty transactions" },
    { text: "Show recent asset registrations", category: "Recent Activity", icon: "🆕", description: "Newly created assets" },

    // Analytics Queries
    { text: "Analyze royalty trends", category: "Analytics", icon: "📈", description: "Royalty payment analysis" },
    { text: "Show asset performance metrics", category: "Analytics", icon: "📊", description: "Comprehensive asset stats" },
    { text: "Show revenue distribution", category: "Analytics", icon: "🎯", description: "Revenue by asset/creator" },
    
    // Specific Searches
    { text: "Show assets with highest fees", category: "Specific", icon: "💰", description: "Assets generating most fees" },
    { text: "Show most active creators", category: "Specific", icon: "👥", description: "Creators by transaction count" },
    { text: "Show largest single payments", category: "Specific", icon: "💸", description: "Biggest individual transactions" },
  ]

  const displayedSuggestions = showAllSuggestions ? querySuggestions : querySuggestions.slice(0, 15)
  const suggestionsByCategory = displayedSuggestions.reduce(
    (acc, suggestion) => {
      if (!acc[suggestion.category]) acc[suggestion.category] = []
      acc[suggestion.category].push(suggestion)
      return acc
    },
    {} as Record<string, QuerySuggestion[]>,
  )

  const testAPI = async () => {
    console.log("Testing API connection...")
    try {
      const result = await api.listIPAssets({ pagination: { limit: 5 } })
      console.log("API test result:", result)

      addMessage("assistant", "API Test Results", {
        htmlContent: `
          <div class="space-y-4 p-4">
            <div class="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <h3 class="text-green-300 font-semibold mb-2">✅ API Test Successful</h3>
              <pre class="text-green-200 text-xs overflow-auto bg-green-500/5 p-2 rounded">${JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        `,
      })
    } catch (error: any) {
      console.error("API test failed:", error)
      addMessage("assistant", "API Test Failed", {
        htmlContent: `
          <div class="space-y-4 p-4">
            <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <h3 class="text-red-300 font-semibold mb-2">❌ API Test Failed</h3>
              <p class="text-red-200">${error.message}</p>
            </div>
          </div>
        `,
      })
    }
  }

  return (
    <div className="flex flex-col h-fit w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Enhanced Header */}
      <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 text-transparent bg-clip-text">
              Enhanced Story Protocol AI
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">Enhanced Mode • Perfect Analytics</span>
            </div>
            {createAssetFlow.active && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-blue-400">Asset Creation Mode</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={testAPI}
            size="sm"
            variant="outline"
            className="text-xs bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Test API
          </Button>
          <div className="text-sm text-white/60">Gemini AI • Real-Time Data • IP Creation</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex max-w-[95%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div
                className={`rounded-full h-12 w-12 flex items-center justify-center shrink-0 ${
                  message.role === "user" ? "bg-blue-600 ml-4" : "bg-gradient-to-r from-purple-500 to-blue-500 mr-4"
                }`}
              >
                {message.role === "user" ? (
                  <User className="h-6 w-6 text-white" />
                ) : (
                  <Sparkles className="h-6 w-6 text-white" />
                )}
              </div>
              <div
                className={`py-6 px-8 rounded-2xl ${
                  message.role === "user"
                    ? "bg-blue-600/20 border border-blue-500/30"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                {message.htmlContent ? (
                  <div
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: message.htmlContent }}
                  />
                ) : (
                  <div className="text-white/90 whitespace-pre-wrap text-lg">{message.content}</div>
                )}
                {renderInputField(message)}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex flex-row">
              <div className="rounded-full h-12 w-12 flex items-center justify-center bg-gradient-to-r from-purple-500 to-blue-500 mr-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="py-6 px-8 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex space-x-3">
                  <div className="h-3 w-3 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-3 w-3 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-3 w-3 bg-white/60 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <div className="p-8 border-t border-white/10 bg-black/30 backdrop-blur-sm shrink-0">
        <div className="relative">
          <div className="flex items-end gap-4 p-6 border border-white/20 rounded-2xl bg-white/5 backdrop-blur-sm focus-within:border-white/40 transition-colors">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder={
                createAssetFlow.active
                  ? "Enter the requested information..."
                  : "Ask me anything about Story Protocol... Create IP assets, analyze trends, or get real-time data!"
              }
              className="flex-1 resize-none border-none outline-none bg-transparent text-white placeholder:text-white/50 max-h-40 min-h-[32px] text-lg"
              rows={1}
              disabled={loading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 px-6 py-3 rounded-xl"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Enhanced Working Suggestions */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-base text-white/60 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Enhanced Query Examples (Tested & Verified):
            </span>
            <Button
              onClick={() => setShowAllSuggestions(!showAllSuggestions)}
              variant="ghost"
              size="sm"
              className="text-sm text-white/60 hover:text-white"
            >
              {showAllSuggestions ? "Show Less" : `Show All (${querySuggestions.length})`}
            </Button>
          </div>

          <div className="space-y-4">
            {Object.entries(suggestionsByCategory).map(([category, suggestions]) => (
              <div key={category}>
                <div className="text-sm text-white/50 mb-3 font-medium">{category}</div>
                <div className="flex flex-wrap gap-3">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(suggestion.text)}
                      disabled={loading || createAssetFlow.active}
                      className="group text-sm py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-white/80 hover:text-white hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      title={suggestion.description}
                    >
                      <span className="text-base">{suggestion.icon}</span>
                      <span className="truncate max-w-[400px]">{suggestion.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}