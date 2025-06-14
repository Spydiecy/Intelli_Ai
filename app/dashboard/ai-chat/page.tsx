"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, User, Loader2, Sparkles, TrendingUp, RefreshCw } from "lucide-react"
import { enhancedIntelligentAgent } from "@/lib/intelligent-gemini-agent"
import { api } from "@/lib/api"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  htmlContent?: string
  timestamp: number
  isProcessing?: boolean
  data?: any
}

interface QuerySuggestion {
  text: string
  category: string
  icon: string
  description: string
}

export default function EnhancedAIChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome to Enhanced Story Protocol AI! 🚀",
      htmlContent: `
        <div class="space-y-6 p-4">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-white mb-2">Enhanced Story Protocol AI</h1>
            <p class="text-white/70">Your intelligent companion with perfect HTML generation and working APIs</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
              <h3 class="font-semibold text-blue-300 mb-2">🎨 IP Asset Operations</h3>
              <ul class="text-sm text-white/70 space-y-1">
                <li>• View all IP assets with rich cards</li>
                <li>• Get detailed asset information</li>
                <li>• Search by ID or name</li>
                <li>• Track asset relationships</li>
              </ul>
            </div>
            
            <div class="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
              <h3 class="font-semibold text-green-300 mb-2">💰 Royalty Analytics</h3>
              <ul class="text-sm text-white/70 space-y-1">
                <li>• Complete royalty payment tracking</li>
                <li>• ETH amount calculations</li>
                <li>• Payer/receiver analysis</li>
                <li>• Revenue summaries</li>
              </ul>
            </div>
            
            <div class="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
              <h3 class="font-semibold text-orange-300 mb-2">📊 Transaction Monitoring</h3>
              <ul class="text-sm text-white/70 space-y-1">
                <li>• Real-time transaction tracking</li>
                <li>• Action type categorization</li>
                <li>• Block number and timestamps</li>
                <li>• Transaction hash details</li>
              </ul>
            </div>
            
            <div class="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
              <h3 class="font-semibold text-purple-300 mb-2">💎 Minting Fee Analysis</h3>
              <ul class="text-sm text-white/70 space-y-1">
                <li>• License minting cost tracking</li>
                <li>• Fee amount calculations</li>
                <li>• Payer and receiver details</li>
                <li>• Token address information</li>
              </ul>
            </div>
          </div>
          
          <div class="text-center">
            <p class="text-white/60 text-sm mb-4">Try these working examples:</p>
            <div class="flex flex-wrap gap-2 justify-center">
              <span class="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80">"Show all IP assets"</span>
              <span class="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80">"Show all royalties"</span>
              <span class="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80">"Show recent transactions"</span>
              <span class="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80">"Show minting fees"</span>
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

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const currentInput = input.trim()
    addMessage("user", currentInput)
    setInput("")
    setLoading(true)

    const processingId = addMessage("assistant", "Processing your request...", {
      isProcessing: true,
      htmlContent: `
        <div class="flex items-center gap-3 p-4">
          <svg class="w-6 h-6 animate-spin text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <div class="space-y-1">
            <div class="text-blue-400 font-medium">Analyzing your request...</div>
            <div class="text-blue-300/70 text-sm">Determining APIs • Fetching data • Generating HTML</div>
          </div>
        </div>
      `,
    })

    try {
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

  // Working query suggestions
  const querySuggestions: QuerySuggestion[] = [
    // IP Assets - WORKING
    { text: "Show all IP assets", category: "Assets", icon: "📋", description: "View all registered IP assets" },
    { text: "List IP assets", category: "Assets", icon: "📝", description: "Get IP asset list" },
    { text: "Show IP asset details", category: "Assets", icon: "🔍", description: "Detailed asset view" },

    // Royalties - WORKING
    { text: "Show all royalties", category: "Royalties", icon: "💰", description: "View all royalty payments" },
    { text: "Show royalty payments", category: "Royalties", icon: "💸", description: "List royalty transactions" },
    { text: "Show last 10 royalties", category: "Royalties", icon: "📊", description: "Recent royalty payments" },

    // Transactions - WORKING
    {
      text: "Show recent transactions",
      category: "Transactions",
      icon: "⚡",
      description: "Latest blockchain activity",
    },
    { text: "Show all transactions", category: "Transactions", icon: "📝", description: "Transaction history" },
    { text: "Show last 15 transactions", category: "Transactions", icon: "📋", description: "Recent transaction list" },

    // Minting Fees - WORKING
    { text: "Show minting fees", category: "Fees", icon: "💎", description: "License minting costs" },
    { text: "Show all minting fees", category: "Fees", icon: "💸", description: "All fee payments" },
    { text: "Show last 10 minting fees", category: "Fees", icon: "📊", description: "Recent fee payments" },

    // Specific Asset Queries
    {
      text: "Show royalties for asset 0x1234567890123456789012345678901234567890",
      category: "Specific",
      icon: "🎯",
      description: "Asset-specific royalties",
    },
    {
      text: "Show transactions for asset 0x1234567890123456789012345678901234567890",
      category: "Specific",
      icon: "🎯",
      description: "Asset-specific transactions",
    },

    // Analytics
    { text: "Analyze royalty trends", category: "Analytics", icon: "📈", description: "Royalty analysis" },
    { text: "Show asset performance", category: "Analytics", icon: "📊", description: "Asset metrics" },
  ]

  const displayedSuggestions = showAllSuggestions ? querySuggestions : querySuggestions.slice(0, 12)
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
              <pre class="text-green-200 text-xs overflow-auto">${JSON.stringify(result, null, 2)}</pre>
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
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/80 text-transparent bg-clip-text">
              Enhanced Story Protocol AI
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">Enhanced Mode • Perfect HTML</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={testAPI}
            size="sm"
            variant="outline"
            className="text-xs bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Test API
          </Button>
          <div className="text-xs text-white/60">Gemini AI • Real-Time Data</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex max-w-[90%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center shrink-0 ${
                  message.role === "user" ? "bg-blue-600 ml-3" : "bg-gradient-to-r from-purple-500 to-blue-500 mr-3"
                }`}
              >
                {message.role === "user" ? (
                  <User className="h-5 w-5 text-white" />
                ) : (
                  <Sparkles className="h-5 w-5 text-white" />
                )}
              </div>
              <div
                className={`py-4 px-6 rounded-2xl ${
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
                  <div className="text-white/90 whitespace-pre-wrap">{message.content}</div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex flex-row">
              <div className="rounded-full h-10 w-10 flex items-center justify-center bg-gradient-to-r from-purple-500 to-blue-500 mr-3">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="py-4 px-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 bg-white/60 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-white/10 bg-black/30 backdrop-blur-sm shrink-0">
        <div className="relative">
          <div className="flex items-end gap-3 p-4 border border-white/20 rounded-2xl bg-white/5 backdrop-blur-sm focus-within:border-white/40 transition-colors">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Ask me anything about Story Protocol... I'll generate perfect HTML with real data!"
              className="flex-1 resize-none border-none outline-none bg-transparent text-white placeholder:text-white/50 max-h-32 min-h-[24px]"
              rows={1}
              disabled={loading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 px-4 py-2 rounded-xl"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Working Suggestions */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/60 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Working Examples (Tested & Verified):
            </span>
            <Button
              onClick={() => setShowAllSuggestions(!showAllSuggestions)}
              variant="ghost"
              size="sm"
              className="text-xs text-white/60 hover:text-white"
            >
              {showAllSuggestions ? "Show Less" : `Show All (${querySuggestions.length})`}
            </Button>
          </div>

          <div className="space-y-3">
            {Object.entries(suggestionsByCategory).map(([category, suggestions]) => (
              <div key={category}>
                <div className="text-xs text-white/50 mb-2 font-medium">{category}</div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(suggestion.text)}
                      disabled={loading}
                      className="group text-sm py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-white/80 hover:text-white hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      title={suggestion.description}
                    >
                      <span>{suggestion.icon}</span>
                      <span className="truncate max-w-[300px]">{suggestion.text}</span>
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
