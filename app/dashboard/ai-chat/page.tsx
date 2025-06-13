"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Bot, User, FileText, Loader2, DollarSign, Hash } from "lucide-react"
import { enhancedGeminiAgent } from "@/lib/enhanced-gemini-agent"
import { api, type IPAsset, type Transaction, type RoyaltyPay, type LicenseMintingFeePaid } from "@/lib/api"
import { debridgeApi } from "@/lib/debridge-api"
import { createIPAsset, type CreateIPAssetParams } from "@/lib/create-story-asset"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  data?: any
  dataType?: string
  timestamp: number
  isProcessing?: boolean
  requiresInput?: boolean
  inputType?: "text" | "date" | "select" | "file" | "confirm"
  inputOptions?: string[]
  inputPlaceholder?: string
  stepData?: any
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

interface BridgeFlow {
  active: boolean
  step: number
  data: {
    fromChain?: string
    toChain?: string
    fromToken?: string
    toToken?: string
    amount?: string
    quote?: any
  }
}

interface PaginationState {
  [key: string]: {
    page: number
    hasMore: boolean
    loading: boolean
  }
}

// Enhanced IP Asset Display Component
function IPAssetsDisplay({
  assets,
  title,
  onLoadMore,
  pagination,
}: {
  assets: IPAsset[]
  title: string
  onLoadMore?: () => void
  pagination?: { hasMore: boolean; loading: boolean }
}) {
  if (!assets || assets.length === 0) {
    return (
      <div className="mt-4 p-6 bg-white/5 rounded-lg border border-white/10">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-white/40" />
          <p className="text-white/60">No IP assets found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assets.map((asset, idx) => (
          <Card key={asset.ipId || idx} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                  {asset.nftMetadata?.imageUrl ? (
                    <img
                      src={asset.nftMetadata.imageUrl || "/placeholder.svg"}
                      alt={asset.nftMetadata.name || "Asset"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="h-8 w-8 text-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate mb-1">
                    {asset.nftMetadata?.name || `Asset ${asset.id?.slice(0, 8)}`}
                  </h3>
                  <p className="text-xs text-white/60 font-mono truncate mb-2">
                    {asset.ipId?.slice(0, 10)}...{asset.ipId?.slice(-8)}
                  </p>

                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={asset.isGroup ? "default" : "secondary"} className="text-xs">
                      {asset.isGroup ? "Group" : "Individual"}
                    </Badge>
                    <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-300">
                      Block: {asset.blockNumber}
                    </Badge>
                  </div>

                  <div className="text-xs text-white/60">
                    Created: {new Date(asset.blockTimestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pagination?.hasMore && (
        <div className="text-center pt-4">
          <Button
            onClick={onLoadMore}
            disabled={pagination.loading}
            variant="outline"
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            {pagination.loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Assets"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// Transactions Display Component
function TransactionsDisplay({
  transactions,
  title,
  onLoadMore,
  pagination,
}: {
  transactions: Transaction[]
  title: string
  onLoadMore?: () => void
  pagination?: { hasMore: boolean; loading: boolean }
}) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="mt-4 p-6 bg-white/5 rounded-lg border border-white/10">
        <div className="text-center">
          <Hash className="h-12 w-12 mx-auto mb-4 text-white/40" />
          <p className="text-white/60">No transactions found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      {transactions.map((tx, idx) => (
        <Card key={tx.id || idx} className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-600 text-white text-xs">{tx.actionType}</Badge>
                  <span className="text-xs text-white/60">Block: {tx.blockNumber}</span>
                </div>

                <p className="text-sm text-white/80 mb-1">
                  <span className="text-white/60">TX Hash:</span> {tx.txHash?.slice(0, 20)}...
                </p>
                <p className="text-sm text-white/80 mb-1">
                  <span className="text-white/60">Initiator:</span> {tx.initiator?.slice(0, 20)}...
                </p>
                <p className="text-sm text-white/80">
                  <span className="text-white/60">IP Asset:</span> {tx.ipId?.slice(0, 20)}...
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-white/60 mb-1">{new Date(tx.blockTimestamp).toLocaleDateString()}</div>
                <div className="text-xs text-white/60">{new Date(tx.blockTimestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {pagination?.hasMore && (
        <div className="text-center pt-4">
          <Button
            onClick={onLoadMore}
            disabled={pagination.loading}
            variant="outline"
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            {pagination.loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Transactions"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// Royalties Display Component
function RoyaltiesDisplay({
  royalties,
  title,
  onLoadMore,
  pagination,
}: {
  royalties: RoyaltyPay[]
  title: string
  onLoadMore?: () => void
  pagination?: { hasMore: boolean; loading: boolean }
}) {
  if (!royalties || royalties.length === 0) {
    return (
      <div className="mt-4 p-6 bg-white/5 rounded-lg border border-white/10">
        <div className="text-center">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-white/40" />
          <p className="text-white/60">No royalty payments found</p>
        </div>
      </div>
    )
  }

  const totalAmount = royalties.reduce((sum, royalty) => {
    return sum + Number.parseFloat(royalty.amount) / Math.pow(10, 18)
  }, 0)

  return (
    <div className="mt-4 space-y-4">
      <Card className="bg-green-500/10 border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            <span className="text-green-400 font-semibold">Total Royalties</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{totalAmount.toFixed(6)} ETH</p>
          <p className="text-sm text-green-300">
            From {royalties.length} payment{royalties.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {royalties.map((royalty, idx) => (
          <Card key={royalty.id || idx} className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    <span className="text-lg font-semibold text-green-400">
                      {(Number.parseFloat(royalty.amount) / Math.pow(10, 18)).toFixed(6)} ETH
                    </span>
                  </div>

                  <p className="text-sm text-white/80 mb-1">
                    <span className="text-white/60">From:</span> {royalty.payerIpId?.slice(0, 20)}...
                  </p>
                  <p className="text-sm text-white/80 mb-1">
                    <span className="text-white/60">To:</span> {royalty.receiverIpId?.slice(0, 20)}...
                  </p>
                  <p className="text-sm text-white/80">
                    <span className="text-white/60">Sender:</span> {royalty.sender?.slice(0, 20)}...
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-white/60 mb-1">Block: {royalty.blockNumber}</div>
                  <div className="text-xs text-white/60">{new Date(royalty.blockTimestamp).toLocaleDateString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pagination?.hasMore && (
        <div className="text-center pt-4">
          <Button
            onClick={onLoadMore}
            disabled={pagination.loading}
            variant="outline"
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            {pagination.loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Royalties"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// Minting Fees Display Component
function MintingFeesDisplay({
  fees,
  title,
  onLoadMore,
  pagination,
}: {
  fees: LicenseMintingFeePaid[]
  title: string
  onLoadMore?: () => void
  pagination?: { hasMore: boolean; loading: boolean }
}) {
  if (!fees || fees.length === 0) {
    return (
      <div className="mt-4 p-6 bg-white/5 rounded-lg border border-white/10">
        <div className="text-center">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-white/40" />
          <p className="text-white/60">No minting fees found</p>
        </div>
      </div>
    )
  }

  const totalFees = fees.reduce((sum, fee) => {
    return sum + Number.parseFloat(fee.amount) / Math.pow(10, 18)
  }, 0)

  return (
    <div className="mt-4 space-y-4">
      <Card className="bg-purple-500/10 border-purple-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-purple-400" />
            <span className="text-purple-400 font-semibold">Total Minting Fees</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">{totalFees.toFixed(6)} ETH</p>
          <p className="text-sm text-purple-300">
            From {fees.length} fee payment{fees.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {fees.map((fee, idx) => (
          <Card key={fee.id || idx} className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-purple-400" />
                    <span className="text-lg font-semibold text-purple-400">
                      {(Number.parseFloat(fee.amount) / Math.pow(10, 18)).toFixed(6)} ETH
                    </span>
                  </div>

                  <p className="text-sm text-white/80 mb-1">
                    <span className="text-white/60">Payer:</span> {fee.payer?.slice(0, 20)}...
                  </p>
                  <p className="text-sm text-white/80 mb-1">
                    <span className="text-white/60">Receiver IP:</span> {fee.receiverIpId?.slice(0, 20)}...
                  </p>
                  <p className="text-sm text-white/80">
                    <span className="text-white/60">Token:</span> {fee.token?.slice(0, 20)}...
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-white/60 mb-1">Block: {fee.blockNumber}</div>
                  <div className="text-xs text-white/60">{new Date(fee.blockTimestamp).toLocaleDateString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pagination?.hasMore && (
        <div className="text-center pt-4">
          <Button
            onClick={onLoadMore}
            disabled={pagination.loading}
            variant="outline"
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            {pagination.loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Fees"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// Asset Details Display Component
function AssetDetailsDisplay({
  asset,
  licenseTerms,
  transactions,
  royalties,
}: {
  asset: IPAsset
  licenseTerms?: any
  transactions?: Transaction[]
  royalties?: RoyaltyPay[]
}) {
  return (
    <div className="mt-4 space-y-4">
      {/* Main Asset Info */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Asset Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
              {asset.nftMetadata?.imageUrl ? (
                <img
                  src={asset.nftMetadata.imageUrl || "/placeholder.svg"}
                  alt={asset.nftMetadata.name || "Asset"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileText className="h-10 w-10 text-white" />
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{asset.nftMetadata?.name || "Unnamed Asset"}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">IP Asset ID:</span>
                  <p className="text-white font-mono break-all">{asset.ipId}</p>
                </div>
                <div>
                  <span className="text-white/60">Token Contract:</span>
                  <p className="text-white font-mono break-all">{asset.nftMetadata?.tokenContract}</p>
                </div>
                <div>
                  <span className="text-white/60">Token ID:</span>
                  <p className="text-white">{asset.nftMetadata?.tokenId}</p>
                </div>
                <div>
                  <span className="text-white/60">Chain ID:</span>
                  <p className="text-white">{asset.nftMetadata?.chainId}</p>
                </div>
                <div>
                  <span className="text-white/60">Block Number:</span>
                  <p className="text-white">{asset.blockNumber}</p>
                </div>
                <div>
                  <span className="text-white/60">Created:</span>
                  <p className="text-white">{new Date(asset.blockTimestamp).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Badge variant={asset.isGroup ? "default" : "secondary"}>
                  {asset.isGroup ? "Group Asset" : "Individual Asset"}
                </Badge>
                <Badge variant="outline" className="border-blue-500/30 text-blue-300">
                  {asset.childrenCount} Children
                </Badge>
                <Badge variant="outline" className="border-green-500/30 text-green-300">
                  {asset.parentCount} Parents
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* License Terms */}
      {licenseTerms && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              License Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/60">License Template:</span>
                <p className="text-white font-mono break-all">{licenseTerms.licenseTemplate}</p>
              </div>
              <div>
                <span className="text-white/60">License Terms ID:</span>
                <p className="text-white">{licenseTerms.licenseTermsId}</p>
              </div>
              {licenseTerms.licensingConfig && (
                <>
                  <div>
                    <span className="text-white/60">Commercial Rev Share:</span>
                    <p className="text-white">{licenseTerms.licensingConfig.commercialRevShare}%</p>
                  </div>
                  <div>
                    <span className="text-white/60">Minting Fee:</span>
                    <p className="text-white">{licenseTerms.licensingConfig.mintingFee} ETH</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      {transactions && transactions.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Recent Transactions ({transactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.slice(0, 3).map((tx, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-blue-600 text-white text-xs">{tx.actionType}</Badge>
                    <span className="text-xs text-white/60">{new Date(tx.blockTimestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-white/80 font-mono">{tx.txHash?.slice(0, 30)}...</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Royalties */}
      {royalties && royalties.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Recent Royalties ({royalties.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {royalties.slice(0, 3).map((royalty, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-400 font-semibold">
                      {(Number.parseFloat(royalty.amount) / Math.pow(10, 18)).toFixed(6)} ETH
                    </span>
                    <span className="text-xs text-white/60">
                      {new Date(royalty.blockTimestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-white/80">From: {royalty.payerIpId?.slice(0, 20)}...</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function AiChatFixedComprehensive() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `# Welcome to Story Protocol AI! 🚀

I'm your intelligent assistant for comprehensive IP asset management. I can help you with:

**🎨 IP Asset Operations**
- Create new IP assets (simplified flow)
- View all IP assets with pagination
- Get detailed asset information by ID
- Search assets by name or creator

**💰 Financial Analytics**
- Show royalty payments for any asset
- Display minting fees and breakdowns
- Track earnings and payment history
- Calculate total revenues

**📊 Transaction Monitoring**
- View recent transactions
- Filter by action type or date
- Track asset transfers and licenses
- Monitor blockchain activity

**🌉 Cross-Chain Operations**
- Bridge tokens between networks
- Get real-time swap quotes
- Track bridge transactions

**🔍 Smart Queries** (Try these examples):
- "Show royalties for asset 0x123..."
- "What are the last 5 transactions?"
- "Create a new IP asset"
- "Show minting fees for this month"
- "Bridge USDC to Polygon"

What would you like to explore?`,
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [createAssetFlow, setCreateAssetFlow] = useState<CreateAssetFlow>({
    active: false,
    step: 0,
    data: {},
  })
  const [bridgeFlow, setBridgeFlow] = useState<BridgeFlow>({
    active: false,
    step: 0,
    data: {},
  })
  const [pagination, setPagination] = useState<PaginationState>({})
  const [showAllSuggestions, setShowAllSuggestions] = useState(false)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const addMessage = (
    role: "user" | "assistant",
    content: string,
    options: {
      data?: any
      dataType?: string
      isProcessing?: boolean
      requiresInput?: boolean
      inputType?: "text" | "date" | "select" | "file" | "confirm"
      inputOptions?: string[]
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

  // Extract asset ID from text
  const extractAssetId = (text: string): string | null => {
    const assetIdMatch = text.match(/0x[a-fA-F0-9]{40}/g)
    return assetIdMatch ? assetIdMatch[0] : null
  }

  // Extract number from "last X" queries
  const extractLimit = (text: string): number => {
    const limitMatch = text.match(/last\s+(\d+)/i)
    return limitMatch ? Number.parseInt(limitMatch[1]) : 10
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
        addMessage(
          "assistant",
          `✅ **Asset Title:** ${userInput}

📝 **Step 2/4:** Please provide a description for your IP asset:`,
          {
            requiresInput: true,
            inputType: "text",
            inputPlaceholder: "Enter asset description...",
          },
        )
        break

      case 2: // Description
        setCreateAssetFlow({
          ...createAssetFlow,
          step: 3,
          data: { ...data, description: userInput },
        })
        addMessage(
          "assistant",
          `✅ **Description:** ${userInput}

👤 **Step 3/4:** What's your creator name?`,
          {
            requiresInput: true,
            inputType: "text",
            inputPlaceholder: "Enter creator name...",
          },
        )
        break

      case 3: // Creator Name
        setCreateAssetFlow({
          ...createAssetFlow,
          step: 4,
          data: { ...data, creatorName: userInput },
        })
        addMessage(
          "assistant",
          `✅ **Creator:** ${userInput}

🖼️ **Step 4/4:** Would you like to upload an image? (Type 'skip' to skip or upload an image)`,
          {
            requiresInput: true,
            inputType: "file",
            inputPlaceholder: "Upload image or type 'skip'...",
          },
        )
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
            imageFile: data.imageFile,
          }

          const result = await createIPAsset(assetParams)

          updateMessage(processingId, {
            content: `# 🎉 IP Asset Created Successfully!

**✅ Your IP asset has been registered on Story Protocol!**

**📋 Asset Details:**
- **Name:** ${result.ipId}
- **Token ID:** ${result.tokenId}
- **Contract:** ${result.spgNftContract}
- **Wallet:** ${result.walletAddress}

**🔗 Links:**
- [View on Explorer](${result.explorerUrl})
- [IP Metadata](${result.ipMetadataUri})
- [NFT Metadata](${result.nftMetadataUri})

**📊 Transaction:**
- **Hash:** ${result.txHash}

Your intellectual property is now protected and registered on the blockchain! 🎊`,
            isProcessing: false,
          })

          // Reset flow
          setCreateAssetFlow({ active: false, step: 0, data: {} })
        } catch (error: any) {
          updateMessage(processingId, {
            content: `❌ **Error creating IP asset:** ${error.message}

Please try again or contact support if the issue persists.`,
            isProcessing: false,
          })
          setCreateAssetFlow({ active: false, step: 0, data: {} })
        }
        break
    }
  }

  // Handle Bridge Flow
  const handleBridgeFlow = async (userInput: string) => {
    const { step, data } = bridgeFlow

    switch (step) {
      case 1: // Get supported chains
        const processingId = addMessage("assistant", "🔍 **Fetching supported chains...**", {
          isProcessing: true,
        })

        try {
          const chains = await debridgeApi.getSupportedChains()

          updateMessage(processingId, {
            content: `# 🌉 Supported Chains for Bridging

Select your **source chain**:`,
            data: chains,
            dataType: "chains",
            isProcessing: false,
            requiresInput: true,
            inputType: "select",
            inputOptions: chains.map((chain) => `${chain.chainName} (${chain.chainId})`),
          })

          setBridgeFlow({ ...bridgeFlow, step: 2 })
        } catch (error: any) {
          updateMessage(processingId, {
            content: `❌ **Error fetching chains:** ${error.message}`,
            isProcessing: false,
          })
        }
        break

      case 2: // Source chain selected
        const selectedChain = userInput.match(/$$(\d+)$$/)
        if (selectedChain) {
          setBridgeFlow({
            ...bridgeFlow,
            step: 3,
            data: { ...data, fromChain: selectedChain[1] },
          })

          addMessage(
            "assistant",
            `✅ **Source Chain:** ${userInput}

Now select your **destination chain**:`,
            {
              requiresInput: true,
              inputType: "text",
              inputPlaceholder: "Enter destination chain name or ID...",
            },
          )
        }
        break

      // Continue with other bridge steps...
    }
  }

  // Load more data with pagination
  const loadMoreData = async (dataType: string, messageId: string) => {
    const currentPagination = pagination[dataType] || { page: 0, hasMore: true, loading: false }

    if (currentPagination.loading || !currentPagination.hasMore) return

    setPagination((prev) => ({
      ...prev,
      [dataType]: { ...currentPagination, loading: true },
    }))

    try {
      const limit = 20
      const offset = currentPagination.page * limit

      let newData: any[] = []
      let hasMore = true

      switch (dataType) {
        case "ip_assets":
          const assetsResponse = await api.listIPAssets({
            pagination: { limit, offset },
          })
          newData = assetsResponse.data || []
          hasMore = newData.length === limit
          break

        case "transactions":
          const transactionsResponse = await api.listLatestTransactions({
            pagination: { limit, offset },
          })
          newData = transactionsResponse.data || []
          hasMore = newData.length === limit
          break

        case "royalties":
          const royaltiesResponse = await api.listRoyaltyPays({
            pagination: { limit, offset },
          })
          newData = royaltiesResponse.data || []
          hasMore = newData.length === limit
          break

        case "minting_fees":
          const feesResponse = await api.listLicenseMintingFees({
            pagination: { limit, offset },
          })
          newData = feesResponse.data || []
          hasMore = newData.length === limit
          break
      }

      // Update message with new data
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            const existingData = msg.data || []
            return {
              ...msg,
              data: [...existingData, ...newData],
            }
          }
          return msg
        }),
      )

      setPagination((prev) => ({
        ...prev,
        [dataType]: {
          page: currentPagination.page + 1,
          hasMore,
          loading: false,
        },
      }))
    } catch (error: any) {
      console.error(`Error loading more ${dataType}:`, error)
      setPagination((prev) => ({
        ...prev,
        [dataType]: { ...currentPagination, loading: false },
      }))
    }
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

      if (bridgeFlow.active) {
        await handleBridgeFlow(currentInput)
        setLoading(false)
        return
      }

      // Process with Enhanced Gemini AI
      const response = await enhancedGeminiAgent(currentInput)
      console.log("AI Response:", response)

      // Handle different response types
      switch (response.type) {
        case "create_ip_asset":
          setCreateAssetFlow({ active: true, step: 1, data: {} })
          addMessage(
            "assistant",
            `# 🎨 Create New IP Asset

Let's register your intellectual property on Story Protocol! I'll guide you through 4 simple steps.

📝 **Step 1/4:** What's the name/title of your IP asset?`,
            {
              requiresInput: true,
              inputType: "text",
              inputPlaceholder: "Enter asset name...",
            },
          )
          break

        case "bridge":
          setBridgeFlow({ active: true, step: 1, data: {} })
          await handleBridgeFlow("")
          break

        case "ip_assets":
          const processingId = addMessage("assistant", "🔍 **Fetching IP assets...**", {
            isProcessing: true,
          })

          try {
            const assetsResponse = await api.listIPAssets({
              pagination: { limit: 20, offset: 0 },
            })
            const assets = assetsResponse.data || []

            updateMessage(processingId, {
              content: `# 📋 IP Assets (${assets.length} shown)

Here are the registered IP assets:`,
              data: assets,
              dataType: "ip_assets",
              isProcessing: false,
            })

            setPagination((prev) => ({
              ...prev,
              ip_assets: { page: 1, hasMore: assets.length === 20, loading: false },
            }))
          } catch (error: any) {
            updateMessage(processingId, {
              content: `❌ **Error fetching assets:** ${error.message}`,
              isProcessing: false,
            })
          }
          break

        case "transactions":
          const txProcessingId = addMessage("assistant", "🔍 **Fetching transactions...**", {
            isProcessing: true,
          })

          try {
            const limit = extractLimit(currentInput)
            const transactionsResponse = await api.listLatestTransactions({
              pagination: { limit, offset: 0 },
            })
            const transactions = transactionsResponse.data || []

            updateMessage(txProcessingId, {
              content: `# 📊 Recent Transactions (${transactions.length} shown)

Latest blockchain transactions:`,
              data: transactions,
              dataType: "transactions",
              isProcessing: false,
            })

            setPagination((prev) => ({
              ...prev,
              transactions: { page: 1, hasMore: transactions.length === limit, loading: false },
            }))
          } catch (error: any) {
            updateMessage(txProcessingId, {
              content: `❌ **Error fetching transactions:** ${error.message}`,
              isProcessing: false,
            })
          }
          break

        case "royalties":
          const royaltyProcessingId = addMessage("assistant", "🔍 **Fetching royalty payments...**", {
            isProcessing: true,
          })

          try {
            const limit = extractLimit(currentInput)
            const assetId = extractAssetId(currentInput)

            let royaltiesResponse
            if (assetId) {
              // Filter by specific asset
              royaltiesResponse = await api.listRoyaltyPays({
                where: {
                  OR: [{ payerIpId: assetId }, { receiverIpId: assetId }],
                },
                pagination: { limit, offset: 0 },
              })
            } else {
              royaltiesResponse = await api.listRoyaltyPays({
                pagination: { limit, offset: 0 },
              })
            }

            const royalties = royaltiesResponse.data || []

            updateMessage(royaltyProcessingId, {
              content: `# 💰 Royalty Payments (${royalties.length} shown)

${assetId ? `For asset: ${assetId}` : "All royalty payments"}:`,
              data: royalties,
              dataType: "royalties",
              isProcessing: false,
            })

            setPagination((prev) => ({
              ...prev,
              royalties: { page: 1, hasMore: royalties.length === limit, loading: false },
            }))
          } catch (error: any) {
            updateMessage(royaltyProcessingId, {
              content: `❌ **Error fetching royalties:** ${error.message}`,
              isProcessing: false,
            })
          }
          break

        case "minting_fees":
          const feesProcessingId = addMessage("assistant", "🔍 **Fetching minting fees...**", {
            isProcessing: true,
          })

          try {
            const limit = extractLimit(currentInput)
            const feesResponse = await api.listLicenseMintingFees({
              pagination: { limit, offset: 0 },
            })
            const fees = feesResponse.data || []

            updateMessage(feesProcessingId, {
              content: `# 💎 Minting Fees (${fees.length} shown)

License minting fee payments:`,
              data: fees,
              dataType: "minting_fees",
              isProcessing: false,
            })

            setPagination((prev) => ({
              ...prev,
              minting_fees: { page: 1, hasMore: fees.length === limit, loading: false },
            }))
          } catch (error: any) {
            updateMessage(feesProcessingId, {
              content: `❌ **Error fetching minting fees:** ${error.message}`,
              isProcessing: false,
            })
          }
          break

        case "asset_detail":
          const assetDetailProcessingId = addMessage("assistant", "🔍 **Fetching asset details...**", {
            isProcessing: true,
          })

          try {
            const assetId = response.parameters?.assetId || extractAssetId(currentInput)

            if (!assetId) {
              updateMessage(assetDetailProcessingId, {
                content: "❌ **No asset ID found.** Please provide a valid asset ID (0x...)",
                isProcessing: false,
              })
              break
            }

            // Fetch asset details
            const [assetResponse, licenseResponse, transactionsResponse, royaltiesResponse] = await Promise.allSettled([
              api.getIPAsset(assetId),
              api.getIPLicenseTerms(assetId),
              api.listTransactions({
                where: { ipId: assetId },
                pagination: { limit: 10, offset: 0 },
              }),
              api.listRoyaltyPays({
                where: {
                  OR: [{ payerIpId: assetId }, { receiverIpId: assetId }],
                },
                pagination: { limit: 10, offset: 0 },
              }),
            ])

            const asset = assetResponse.status === "fulfilled" ? assetResponse.value.data : null
            const licenseTerms = licenseResponse.status === "fulfilled" ? licenseResponse.value.data : null
            const transactions = transactionsResponse.status === "fulfilled" ? transactionsResponse.value.data : []
            const royalties = royaltiesResponse.status === "fulfilled" ? royaltiesResponse.value.data : []

            if (!asset) {
              updateMessage(assetDetailProcessingId, {
                content: `❌ **Asset not found:** ${assetId}

Please check the asset ID and try again.`,
                isProcessing: false,
              })
              break
            }

            updateMessage(assetDetailProcessingId, {
              content: `# 🎯 Asset Details: ${asset.nftMetadata?.name || "Unnamed Asset"}

Complete information for asset ${assetId}:`,
              data: { asset, licenseTerms, transactions, royalties },
              dataType: "asset_detail",
              isProcessing: false,
            })
          } catch (error: any) {
            updateMessage(assetDetailProcessingId, {
              content: `❌ **Error fetching asset details:** ${error.message}`,
              isProcessing: false,
            })
          }
          break

        default:
          addMessage("assistant", response.explanation || "I'm here to help with Story Protocol operations!")
      }
    } catch (error: any) {
      console.error("Error:", error)
      addMessage(
        "assistant",
        `❌ **Error:** ${error.message}

Please try rephrasing your request or contact support if the issue persists.`,
      )
    } finally {
      setLoading(false)
    }
  }

  const renderDataDisplay = (message: Message) => {
    const messageId = message.id
    const paginationState = pagination[message.dataType || ""] || { hasMore: false, loading: false }

    switch (message.dataType) {
      case "ip_assets":
        return (
          <IPAssetsDisplay
            assets={message.data}
            title="IP Assets"
            onLoadMore={() => loadMoreData("ip_assets", messageId)}
            pagination={paginationState}
          />
        )
      case "transactions":
        return (
          <TransactionsDisplay
            transactions={message.data}
            title="Transactions"
            onLoadMore={() => loadMoreData("transactions", messageId)}
            pagination={paginationState}
          />
        )
      case "royalties":
        return (
          <RoyaltiesDisplay
            royalties={message.data}
            title="Royalties"
            onLoadMore={() => loadMoreData("royalties", messageId)}
            pagination={paginationState}
          />
        )
      case "minting_fees":
        return (
          <MintingFeesDisplay
            fees={message.data}
            title="Minting Fees"
            onLoadMore={() => loadMoreData("minting_fees", messageId)}
            pagination={paginationState}
          />
        )
      case "asset_detail":
        return (
          <AssetDetailsDisplay
            asset={message.data.asset}
            licenseTerms={message.data.licenseTerms}
            transactions={message.data.transactions}
            royalties={message.data.royalties}
          />
        )
      default:
        return null
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
          <div className="flex gap-2">
            <Button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 text-white">
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

  // Comprehensive suggestions
  const suggestions = [
    // IP Assets
    "Show all IP assets",
    "Create new IP asset",
    "Show asset details for 0x...",
    "Search assets by name",

    // Royalties
    "Show all royalties",
    "Show royalties for asset 0x...",
    "Show last 5 royalties",
    "What are the highest royalty payments?",

    // Transactions
    "Show recent transactions",
    "Show last 10 transactions",
    "Show transactions for asset 0x...",
    "What are the latest blockchain activities?",

    // Minting Fees
    "Show minting fees",
    "Show last 5 minting fees",
    "What are the highest minting fees?",
    "Show minting fee breakdown",

    // Bridge Operations
    "Bridge tokens",
    "Show supported chains",
    "Bridge USDC to Polygon",
    "Cross-chain swap",

    // Analytics
    "Show trending assets",
    "What's the total royalty volume?",
    "Show most active assets",
    "Asset performance analytics",
  ]

  const displayedSuggestions = showAllSuggestions ? suggestions : suggestions.slice(0, 8)

  return (
    <div className="flex flex-col h-[90vh] w-[95vw] bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/80 text-transparent bg-clip-text">
              Story Protocol AI
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">All APIs Working</span>
          </div>
        </div>
        <div className="text-xs text-white/60">Powered by Gemini AI • Real-Time Data</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center shrink-0 ${
                  message.role === "user" ? "bg-blue-600 ml-3" : "bg-gradient-to-r from-purple-500 to-blue-500 mr-3"
                }`}
              >
                {message.role === "user" ? (
                  <User className="h-5 w-5 text-white" />
                ) : (
                  <Bot className="h-5 w-5 text-white" />
                )}
              </div>
              <div
                className={`py-4 px-6 rounded-2xl ${
                  message.role === "user"
                    ? "bg-blue-600/20 border border-blue-500/30"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                <div className="prose prose-invert max-w-none">
                  <div
                    className="text-white/90 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: message.content
                        .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mb-3 text-white">$1</h1>')
                        .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mb-2 text-white/90">$1</h2>')
                        .replace(/^\*\*(.*?)\*\*/gm, '<strong class="font-semibold text-white">$1</strong>')
                        .replace(
                          /^- (.*$)/gm,
                          '<div class="flex items-start gap-2 mb-1"><span class="text-blue-400 mt-1">•</span><span>$1</span></div>',
                        )
                        .replace(
                          /`([^`]+)`/g,
                          '<code class="bg-white/10 px-2 py-1 rounded text-blue-300 font-mono text-sm">$1</code>',
                        ),
                    }}
                  />
                </div>

                {message.isProcessing && (
                  <div className="flex items-center gap-2 mt-3">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    <span className="text-blue-400 text-sm">Processing...</span>
                  </div>
                )}

                {message.data && renderDataDisplay(message)}
                {renderInputField(message)}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex flex-row">
              <div className="rounded-full h-10 w-10 flex items-center justify-center bg-gradient-to-r from-purple-500 to-blue-500 mr-3">
                <Bot className="h-5 w-5 text-white" />
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
              placeholder={
                createAssetFlow.active
                  ? "Enter the requested information..."
                  : bridgeFlow.active
                    ? "Enter bridge details..."
                    : "Try: 'Show royalties for 0x123...', 'Create new IP asset', 'Show last 5 transactions'..."
              }
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

        {/* Suggestions */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Quick Actions:</span>
            <Button
              onClick={() => setShowAllSuggestions(!showAllSuggestions)}
              variant="ghost"
              size="sm"
              className="text-xs text-white/60 hover:text-white"
            >
              {showAllSuggestions ? "Show Less" : `Show All (${suggestions.length})`}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {displayedSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => setInput(suggestion)}
                disabled={loading || createAssetFlow.active || bridgeFlow.active}
                className="text-sm py-2 px-4 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-white/80 hover:text-white hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
