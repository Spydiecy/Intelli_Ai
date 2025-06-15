"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, User, TrendingUp, RefreshCw, Search, Globe, Mic, MicOff, Upload, CheckCircle, Wallet } from "lucide-react"
import { enhancedIntelligentAgent } from "@/lib/intelligent-gemini-agent"
import { api } from "@/lib/api"
import {fixedGaiaAgent} from "@/lib/gaia-agent"
import { debridgeApi } from "@/lib/debridge-api"
import { createIPAsset, type CreateIPAssetParams } from "@/lib/create-story-asset"
import { useWallet } from "@/contexts/WalletContext"

// Fix TypeScript declarations for Speech Recognition
interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  htmlContent?: string
  timestamp: number
  isProcessing?: boolean
  data?: any
  requiresInput?: boolean
  inputType?: "text" | "file" | "confirm" | "token-select" | "wallet-address"
  inputPlaceholder?: string
  stepData?: any
  requiresCreateAsset?: boolean
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

interface VoiceRecognition {
  isListening: boolean
  isSupported: boolean
  recognition?: SpeechRecognition
}

export default function EnhancedAIChatPage() {
  const { connected, publicKey, connectWallet, openConnectModal } = useWallet()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome to Enhanced Story Protocol AI! 🚀",
      htmlContent: `
        <div class="space-y-6">
          <div class="text-center">
        
            <h1 class="text-2xl font-bold text-white mb-2">Enhanced Story Protocol AI</h1>
            <p class="text-gray-400">Real-time analytics • Voice input • IP Token calculations • Gaia AI</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 bg-black rounded-lg border border-gray-700">
              <h3 class="font-semibold text-white mb-2 flex items-center gap-2">
                🎨 IP Asset Operations
              </h3>
              <ul class="text-sm text-gray-400 space-y-1">
                <li>• Create new IP assets</li>
                <li>• View all assets with rich cards</li>
                <li>• Get detailed asset information</li>
                <li>• IP Token calculations and analytics</li>
              </ul>
            </div>
            
            <div class="p-4 bg-black rounded-lg border border-gray-700">
              <h3 class="font-semibold text-white mb-2 flex items-center gap-2">
                💰 Advanced Analytics
              </h3>
              <ul class="text-sm text-gray-400 space-y-1">
                <li>• Today's royalty payments in IP tokens</li>
                <li>• Highest earning assets</li>
                <li>• Performance rankings</li>
                <li>• Real-time calculations</li>
              </ul>
            </div>
            
            <div class="p-4 bg-black rounded-lg border border-gray-700">
              <h3 class="font-semibold text-white mb-2 flex items-center gap-2">
                🔍 Gaia AI
              </h3>
              <ul class="text-sm text-gray-400 space-y-1">
                <li>• Advanced reasoning</li>
                <li>• General question answering</li>
                <li>• Real-time information</li>
                <li>• Simplified responses</li>
              </ul>
            </div>
            
            <div class="p-4 bg-black rounded-lg border border-gray-700">
              <h3 class="font-semibold text-white mb-2 flex items-center gap-2">
                🎤 Voice & Features
              </h3>
              <ul class="text-sm text-gray-400 space-y-1">
                <li>• Voice input support</li>
                <li>• Step-by-step asset creation</li>
                <li>• Real-time voice recognition</li>
                <li>• Small icons optimization</li>
              </ul>
            </div>
          </div>
          
          <div class="text-center">
            <p class="text-gray-500 mb-4">Try these enhanced queries:</p>
            <div class="flex flex-wrap gap-2 justify-center">
              <span class="px-3 py-1.5 bg-gray-900 rounded-full text-sm text-gray-300 border border-gray-700">"Create new IP asset"</span>
              <span class="px-3 py-1.5 bg-gray-900 rounded-full text-sm text-gray-300 border border-gray-700">"Show today's royalties"</span>
              <span class="px-3 py-1.5 bg-gray-900 rounded-full text-sm text-gray-300 border border-gray-700">"What is blockchain?"</span>
              <span class="px-3 py-1.5 bg-gray-900 rounded-full text-sm text-gray-300 border border-gray-700">"Show all IP assets"</span>
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
  const [voiceRecognition, setVoiceRecognition] = useState<VoiceRecognition>({
    isListening: false,
    isSupported: false,
    recognition: undefined
  })

  // Initialize voice recognition with proper TypeScript handling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass()
        
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'

        recognition.onstart = () => {
          setVoiceRecognition(prev => ({ ...prev, isListening: true }))
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript
          setInput(transcript)
          setVoiceRecognition(prev => ({ ...prev, isListening: false }))
          
          // Auto-send the message after a short delay to show the transcript
          setTimeout(() => {
            if (transcript.trim()) {
              setInput(transcript)
              // Trigger send message automatically
              const sendEvent = new Event('voiceSend')
              document.dispatchEvent(sendEvent)
            }
          }, 500)
        }

        recognition.onerror = () => {
          setVoiceRecognition(prev => ({ ...prev, isListening: false }))
        }

        recognition.onend = () => {
          setVoiceRecognition(prev => ({ ...prev, isListening: false }))
        }

        setVoiceRecognition({
          isListening: false,
          isSupported: true,
          recognition
        })
      }
    }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Expose wallet connection function globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).connectWallet = () => {
        if (openConnectModal) {
          openConnectModal()
        } else {
          connectWallet()
        }
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).connectWallet
      }
    }
  }, [openConnectModal, connectWallet])

  // Keyboard shortcuts for voice input and auto-send
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + M to toggle voice input
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'M') {
        event.preventDefault()
        if (voiceRecognition.isSupported) {
          if (voiceRecognition.isListening) {
            stopVoiceRecognition()
          } else {
            startVoiceRecognition()
          }
        }
      }
    }

    const handleVoiceSend = () => {
      handleSendMessage()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('voiceSend', handleVoiceSend)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('voiceSend', handleVoiceSend)
    }
  }, [voiceRecognition.isListening, voiceRecognition.isSupported, input])

  const addMessage = (
    role: "user" | "assistant",
    content: string,
    options: {
      htmlContent?: string
      data?: any
      isProcessing?: boolean
      requiresInput?: boolean
      inputType?: "text" | "file" | "confirm" | "token-select" | "wallet-address"
      inputPlaceholder?: string
      stepData?: any
      requiresCreateAsset?: boolean
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

  // Voice recognition functions
  const startVoiceRecognition = () => {
    if (voiceRecognition.recognition && voiceRecognition.isSupported) {
      try {
        voiceRecognition.recognition.start()
      } catch (error) {
        console.error('Voice recognition error:', error)
      }
    }
  }

  const stopVoiceRecognition = () => {
    if (voiceRecognition.recognition && voiceRecognition.isListening) {
      voiceRecognition.recognition.stop()
    }
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
                    <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      // ... keep existing code (other cases for the create asset flow)
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
                    <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        })

        try {
          const assetParams: CreateIPAssetParams = {
            title: data.title!,
            description: data.description!,
            creatorName: data.creatorName!,
            creatorAddress: publicKey || undefined, // Use connected wallet address
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
                      <div><span class="text-white/60">Creator Wallet:</span> <span class="text-white font-mono">${publicKey ? `${publicKey.slice(0, 10)}...${publicKey.slice(-8)}` : 'N/A'}</span></div>
                      <div><span class="text-white/60">TX Hash:</span> <span class="text-white font-mono">${result.txHash.slice(0, 10)}...${result.txHash.slice(-8)}</span></div>
                    </div>
                  </div>
                </div>

                <div class="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                  <p class="text-blue-300 text-sm">
                    <span class="font-semibold">Note:</span> Your connected wallet address (${publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}` : 'N/A'}) has been recorded as the creator in the asset metadata.
                  </p>
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
                    <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      // Check wallet connection first
      if (!connected || !publicKey) {
        addMessage("assistant", "Wallet Connection Required", {
          htmlContent: `
            <div class="space-y-4 p-4">
              <div class="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  <span class="text-yellow-400 font-semibold">Wallet Not Connected</span>
                </div>
                <p class="text-yellow-300 mb-3">To access Story Protocol data and create IP assets, please connect your Tomo wallet first.</p>
                <button 
                  onclick="window.connectWallet()" 
                  class="px-4 py-2 bg-black text-black rounded-lg transition-colors font-medium"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          `,
        })
        setLoading(false)
        return
      }

      // Handle active flows first
      if (createAssetFlow.active) {
        await handleCreateAssetFlow(currentInput)
        setLoading(false)
        return
      }

      console.log("Starting enhanced agent processing with wallet:", publicKey)
      const response:any = await enhancedIntelligentAgent(currentInput, api, publicKey)
      console.log("Agent response received:", response)

      // Check if create asset is required
      if (response.requiresCreateAsset) {
        setCreateAssetFlow({ active: true, step: 1, data: {} })
        addMessage("assistant", response.content, {
          htmlContent: response.htmlContent,
          requiresInput: true,
          inputType: "text",
          inputPlaceholder: "Enter asset name...",
        })
        setLoading(false)
        return
      }

      addMessage("assistant", response.content || "Here's what I found:", {
        htmlContent: response.htmlContent,
        data: response.data,
      })
    } catch (error: any) {
      console.error("Error in handleSendMessage:", error)
      addMessage("assistant", "I encountered an error processing your request.", {
        htmlContent: `
          <div class="space-y-4 p-4">
            <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-red-400 font-semibold">Processing Error</span>
              </div>
              <p class="text-red-300 mb-2">${error.message}</p>
              <p class="text-red-300/70 text-sm">Please try one of the suggested queries below or contact support.</p>
            </div>
          </div>
        `,
      })
    } finally {
      setLoading(false)
    }
  }

  // Enhanced query suggestions
  const querySuggestions: QuerySuggestion[] = [
    // General Questions
    { text: "What is Story Protocol?", category: "General", icon: "📚", description: "Understanding Story Protocol" },
    { text: "What is an IP asset?", category: "General", icon: "💡", description: "Learn about IP assets" },
    { text: "How do royalties work?", category: "General", icon: "💰", description: "Understanding royalty payments" },

    // IP Assets
    { text: "Show all IP assets", category: "Assets", icon: "📋", description: "View all registered IP assets" },
    { text: "Create new IP asset", category: "Assets", icon: "🎨", description: "Register new intellectual property" },
    { text: "Show highest earning assets", category: "Assets", icon: "💎", description: "Most valuable assets by royalties" },

    // Analytics
    { text: "Show today's royalties", category: "Analytics", icon: "💰", description: "Today's royalty payments in IP tokens" },
    { text: "Show today's transactions", category: "Analytics", icon: "⚡", description: "Today's blockchain activity" },
    { text: "Show top earning assets", category: "Analytics", icon: "🏆", description: "Assets by total revenue" },
    { text: "Platform analytics overview", category: "Analytics", icon: "📊", description: "Complete platform statistics" },
  ]

  const displayedSuggestions = showAllSuggestions ? querySuggestions : querySuggestions.slice(0, 10)
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
      const result = await api.listIPAssets({ options: { pagination: { limit: 5 } } })
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
    <div className="flex flex-col h-full w-full bg-background text-white overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-black/80 backdrop-blur-sm border-b border-gray-800 p-6 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <Search className="h-6 w-6 text-black" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Enhanced Story AI</h1>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-gray-400">Voice • Analytics • Real-time</span>
                {createAssetFlow.active && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="text-white">Asset Creation Mode</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Wallet Status */}
            <div className="flex items-center space-x-2">
              {connected && publicKey ? (
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 text-sm font-medium">Connected</span>
                  <span className="text-green-300 text-xs font-mono">
                    {`${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => openConnectModal ? openConnectModal() : connectWallet()}
                  className="flex items-center space-x-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 transition-colors"
                >
                  <Wallet className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 text-sm font-medium">Connect Wallet</span>
                </button>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Msg. {messages.length}</div>
            </div>
            <Button
              onClick={() => setMessages([messages[0]])}
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              New chat
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex max-w-[95%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center shrink-0 ${
                  message.role === "user" 
                    ? "bg-white ml-3" 
                    : "bg-black border border-gray-700 mr-3"
                }`}
              >
                {message.role === "user" ? (
                  <User className="h-5 w-5 text-black" />
                ) : (
                  <Search className="h-5 w-5 text-white" />
                )}
              </div>
              <div
                className={`py-4 px-6 rounded-lg border ${
                  message.role === "user"
                    ? "bg-white text-black border-gray-300"
                    : "bg-black border-gray-700"
                }`}
              >
                {message.htmlContent ? (
                  <div
                    className={`prose max-w-none overflow-x-auto ${
                      message.role === "user" 
                        ? "prose-black [&_*]:text-black [&_h1]:text-black [&_h2]:text-black [&_h3]:text-black [&_h4]:text-black [&_p]:text-gray-800 [&_ul]:text-gray-800 [&_li]:text-gray-800 [&_strong]:text-black [&_table]:border-gray-300 [&_th]:border-gray-300 [&_td]:border-gray-300 [&_th]:bg-gray-100 [&_code]:bg-gray-100 [&_code]:text-black [&_pre]:bg-gray-100 [&_pre]:text-black"
                        : "prose-invert [&_*]:text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_p]:text-gray-200 [&_ul]:text-gray-200 [&_li]:text-gray-200 [&_strong]:text-white [&_table]:border-gray-600 [&_th]:border-gray-600 [&_td]:border-gray-600 [&_th]:bg-gray-800 [&_code]:bg-gray-800 [&_code]:text-gray-200 [&_pre]:bg-gray-800 [&_pre]:text-gray-200"
                    }`}
                    dangerouslySetInnerHTML={{ __html: message.htmlContent }}
                  />
                ) : (
                  <div className={`whitespace-pre-wrap ${message.role === "user" ? "text-black" : "text-white"}`}>
                    {message.content}
                  </div>
                )}
                {renderInputField(message)}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex flex-row">
              <div className="rounded-full h-10 w-10 flex items-center justify-center bg-black border border-gray-700 mr-3">
                <Search className="h-5 w-5 text-white" />
              </div>
              <div className="py-4 px-6 rounded-lg bg-black border border-gray-700">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 bg-white rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <div className="bg-black/80 backdrop-blur-sm border-t border-gray-800 p-6 shrink-0">
        {/* Voice Recognition Status */}
        {voiceRecognition.isListening && (
          <div className="mb-4 flex items-center justify-center">
            <div className="flex items-center gap-3 px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-full backdrop-blur-sm">
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute top-0 left-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-red-400 text-sm font-medium">🎤 Listening... Speak clearly!</span>
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute top-0 left-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
              </div>
            </div>
          </div>
        )}
        
        <div className="relative">
          <div className="flex items-end gap-4 p-4 border border-gray-700 rounded-lg bg-black focus-within:border-white focus-within:bg-gray-900 transition-all duration-300">
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
                voiceRecognition.isListening
                  ? "🎤 Listening... Speak now!"
                  : createAssetFlow.active
                  ? "Enter the requested information..."
                  : "Ask me anything about Story Protocol, create IP assets, or general questions!"
              }
              className="flex-1 resize-none border-none outline-none bg-transparent text-white placeholder:text-gray-500 max-h-40 min-h-[32px]"
              rows={1}
              disabled={loading}
            />

            <div className="flex items-center gap-2">
              <Button
                onClick={voiceRecognition.isListening ? stopVoiceRecognition : startVoiceRecognition}
                disabled={loading || !voiceRecognition.isSupported}
                size="lg"
                variant="outline"
                className={`px-3 py-3 rounded-lg border-2 transition-all duration-300 ${
                  voiceRecognition.isListening
                    ? "bg-red-500 hover:bg-red-600 border-red-500 text-white animate-pulse"
                    : "bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-300 hover:text-white hover:border-gray-500"
                }`}
                title={
                  !voiceRecognition.isSupported
                    ? "Voice recognition not supported in this browser"
                    : voiceRecognition.isListening
                    ? "Stop voice input (Ctrl+Shift+M)"
                    : "Start voice input (Ctrl+Shift+M)"
                }
              >
                {voiceRecognition.isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>

              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || loading}
                size="lg"
                className="bg-white hover:bg-gray-200 text-black border-0 px-6 py-3 rounded-lg font-medium transition-all duration-300"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Voice Input Help Text */}
          {voiceRecognition.isSupported && !voiceRecognition.isListening && (
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500">
                💡 Tip: Click the <Mic className="inline h-3 w-3 mx-1" /> microphone or press <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs">Ctrl+Shift+M</kbd> for voice input
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Query Suggestions */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-white" />
              <h3 className="text-lg font-semibold text-white">Quick Questions</h3>
              {voiceRecognition.isSupported && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Mic className="h-3 w-3" />
                  <span>Ctrl+Shift+M</span>
                </div>
              )}
            </div>
           
          </div>

          <div className="space-y-6">
            {Object.entries(suggestionsByCategory).map(([category, suggestions]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px bg-gray-700 flex-1"></div>
                  <span className="text-sm text-gray-400 font-medium px-3">{category}</span>
                  <div className="h-px bg-gray-700 flex-1"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(suggestion.text)}
                      disabled={loading || createAssetFlow.active}
                      className="group relative text-left p-4 rounded-lg bg-black border border-gray-700 hover:border-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-white/10"
                      title={suggestion.description}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg flex-shrink-0 mt-0.5">{suggestion.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white group-hover:text-white transition-colors">
                            {suggestion.text}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">
                            {suggestion.description}
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
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
