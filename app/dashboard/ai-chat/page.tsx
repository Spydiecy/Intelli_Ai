"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Bot,
  User,
  Zap,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Minus,
  Plus,
  Activity,
  FileText,
  Eye,
  DollarSign,
  Coins,
  ArrowUpDown,
  Copy,
} from "lucide-react"
import { geminiAgent } from "@/lib/gemini-agent"
import {
  api,
  type IPAsset,
  type Transaction,
  type RoyaltyPay,
  type LicenseToken,
  type LicenseMintingFeePaid,
} from "@/lib/api"
import { debridgeApi, type SupportedChain, type Token, type DLNOrderEstimation } from "@/lib/debridge-api"

interface Message {
  role: "user" | "system"
  content: string
  data?: any
  dataType?: string
  title?: string
}

interface GeminiResponse {
  type: string
  parameters?: any
  explanation?: string
}

// Mock wallet address for demo
const MOCK_WALLET = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1"

// Copy to clipboard helper
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
}

// Enhanced IP Assets Display
function IPAssetsDisplay({
  assets,
  title,
  onAssetClick,
}: {
  assets: IPAsset[]
  title: string
  onAssetClick: (asset: IPAsset) => void
}) {
  if (!assets || assets.length === 0) {
    return (
      <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-white/40" />
            <p className="text-white/60">No IP assets found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-white/60 text-sm">{assets.length} assets found</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assets.slice(0, 8).map((asset, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
              onClick={() => onAssetClick(asset)}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                  {asset.nftMetadata?.imageUrl ? (
                    <img
                      src={asset.nftMetadata.imageUrl || "/placeholder.svg?height=48&width=48"}
                      alt={asset.nftMetadata.name || "Asset"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  ) : (
                    <FileText className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">
                        {asset.nftMetadata?.name || `Asset ${asset.id?.slice(0, 8)}`}
                      </h3>
                      <p className="text-xs text-white/60 font-mono truncate">
                        {asset.ipId?.slice(0, 10)}...{asset.ipId?.slice(-8)}
                      </p>
                    </div>
                    <Eye className="h-4 w-4 text-white/40 group-hover:text-white/80 transition-colors" />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={asset.isGroup ? "default" : "secondary"} className="text-xs">
                      {asset.isGroup ? "Group" : "Individual"}
                    </Badge>
                    <span className="text-xs text-white/60">{asset.childrenCount} children</span>
                  </div>
                  <p className="text-xs text-white/40 mt-1">Block: {asset.blockNumber}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {assets.length > 8 && (
          <p className="text-center text-white/60 text-sm mt-4">
            Showing 8 of {assets.length} assets. Click on any asset for details.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Enhanced Transactions Display
function TransactionsDisplay({
  transactions,
  title,
  onTransactionClick,
}: {
  transactions: Transaction[]
  title: string
  onTransactionClick: (tx: Transaction) => void
}) {
  if (!transactions || transactions.length === 0) {
    return (
      <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 text-white/40" />
            <p className="text-white/60">No transactions found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-white/60 text-sm">{transactions.length} transactions</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.slice(0, 10).map((tx, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
              onClick={() => onTransactionClick(tx)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{tx.actionType}</p>
                      <Badge variant="outline" className="text-xs">
                        {tx.resourceType}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/60 font-mono">
                      {tx.txHash?.slice(0, 10)}...{tx.txHash?.slice(-8)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(tx.txHash)
                      }}
                    >
                      <Copy className="h-3 w-3 text-white/40 hover:text-white/80" />
                    </Button>
                    <Eye className="h-4 w-4 text-white/40 group-hover:text-white/80 transition-colors" />
                  </div>
                  <p className="text-xs text-white/60">Block: {tx.blockNumber}</p>
                  <p className="text-xs text-white/60">{new Date(tx.blockTimestamp).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Royalties Display Component
function RoyaltiesDisplay({ royalties, title }: { royalties: RoyaltyPay[]; title: string }) {
  if (!royalties || royalties.length === 0) {
    return (
      <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-white/40" />
            <p className="text-white/60">No royalty payments found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-white/60 text-sm">{royalties.length} payments</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {royalties.slice(0, 10).map((royalty, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{(Number(royalty.amount) / 1e18).toFixed(6)} tokens</p>
                    <p className="text-xs text-white/60">From: {royalty.payerIpId?.slice(0, 10)}...</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(royalty.payerIpId)}
                    >
                      <Copy className="h-3 w-3 text-white/40 hover:text-white/80" />
                    </Button>
                  </div>
                  <p className="text-xs text-white/60">Block: {royalty.blockNumber}</p>
                  <p className="text-xs text-white/60">{new Date(royalty.blockTimestamp).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Chains Display Component
function ChainsDisplay({ chains, title }: { chains: SupportedChain[]; title: string }) {
  if (!chains || chains.length === 0) {
    return (
      <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <Coins className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Coins className="h-12 w-12 mx-auto mb-4 text-white/40" />
            <p className="text-white/60">No chains found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <Coins className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-white/60 text-sm">{chains.length} supported chains</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {chains.map((chain, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  {chain.logoURI ? (
                    <img
                      src={chain.logoURI || "/placeholder.svg"}
                      alt={chain.chainName}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <span className="text-white text-xs font-bold">{chain.chainName?.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-white text-sm">{chain.chainName}</p>
                  <p className="text-xs text-white/60">ID: {chain.chainId}</p>
                  {chain.nativeCurrency && <p className="text-xs text-white/40">{chain.nativeCurrency.symbol}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Tokens Display Component
function TokensDisplay({ tokens, title }: { tokens: Token[]; title: string }) {
  if (!tokens || tokens.length === 0) {
    return (
      <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <Coins className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Coins className="h-12 w-12 mx-auto mb-4 text-white/40" />
            <p className="text-white/60">No tokens found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <Coins className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-white/60 text-sm">{tokens.length} tokens available</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tokens.slice(0, 10).map((token, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center border border-white/20">
                    {token.logoURI ? (
                      <img
                        src={token.logoURI || "/placeholder.svg"}
                        alt={token.symbol}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <span className="text-white text-sm font-bold">{token.symbol?.slice(0, 2)}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{token.symbol}</p>
                    <p className="text-xs text-white/60">{token.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(token.address)}
                    >
                      <Copy className="h-3 w-3 text-white/40 hover:text-white/80" />
                    </Button>
                  </div>
                  <p className="text-xs text-white/60">Decimals: {token.decimals}</p>
                  <p className="text-xs text-white/60">{token.isNative ? "Native" : "Token"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// License Tokens Display Component
function LicenseTokensDisplay({ tokens, title }: { tokens: LicenseToken[]; title: string }) {
  if (!tokens || tokens.length === 0) {
    return (
      <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-white/40" />
            <p className="text-white/60">No license tokens found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-white/60 text-sm">{tokens.length} license tokens</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tokens.slice(0, 10).map((token, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-white">License Token</p>
                    <p className="text-xs text-white/60">Owner: {token.owner?.slice(0, 10)}...</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Badge variant={token.transferable === "true" ? "default" : "secondary"} className="text-xs">
                      {token.transferable === "true" ? "Transferable" : "Non-transferable"}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/60">Block: {token.blockNumber}</p>
                  <p className="text-xs text-white/60">{new Date(token.blockTime).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Minting Fees Display Component
function MintingFeesDisplay({ fees, title }: { fees: LicenseMintingFeePaid[]; title: string }) {
  if (!fees || fees.length === 0) {
    return (
      <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-white/40" />
            <p className="text-white/60">No minting fees found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-white/60 text-sm">{fees.length} fee payments</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {fees.slice(0, 10).map((fee, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{(Number(fee.amount) / 1e18).toFixed(6)} tokens</p>
                    <p className="text-xs text-white/60">Payer: {fee.payer?.slice(0, 10)}...</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/60">Block: {fee.blockNumber}</p>
                  <p className="text-xs text-white/60">{new Date(fee.blockTimestamp).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Swap Estimation Display Component
function SwapEstimationDisplay({ estimation, title }: { estimation: DLNOrderEstimation; title: string }) {
  if (!estimation) {
    return (
      <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ArrowUpDown className="h-12 w-12 mx-auto mb-4 text-white/40" />
            <p className="text-white/60">No estimation available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const srcToken = estimation.estimation?.srcChainTokenIn
  const dstToken = estimation.estimation?.dstChainTokenOut

  return (
    <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="text-white font-medium">From</p>
              <p className="text-white/60 text-sm">
                {debridgeApi.formatAmount(srcToken?.amount || "0", srcToken?.decimals || 18)} {srcToken?.symbol}
              </p>
              <p className="text-white/40 text-xs">Chain ID: {srcToken?.chainId}</p>
            </div>
            <ArrowUpDown className="h-6 w-6 text-white/60" />
            <div className="text-right">
              <p className="text-white font-medium">To</p>
              <p className="text-white/60 text-sm">
                {debridgeApi.formatAmount(dstToken?.amount || "0", dstToken?.decimals || 18)} {dstToken?.symbol}
              </p>
              <p className="text-white/40 text-xs">Chain ID: {dstToken?.chainId}</p>
            </div>
          </div>

          {estimation.estimation?.recommendedSlippage && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm">
                Recommended Slippage: {estimation.estimation.recommendedSlippage}%
              </p>
            </div>
          )}

          {estimation.orderId && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-sm">Order ID:</p>
                  <p className="text-white/80 text-xs font-mono break-all">{estimation.orderId}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(estimation.orderId || "")}
                >
                  <Copy className="h-3 w-3 text-white/40 hover:text-white/80" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced suggestions based on available APIs
const suggestions = [
  "Show me recent IP assets",
  "List latest transactions",
  "Show royalty payments",
  "Display license tokens",
  "Show minting fees",
  "Get supported chains",
  "Show available tokens",
  "Bridge tokens cross-chain",
  "Show asset relationships",
  "Get transaction details",
]

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content:
        "Hello! I'm your Story Protocol AI assistant. I can help you explore IP assets, transactions, royalties, cross-chain swaps, and more. What would you like to do?",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [contentZoom, setContentZoom] = useState(100)

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const geminiResponse: GeminiResponse = await geminiAgent(input)
      console.log("Gemini Response:", geminiResponse)

      // Handle different response types with if/else structure
      if (geminiResponse.type === "ip_assets") {
        try {
          const assetsData = await api.listIPAssets()
          setMessages((prev) => [
            ...prev,
            { role: "system", content: geminiResponse.explanation || "Here are the latest IP assets:" },
            {
              role: "system",
              content: "DATA_DISPLAY",
              data: assetsData.data || [],
              dataType: "ip_assets",
              title: "IP Assets",
            },
          ])
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            { role: "system", content: "Sorry, I couldn't fetch IP assets data. Please try again." },
          ])
        }
      } else if (geminiResponse.type === "transactions") {
        try {
          const transactionsData = await api.listLatestTransactions()
          setMessages((prev) => [
            ...prev,
            { role: "system", content: geminiResponse.explanation || "Here are the latest transactions:" },
            {
              role: "system",
              content: "DATA_DISPLAY",
              data: transactionsData.data || [],
              dataType: "transactions",
              title: "Latest Transactions",
            },
          ])
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            { role: "system", content: "Sorry, I couldn't fetch transactions data. Please try again." },
          ])
        }
      } else if (geminiResponse.type === "royalties") {
        try {
          const royaltiesData = await api.listRoyaltyPays()
          setMessages((prev) => [
            ...prev,
            { role: "system", content: geminiResponse.explanation || "Here are the royalty payments:" },
            {
              role: "system",
              content: "DATA_DISPLAY",
              data: royaltiesData.data || [],
              dataType: "royalties",
              title: "Royalty Payments",
            },
          ])
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            { role: "system", content: "Sorry, I couldn't fetch royalties data. Please try again." },
          ])
        }
      } else if (geminiResponse.type === "license_tokens") {
        try {
          const licenseData = await api.listLicenseTokens()
          setMessages((prev) => [
            ...prev,
            { role: "system", content: geminiResponse.explanation || "Here are the license tokens:" },
            {
              role: "system",
              content: "DATA_DISPLAY",
              data: licenseData.data || [],
              dataType: "license_tokens",
              title: "License Tokens",
            },
          ])
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            { role: "system", content: "Sorry, I couldn't fetch license tokens data. Please try again." },
          ])
        }
      } else if (geminiResponse.type === "minting_fees") {
        try {
          const feesData = await api.listLicenseMintingFees()
          setMessages((prev) => [
            ...prev,
            { role: "system", content: geminiResponse.explanation || "Here are the minting fees:" },
            {
              role: "system",
              content: "DATA_DISPLAY",
              data: feesData.data || [],
              dataType: "minting_fees",
              title: "License Minting Fees",
            },
          ])
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            { role: "system", content: "Sorry, I couldn't fetch minting fees data. Please try again." },
          ])
        }
      } else if (geminiResponse.type === "supported_chains") {
        try {
          const chainsData = await debridgeApi.getSupportedChains()
          setMessages((prev) => [
            ...prev,
            { role: "system", content: geminiResponse.explanation || "Here are the supported chains:" },
            {
              role: "system",
              content: "DATA_DISPLAY",
              data: chainsData || [],
              dataType: "chains",
              title: "Supported Chains",
            },
          ])
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            { role: "system", content: "Sorry, I couldn't fetch supported chains. Please try again." },
          ])
        }
      } else if (geminiResponse.type === "token_list") {
        try {
          const chainId = geminiResponse.parameters?.chainId || 1
          const tokensData = await debridgeApi.getTokenList(chainId)
          setMessages((prev) => [
            ...prev,
            { role: "system", content: geminiResponse.explanation || `Here are the tokens for chain ${chainId}:` },
            {
              role: "system",
              content: "DATA_DISPLAY",
              data: tokensData || [],
              dataType: "tokens",
              title: `Tokens on Chain ${chainId}`,
            },
          ])
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            { role: "system", content: "Sorry, I couldn't fetch tokens data. Please try again." },
          ])
        }
      } else if (geminiResponse.type === "swap_estimate") {
        try {
          const estimationData = await debridgeApi.createDLNOrder({
            srcChainId: 1,
            srcChainTokenIn: "0x0000000000000000000000000000000000000000",
            srcChainTokenInAmount: "1000000000000000000",
            dstChainId: 100000013,
            dstChainTokenOut: "0x0000000000000000000000000000000000000000",
            dstChainTokenOutAmount: "auto",
            dstChainTokenOutRecipient: MOCK_WALLET,
          })
          setMessages((prev) => [
            ...prev,
            { role: "system", content: geminiResponse.explanation || "Here's your swap estimation:" },
            {
              role: "system",
              content: "DATA_DISPLAY",
              data: estimationData,
              dataType: "swap_estimation",
              title: "Swap Estimation",
            },
          ])
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            { role: "system", content: "Sorry, I couldn't create a swap estimation. Please try again." },
          ])
        }
      } else {
        // General response
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content:
              geminiResponse.explanation ||
              "I'm not sure how to help with that. Please try asking about IP assets, transactions, royalties, or cross-chain swaps.",
          },
        ])
      }
    } catch (error: any) {
      setMessages((prev) => [...prev, { role: "system", content: `Sorry, I encountered an error: ${error.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const handleAssetClick = (asset: IPAsset) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "system",
        content: `Asset Details: ${asset.nftMetadata?.name || "Unnamed Asset"} - ${asset.ipId}`,
      },
    ])
  }

  const handleTransactionClick = (tx: Transaction) => {
    setMessages((prev) => [
      ...prev,
      { role: "system", content: `Transaction ${tx.txHash} - ${tx.actionType} on ${tx.resourceType}` },
    ])
  }

  const handleReset = () => {
    setMessages([
      {
        role: "system",
        content:
          "Hello! I'm your Story Protocol AI assistant. I can help you explore IP assets, transactions, royalties, cross-chain swaps, and more. What would you like to do?",
      },
    ])
  }

  const getZoomStyles = () => ({
    transform: `scale(${contentZoom / 100})`,
    transformOrigin: "top left",
    width: `${10000 / contentZoom}%`,
    fontSize: `${contentZoom}%`,
  })

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-black p-4 rounded-xl text-white">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 text-transparent bg-clip-text">
            Story Protocol AI Assistant
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Collapse content" : "Expand content"}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => setContentZoom(Math.max(80, contentZoom - 10))}
                disabled={contentZoom <= 80}
                title="Zoom out"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-xs text-white/60 px-2 min-w-[3rem] text-center">{contentZoom}%</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => setContentZoom(Math.min(120, contentZoom + 10))}
                disabled={contentZoom >= 120}
                title="Zoom in"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 border-white/20 hover:bg-white/10 text-white"
          onClick={handleReset}
        >
          <RefreshCw className="h-4 w-4" /> New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto backdrop-blur-sm bg-black/20 border border-white/10 rounded-xl mb-4 hover:border-white/20 transition-all hover:shadow-xl">
        <div className={`p-6 transition-all duration-300 ${isExpanded ? "block" : "hidden"}`} style={getZoomStyles()}>
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}>
              {message.content === "DATA_DISPLAY" ? (
                <div className="w-full max-w-4xl">
                  {message.dataType === "ip_assets" && (
                    <IPAssetsDisplay
                      assets={message.data}
                      title={message.title || "Data"}
                      onAssetClick={handleAssetClick}
                    />
                  )}
                  {message.dataType === "transactions" && (
                    <TransactionsDisplay
                      transactions={message.data}
                      title={message.title || "Data"}
                      onTransactionClick={handleTransactionClick}
                    />
                  )}
                  {message.dataType === "royalties" && (
                    <RoyaltiesDisplay royalties={message.data} title={message.title || "Data"} />
                  )}
                  {message.dataType === "chains" && (
                    <ChainsDisplay chains={message.data} title={message.title || "Data"} />
                  )}
                  {message.dataType === "tokens" && (
                    <TokensDisplay tokens={message.data} title={message.title || "Data"} />
                  )}
                  {message.dataType === "license_tokens" && (
                    <LicenseTokensDisplay tokens={message.data} title={message.title || "Data"} />
                  )}
                  {message.dataType === "minting_fees" && (
                    <MintingFeesDisplay fees={message.data} title={message.title || "Data"} />
                  )}
                  {message.dataType === "swap_estimation" && (
                    <SwapEstimationDisplay estimation={message.data} title={message.title || "Data"} />
                  )}
                </div>
              ) : (
                <div className={`flex max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div
                    className={`rounded-full h-9 w-9 flex items-center justify-center ${
                      message.role === "user"
                        ? "bg-white/10 ml-2 border border-white/10"
                        : "bg-white/10 mr-2 border border-white/10"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4 text-white/80" />
                    ) : (
                      <Bot className="h-4 w-4 text-white/80" />
                    )}
                  </div>
                  <div
                    className={`py-3 px-4 rounded-2xl ${
                      message.role === "user"
                        ? "bg-white/5 border border-white/10"
                        : "bg-black/30 border border-white/10"
                    } whitespace-pre-wrap`}
                  >
                    <p className="text-white/90">{message.content}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="flex flex-row">
                <div className="rounded-full h-9 w-9 flex items-center justify-center bg-white/10 mr-2 border border-white/10">
                  <Bot className="h-4 w-4 text-white/80" />
                </div>
                <div className="py-3 px-4 rounded-2xl bg-black/30 border border-white/10">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 bg-white/40 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {!isExpanded && (
          <div className="p-6 text-center text-white/40">
            <Bot className="h-8 w-8 mx-auto mb-2 text-white/20" />
            <p className="text-sm">Chat content collapsed. Click the expand button to show messages.</p>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="backdrop-blur-md bg-black/30 border border-white/10 rounded-xl overflow-hidden">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder="Ask about IP assets, transactions, royalties, cross-chain swaps..."
            className="w-full py-4 px-4 bg-transparent border-none pr-24 focus:outline-none text-white placeholder:text-white/40"
            disabled={loading}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full text-white/60 hover:bg-white/10 hover:text-white/80"
              onClick={() => setInput("")}
              aria-label="Clear input"
              disabled={loading || !input.trim()}
            >
              <Zap className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="h-8 px-3 bg-white/10 hover:bg-white/15 border border-white/10 text-white hover:border-white/20"
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => setInput(suggestion)}
            className="backdrop-blur-sm bg-white/5 text-sm py-2 px-4 rounded-full hover:bg-white/10 transition-colors border border-white/10 text-white/80 hover:text-white hover:border-white/20"
            disabled={loading}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
