"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, User, Loader2, TrendingUp, RefreshCw, Search, Globe } from "lucide-react"
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
  perplexityResponse?: any
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
      content: "Welcome to Enhanced Story Protocol AI with Perplexity! 🚀",
      htmlContent: `
        <div class="space-y-8 p-6">
          <div class="text-center">
            <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-white mb-3">Enhanced Story Protocol AI</h1>
            <p class="text-white/70 text-lg">Powered by Perplexity AI • Web Search • Real-time Analytics • Citations</p>
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
              <h3 class="font-semibold text-green-300 mb-3 text-lg">💰 Real-Time Analytics</h3>
              <ul class="text-sm text-white/70 space-y-2">
                <li>• Today's royalty payments</li>
                <li>• Highest earning assets</li>
                <li>• ETH amount calculations</li>
                <li>• Revenue summaries</li>
              </ul>
            </div>
            
            <div class="p-6 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20">
              <h3 class="font-semibold text-orange-300 mb-3 text-lg">🔍 Web Research</h3>
              <ul class="text-sm text-white/70 space-y-2">
                <li>• Live web search results</li>
                <li>• Verified citations</li>
                <li>• Real-time information</li>
                <li>• Source verification</li>
              </ul>
            </div>
            
            <div class="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
              <h3 class="font-semibold text-purple-300 mb-3 text-lg">🤖 Perplexity AI</h3>
              <ul class="text-sm text-white/70 space-y-2">
                <li>• Advanced reasoning</li>
                <li>• Web-enhanced responses</li>
                <li>• Citation tracking</li>
                <li>• Real data validation</li>
              </ul>
            </div>
          </div>
          
          <div class="text-center">
            <p class="text-white/60 text-base mb-6">Try these enhanced queries with Perplexity AI:</p>
            <div class="flex flex-wrap gap-3 justify-center">
              <span class="px-4 py-2 bg-white/10 rounded-full text-sm text-white/80">"What is Story Protocol?"</span>
              <span class="px-4 py-2 bg-white/10 rounded-full text-sm text-white/80">"Show today's royalties"</span>
              <span class="px-4 py-2 bg-white/10 rounded-full text-sm text-white/80">"Latest blockchain news"</span>
              <span class="px-4 py-2 bg-white/10 rounded-full text-sm text-white/80">"IP asset trends"</span>
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
      perplexityResponse?: any
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
    const processingId = addMessage("user", currentInput)
    setInput("")
    setLoading(true)

    try {
      console.log("Starting enhanced agent processing with Perplexity...")
      const response = await enhancedIntelligentAgent(currentInput, api)
      console.log("Perplexity agent response received:", response)

      updateMessage(processingId, {
        content: response.content || "Here's what I found with web research:",
        htmlContent: response.htmlContent,
        data: response.data,
        perplexityResponse: response.perplexityResponse,
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
                <span class="text-red-400 font-semibold">Perplexity Processing Error</span>
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

  // Enhanced query suggestions with Perplexity focus
  const querySuggestions: QuerySuggestion[] = [
    // General Research
    {
      text: "What is Story Protocol?",
      category: "General Research",
      icon: "🔍",
      description: "Learn about Story Protocol with web research",
    },
    {
      text: "Latest blockchain news",
      category: "General Research",
      icon: "📰",
      description: "Get latest blockchain and crypto news",
    },
    {
      text: "IP licensing trends 2024",
      category: "General Research",
      icon: "📈",
      description: "Research current IP licensing trends",
    },

    // Story Protocol Data
    {
      text: "Show all IP assets",
      category: "Story Protocol Data",
      icon: "📋",
      description: "View all registered IP assets",
    },
    {
      text: "Show today's royalties",
      category: "Story Protocol Data",
      icon: "💰",
      description: "Today's royalty payments with analysis",
    },
    {
      text: "Show today's transactions",
      category: "Story Protocol Data",
      icon: "⚡",
      description: "Today's blockchain activity",
    },

    // Performance Analytics
    {
      text: "Show highest royalty payments",
      category: "Performance Analytics",
      icon: "🏆",
      description: "Top earning transactions",
    },
    {
      text: "Show top earning assets",
      category: "Performance Analytics",
      icon: "💎",
      description: "Assets by total revenue",
    },
    {
      text: "Show highest transaction volumes",
      category: "Performance Analytics",
      icon: "📊",
      description: "Most active assets",
    },

    // Web Research
    {
      text: "How does blockchain IP work?",
      category: "Web Research",
      icon: "🌐",
      description: "Research blockchain IP concepts",
    },
    {
      text: "NFT royalty systems comparison",
      category: "Web Research",
      icon: "🔗",
      description: "Compare different royalty systems",
    },
    {
      text: "Intellectual property on blockchain",
      category: "Web Research",
      icon: "🛡️",
      description: "Research IP protection on blockchain",
    },
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
              <h3 class="text-green-300 font-semibold mb-2">✅ API Test Successful with Perplexity</h3>
              <pre class="text-green-200 text-xs overflow-auto bg-green-500/5 p-2 rounded max-h-40">${JSON.stringify(result, null, 2)}</pre>
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
              <h3 class="text-red-400 font-semibold mb-2">❌ API Test Failed</h3>
              <p class="text-red-300 mb-2">${error.message}</p>
              <p class="text-red-300/70 text-sm">Please check your internet connection or contact support.</p>
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
              <Search className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 text-transparent bg-clip-text">
              Enhanced Story Protocol AI
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-purple-400">Perplexity AI • Web Search • Real Citations</span>
            </div>
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
          <div className="text-sm text-white/60 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Perplexity AI • Web Research • Real-Time Data
          </div>
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
                  <Search className="h-6 w-6 text-white" />
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
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex flex-row">
              <div className="rounded-full h-12 w-12 flex items-center justify-center bg-gradient-to-r from-purple-500 to-blue-500 mr-4">
                <Search className="h-6 w-6 text-white" />
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
              placeholder="Ask me anything... I'll search the web and analyze Story Protocol data with Perplexity AI!"
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
              Perplexity AI Enhanced Queries (Web Search + Data):
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
                      disabled={loading}
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
