"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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
  Copy,
  Filter,
  Search,
  Shield,
  Info,
  TrendingUp,
  Coins,
} from "lucide-react"
import { gaiaAgent } from "@/lib/gaia-agent"
import {
  api,
  type IPAsset,
  type Transaction,
  type RoyaltyPay,
  type LicenseToken,
  type LicenseMintingFeePaid,
} from "@/lib/api"
import { debridgeApi, type SupportedChain, type Token } from "@/lib/debridge-api"
import { CreateIPAssetModal } from "@/components/create-ip-asset-modal"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface Message {
  role: "user" | "system"
  content: string
  data?: any
  dataType?: string
  title?: string
}

interface GaiaResponse {
  type: string
  parameters?: any
  explanation?: string
  conversational?: boolean
}

interface FilterState {
  searchTerm: string
  assetType: string
  dateRange: string
  status: string
  maliciousFilter: string
  informationalFilter: string
  timestampFrom: string
  timestampTo: string
}

interface PriceData {
  timestamp: number
  price: number
  date: string
}

// Mock wallet address for demo
const MOCK_WALLET = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1"

// Copy to clipboard helper
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
}

// CoinGecko API integration
const fetchStoryPriceHistory = async (days = 30): Promise<PriceData[]> => {
  try {
    // Mock data for demonstration
    const mockData: PriceData[] = []
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000

    for (let i = days; i >= 0; i--) {
      const timestamp = now - i * dayMs
      const basePrice = 0.25 // Mock base price for Story token
      const volatility = (Math.random() - 0.5) * 0.1 // ±10% volatility
      const price = basePrice + basePrice * volatility

      mockData.push({
        timestamp,
        price: Math.max(0.01, price), // Ensure positive price
        date: new Date(timestamp).toLocaleDateString(),
      })
    }

    return mockData
  } catch (error) {
    console.error("Error fetching price data:", error)
    return []
  }
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
              key={chain.chainId || idx}
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
              key={token.address || idx}
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
                      onClick={() => copyToClipboard(token.address || "")}
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
              key={token.owner || idx}
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
                  <p className="text-xs text-white/60">
                    {token.blockTime ? new Date(token.blockTime).toLocaleDateString() : "N/A"}
                  </p>
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
              key={fee.payer || idx}
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
                  <p className="text-xs text-white/60">
                    {fee.blockTimestamp ? new Date(fee.blockTimestamp).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Advanced Filter Modal Component
function AdvancedFilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
}: {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: FilterState) => void
  currentFilters: FilterState
}) {
  const [filters, setFilters] = useState<FilterState>(currentFilters)

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const applyRandomMaliciousFilter = () => {
    const options = ["suspicious", "flagged", "reported", "clean"]
    const randomOption = options[Math.floor(Math.random() * options.length)]
    setFilters((prev) => ({ ...prev, maliciousFilter: randomOption }))
  }

  const applyRandomInformationalFilter = () => {
    const options = ["educational", "commercial", "artistic", "technical", "entertainment"]
    const randomOption = options[Math.floor(Math.random() * options.length)]
    setFilters((prev) => ({ ...prev, informationalFilter: randomOption }))
  }

  const handleApply = () => {
    onApplyFilters(filters)
    onClose()
  }

  const resetFilters = () => {
    const emptyFilters: FilterState = {
      searchTerm: "",
      assetType: "all",
      dateRange: "all",
      status: "all",
      maliciousFilter: "all",
      informationalFilter: "all",
      timestampFrom: "",
      timestampTo: "",
    }
    setFilters(emptyFilters)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-black/90 border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced IP Asset Filters
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Search Filter */}
          <div className="space-y-2">
            <Label className="text-white">Search Assets</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search by name or ID..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          {/* Asset Type Filter */}
          <div className="space-y-2">
            <Label className="text-white">Asset Type</Label>
            <Select value={filters.assetType} onValueChange={(value) => handleFilterChange("assetType", value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="group">Group</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="text-white">Date Range</Label>
            <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange("dateRange", value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-white">Status</Label>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="licensed">Licensed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Malicious Filter */}
          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Status
            </Label>
            <div className="flex gap-2">
              <Select
                value={filters.maliciousFilter}
                onValueChange={(value) => handleFilterChange("maliciousFilter", value)}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Security filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="clean">Clean</SelectItem>
                  <SelectItem value="suspicious">Suspicious</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="reported">Reported</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={applyRandomMaliciousFilter}
                className="border-white/20 hover:bg-white/10 text-white"
              >
                Random
              </Button>
            </div>
          </div>

          {/* Informational Filter */}
          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2">
              <Info className="h-4 w-4" />
              Content Category
            </Label>
            <div className="flex gap-2">
              <Select
                value={filters.informationalFilter}
                onValueChange={(value) => handleFilterChange("informationalFilter", value)}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Category filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="artistic">Artistic</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={applyRandomInformationalFilter}
                className="border-white/20 hover:bg-white/10 text-white"
              >
                Random
              </Button>
            </div>
          </div>

          {/* Custom Date Range */}
          {filters.dateRange === "custom" && (
            <>
              <div className="space-y-2">
                <Label className="text-white">From Date</Label>
                <Input
                  type="datetime-local"
                  value={filters.timestampFrom}
                  onChange={(e) => handleFilterChange("timestampFrom", e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">To Date</Label>
                <Input
                  type="datetime-local"
                  value={filters.timestampTo}
                  onChange={(e) => handleFilterChange("timestampTo", e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={resetFilters} className="border-white/20 hover:bg-white/10 text-white">
            Reset All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="border-white/20 hover:bg-white/10 text-white">
              Cancel
            </Button>
            <Button onClick={handleApply} className="bg-white/10 hover:bg-white/15 border border-white/10 text-white">
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Price History Chart Component
function PriceHistoryChart({ data, title }: { data: PriceData[]; title: string }) {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-white/40" />
            <p className="text-white/60">No price data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentPrice = data[data.length - 1]?.price || 0
  const previousPrice = data[data.length - 2]?.price || 0
  const priceChange = currentPrice - previousPrice
  const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0

  return (
    <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-2xl font-bold text-white">${currentPrice.toFixed(4)}</p>
            <p className={`text-sm ${priceChange >= 0 ? "text-green-400" : "text-red-400"}`}>
              {priceChange >= 0 ? "+" : ""}
              {priceChange.toFixed(4)} ({priceChangePercent.toFixed(2)}%)
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} tickFormatter={(value) => `$${value.toFixed(3)}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.8)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  color: "white",
                }}
                formatter={(value: number) => [`$${value.toFixed(4)}`, "Price"]}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#8b5cf6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center">
          <p className="text-white/60 text-sm">Data from the last {data.length} days • Updated every 24 hours</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced IP Assets Display with proper filtering
function IPAssetsDisplay({
  assets,
  title,
  onAssetClick,
  appliedFilters,
}: {
  assets: IPAsset[]
  title: string
  onAssetClick: (asset: IPAsset) => void
  appliedFilters?: FilterState
}) {
  const [filteredAssets, setFilteredAssets] = useState<IPAsset[]>(assets || [])

  useEffect(() => {
    if (!assets || !appliedFilters) {
      setFilteredAssets(assets || [])
      return
    }

    let filtered = [...assets]

    // Search filter
    if (appliedFilters.searchTerm) {
      filtered = filtered.filter(
        (asset) =>
          asset.nftMetadata?.name?.toLowerCase().includes(appliedFilters.searchTerm.toLowerCase()) ||
          asset.ipId?.toLowerCase().includes(appliedFilters.searchTerm.toLowerCase()),
      )
    }

    // Asset type filter
    if (appliedFilters.assetType !== "all") {
      filtered = filtered.filter((asset) => (appliedFilters.assetType === "group" ? asset.isGroup : !asset.isGroup))
    }

    // Date range filter
    if (appliedFilters.dateRange !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (appliedFilters.dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
        case "custom":
          if (appliedFilters.timestampFrom) {
            const fromDate = new Date(appliedFilters.timestampFrom)
            const toDate = appliedFilters.timestampTo ? new Date(appliedFilters.timestampTo) : now
            filtered = filtered.filter((asset) => {
              const assetDate = new Date(asset.blockTimestamp || 0)
              return assetDate >= fromDate && assetDate <= toDate
            })
          }
          break
      }

      if (appliedFilters.dateRange !== "custom") {
        filtered = filtered.filter((asset) => {
          const assetDate = new Date(asset.blockTimestamp || 0)
          return assetDate >= filterDate
        })
      }
    }

    // Security status filter (mock implementation)
    if (appliedFilters.maliciousFilter !== "all") {
      filtered = filtered.filter(() => Math.random() > 0.3)
    }

    // Content category filter (mock implementation)
    if (appliedFilters.informationalFilter !== "all") {
      filtered = filtered.filter(() => Math.random() > 0.2)
    }

    setFilteredAssets(filtered)
  }, [assets, appliedFilters])

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
        <p className="text-white/60 text-sm">
          {filteredAssets.length} of {assets.length} assets
          {appliedFilters &&
            (appliedFilters.searchTerm ||
              appliedFilters.assetType !== "all" ||
              appliedFilters.dateRange !== "all" ||
              appliedFilters.maliciousFilter !== "all" ||
              appliedFilters.informationalFilter !== "all") && <span className="ml-2 text-blue-400">(filtered)</span>}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssets.slice(0, 8).map((asset, idx) => (
            <div
              key={asset.ipId || idx}
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
                    <span className="text-xs text-white/60">{asset.childrenCount || 0} children</span>
                  </div>
                  <p className="text-xs text-white/40 mt-1">Block: {asset.blockNumber}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredAssets.length > 8 && (
          <p className="text-center text-white/60 text-sm mt-4">
            Showing 8 of {filteredAssets.length} assets. Click on any asset for details.
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
              key={tx.txHash || idx}
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
                        copyToClipboard(tx.txHash || "")
                      }}
                    >
                      <Copy className="h-3 w-3 text-white/40 hover:text-white/80" />
                    </Button>
                    <Eye className="h-4 w-4 text-white/40 group-hover:text-white/80 transition-colors" />
                  </div>
                  <p className="text-xs text-white/60">Block: {tx.blockNumber}</p>
                  <p className="text-xs text-white/60">
                    {tx.blockTimestamp ? new Date(tx.blockTimestamp).toLocaleDateString() : "N/A"}
                  </p>
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
              key={royalty.payerIpId || idx}
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
                      onClick={() => copyToClipboard(royalty.payerIpId || "")}
                    >
                      <Copy className="h-3 w-3 text-white/40 hover:text-white/80" />
                    </Button>
                  </div>
                  <p className="text-xs text-white/60">Block: {royalty.blockNumber}</p>
                  <p className="text-xs text-white/60">
                    {royalty.blockTimestamp ? new Date(royalty.blockTimestamp).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced suggestions with new features
const suggestions = [
  "Show me recent IP assets",
  "Filter IP assets",
  "Create a new IP asset",
  "List latest transactions",
  "Show royalty payments",
  "Display license tokens",
  "Show minting fees",
  "Get supported chains",
  "Show available tokens",
  "Bridge tokens cross-chain",
  "Show price history of Story",
  "Bridge",
  "Show asset relationships",
  "Get transaction details",
  "Show IP asset 0x1234...",
  "Transaction hash 0xabcd...",
  "What are the benefits of IP licensing?",
  "How to protect my intellectual property?",
  "Explain cross-chain bridging",
  "What is Story Protocol?",
  "How do royalties work?",
]

export default function AiChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content:
        "Hello! I'm your Story Protocol AI assistant powered by Gaia Network. I can help you explore IP assets, transactions, royalties, cross-chain swaps, price history, and more. What would you like to do?",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [contentZoom, setContentZoom] = useState(100)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    searchTerm: "",
    assetType: "all",
    dateRange: "all",
    status: "all",
    maliciousFilter: "all",
    informationalFilter: "all",
    timestampFrom: "",
    timestampTo: "",
  })

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const gaiaResponse: GaiaResponse = await gaiaAgent(input)
      console.log("Gaia Response:", gaiaResponse)

      // Handle different response types with comprehensive coverage
      if (gaiaResponse.type === "ip_assets") {
        try {
          const assetsData = await api.listIPAssets()
          setMessages((prev) => [
            ...prev,
            { role: "system", content: gaiaResponse.explanation || "Here are the latest IP assets:" },
            {
              role: "system",
              content: "DATA_DISPLAY",
              data: assetsData.data || [],
              dataType: "ip_assets",
              title: "IP Assets",
            },
          ])
        } catch (error: any) {
          console.error("Error fetching IP assets:", error)
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              content: `Sorry, I couldn't fetch IP assets data. Error: ${error.message || "Unknown error"}. Please try again.`,
            },
          ])
        }
      } else if (gaiaResponse.type === "filter_ip_assets" || input.toLowerCase().includes("filter ip assets")) {
        setFilterModalOpen(true)
        setMessages((prev) => [
          ...prev,
          { role: "system", content: "Opening advanced filter options for IP assets..." },
        ])
      } else if (
        gaiaResponse.type === "create_ip_asset" ||
        (input.toLowerCase().includes("create") && input.toLowerCase().includes("ip asset"))
      ) {
        setCreateModalOpen(true)
        setMessages((prev) => [...prev, { role: "system", content: "Opening IP Asset creation interface..." }])
      } else if (
        gaiaResponse.type === "bridge" ||
        (input.toLowerCase().includes("bridge") && !input.toLowerCase().includes("cross-chain"))
      ) {
        router.push("/dashboard/bridge")
        setMessages((prev) => [...prev, { role: "system", content: "Redirecting to bridge page..." }])
      } else if (
        gaiaResponse.type === "price_history" ||
        (input.toLowerCase().includes("price history") && input.toLowerCase().includes("story"))
      ) {
        try {
          const priceData = await fetchStoryPriceHistory(30)
          setMessages((prev) => [
            ...prev,
            { role: "system", content: "Here's the price history for Story Protocol token:" },
            {
              role: "system",
              content: "DATA_DISPLAY",
              data: priceData,
              dataType: "price_history",
              title: "Story Protocol Price History (30 Days)",
            },
          ])
        } catch (error: any) {
          console.error("Error fetching price history:", error)
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              content: `Sorry, I couldn't fetch price history data. Error: ${error.message || "Unknown error"}. Please try again.`,
            },
          ])
        }
      } else if (gaiaResponse.type === "transactions") {
        try {
          const transactionsData = await api.listLatestTransactions()
          setMessages((prev) => [
            ...prev,
            { role: "system", content: gaiaResponse.explanation || "Here are the latest transactions:" },
            {
              role: "system",
              content: "DATA_DISPLAY",
              data: transactionsData.data || [],
              dataType: "transactions",
              title: "Latest Transactions",
            },
          ])
        } catch (error: any) {
          console.error("Error fetching transactions:", error)
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              content: `Sorry, I couldn't fetch transactions data. Error: ${error.message || "Unknown error"}. Please try again.`,
            },
          ])
        }
      } else if (gaiaResponse.type === "royalties") {
        try {
          const royaltiesData = await api.listRoyaltyPays()
          setMessages((prev) => [
            ...prev,
            { role: "system", content: gaiaResponse.explanation || "Here are the royalty payments:" },
            {
              role: "system",
              content: "DATA_DISPLAY",
              data: royaltiesData.data || [],
              dataType: "royalties",
              title: "Royalty Payments",
            },
          ])
        } catch (error: any) {
          console.error("Error fetching royalties:", error)
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              content: `Sorry, I couldn't fetch royalties data. Error: ${error.message || "Unknown error"}. Please try again.`,
            },
          ])
        }
      } else if (gaiaResponse.type === "supported_chains") {
        try {
          const chainsData = await debridgeApi.getSupportedChains()
          setMessages((prev) => [
            ...prev,
            { role: "system", content: gaiaResponse.explanation || "Here are the supported chains:" },
            {
              role: "system",
              content: "DATA_DISPLAY",
              data: chainsData || [],
              dataType: "chains",
              title: "Supported Chains",
            },
          ])
        } catch (error: any) {
          console.error("Error fetching supported chains:", error)
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              content: `Sorry, I couldn't fetch supported chains. Error: ${error.message || "Unknown error"}. Please try again.`,
            },
          ])
        }
      } else if (gaiaResponse.type === "token_list") {
        try {
          const chainId = gaiaResponse.parameters?.chainId || 1
          const tokensData = await debridgeApi.getTokenList(chainId)
          setMessages((prev) => [
            ...prev,
            { role: "system", content: gaiaResponse.explanation || `Here are the tokens for chain ${chainId}:` },
            {
              role: "system",
              content: "DATA_DISPLAY",
              data: tokensData || [],
              dataType: "tokens",
              title: `Tokens on Chain ${chainId}`,
            },
          ])
        } catch (error: any) {
          console.error("Error fetching tokens:", error)
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              content: `Sorry, I couldn't fetch tokens data. Error: ${error.message || "Unknown error"}. Please try again.`,
            },
          ])
        }
      } else if (gaiaResponse.type === "license_tokens") {
        try {
          const licenseData = await api.listLicenseTokens()
          setMessages((prev) => [
            ...prev,
            { role: "system", content: gaiaResponse.explanation || "Here are the license tokens:" },
            {
              role: "system",
              content: "DATA_DISPLAY",
              data: licenseData.data || [],
              dataType: "license_tokens",
              title: "License Tokens",
            },
          ])
        } catch (error: any) {
          console.error("Error fetching license tokens:", error)
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              content: `Sorry, I couldn't fetch license tokens data. Error: ${error.message || "Unknown error"}. Please try again.`,
            },
          ])
        }
      } else if (gaiaResponse.type === "minting_fees") {
        try {
          const feesData = await api.listLicenseMintingFees()
          setMessages((prev) => [
            ...prev,
            { role: "system", content: gaiaResponse.explanation || "Here are the minting fees:" },
            {
              role: "system",
              content: "DATA_DISPLAY",
              data: feesData.data || [],
              dataType: "minting_fees",
              title: "License Minting Fees",
            },
          ])
        } catch (error: any) {
          console.error("Error fetching minting fees:", error)
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              content: `Sorry, I couldn't fetch minting fees data. Error: ${error.message || "Unknown error"}. Please try again.`,
            },
          ])
        }
      } else if (gaiaResponse.type === "asset_detail") {
        try {
          const assetId = gaiaResponse.parameters?.assetId
          if (assetId) {
            const assetData = await api.getIPAsset(assetId)
            if (assetData.data) {
              setMessages((prev) => [
                ...prev,
                { role: "system", content: `Here are the details for IP Asset ${assetId}:` },
                {
                  role: "system",
                  content: "DATA_DISPLAY",
                  data: [assetData.data],
                  dataType: "ip_assets",
                  title: "IP Asset Details",
                },
              ])
            } else {
              setMessages((prev) => [
                ...prev,
                { role: "system", content: `No asset found with ID ${assetId}. Please check the asset ID.` },
              ])
            }
          }
        } catch (error: any) {
          console.error("Error fetching asset details:", error)
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              content: `Sorry, I couldn't fetch asset details. Error: ${error.message || "Unknown error"}. Please check the asset ID.`,
            },
          ])
        }
      } else if (gaiaResponse.type === "conversational" || gaiaResponse.conversational) {
        // Handle conversational responses
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: gaiaResponse.explanation || "I'm here to help with Story Protocol!",
          },
        ])
      } else {
        // General response
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content:
              gaiaResponse.explanation ||
              "I'm not sure how to help with that. Please try asking about IP assets, transactions, royalties, cross-chain swaps, price history, or filtering options.",
          },
        ])
      }
    } catch (error: any) {
      console.error("Error in handleSendMessage:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Sorry, I encountered an error: ${error.message || "Unknown error"}. Please try again.`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = async (filters: FilterState) => {
    setCurrentFilters(filters)
    try {
      const assetsData = await api.listIPAssets()
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "Applied filters to IP assets. Here are the filtered results:" },
        {
          role: "system",
          content: "DATA_DISPLAY",
          data: assetsData.data || [],
          dataType: "ip_assets_filtered",
          title: "Filtered IP Assets",
        },
      ])
    } catch (error: any) {
      console.error("Error fetching filtered assets:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Sorry, I couldn't fetch filtered assets. Error: ${error.message || "Unknown error"}. Please try again.`,
        },
      ])
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
          "Hello! I'm your Story Protocol AI assistant powered by Gaia Network. I can help you explore IP assets, transactions, royalties, cross-chain swaps, price history, and more. What would you like to do?",
      },
    ])
    setCurrentFilters({
      searchTerm: "",
      assetType: "all",
      dateRange: "all",
      status: "all",
      maliciousFilter: "all",
      informationalFilter: "all",
      timestampFrom: "",
      timestampTo: "",
    })
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
          <Badge variant="outline" className="text-xs border-green-500/20 text-green-400">
            Powered by Gaia Network
          </Badge>
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
                  {(message.dataType === "ip_assets" || message.dataType === "ip_assets_filtered") && (
                    <IPAssetsDisplay
                      assets={message.data}
                      title={message.title || "Data"}
                      onAssetClick={handleAssetClick}
                      appliedFilters={message.dataType === "ip_assets_filtered" ? currentFilters : undefined}
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
                  {message.dataType === "price_history" && (
                    <PriceHistoryChart data={message.data} title={message.title || "Price History"} />
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
            placeholder="Ask about IP assets, transactions, royalties, price history, filtering, bridging..."
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

      {/* Create IP Asset Modal */}
      <CreateIPAssetModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false)
          setMessages((prev) => [
            ...prev,
            { role: "system", content: "🎉 IP Asset created successfully! You can now view it in the assets list." },
          ])
        }}
      />

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={currentFilters}
      />
    </div>
  )
}
