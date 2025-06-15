"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  ArrowLeftRight, 
  MessageSquare, 
  Repeat, 
  TrendingUp,
  Activity,
  ExternalLink,
  Copy,
  DollarSign,
  Plus,
  BarChart2,
  Coins,
  Users,
  Clock,
  FileText,
  Eye,
  ChevronRight
} from 'lucide-react'
import Link from "next/link"
import { api, type IPAsset, type Transaction, type RoyaltyPay } from "@/lib/api"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { shortenAddress } from "@/lib/utils"
import Image from "next/image"

interface PriceData {
  timestamp: number
  price: number
  date: string
}

export default function DashboardHomePage() {
  const [storyPrice, setStoryPrice] = useState<number | null>(null)
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([])
  const [ipAssets, setIpAssets] = useState<IPAsset[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [royalties, setRoyalties] = useState<RoyaltyPay[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalTransactions: 0,
    totalRoyalties: "0.00",
    totalValue: "0.00"
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch IP Assets
        const assetsResponse = await api.listIPAssets({ 
          pagination: { limit: 50 } 
        })
        const assetData = assetsResponse.data || []
        setIpAssets(assetData.slice(0, 3))

        // Fetch Transactions
        const transactionsResponse = await api.listTransactions({ 
          pagination: { limit: 50 } 
        })
        const transactionData = transactionsResponse.data || []
        setTransactions(transactionData.slice(0, 3))

        // Fetch Royalties
        const royaltiesResponse = await api.listRoyaltyPays({ 
          pagination: { limit: 20 } 
        })
        const royaltyData = royaltiesResponse.data || []
        setRoyalties(royaltyData.slice(0, 3))

        // Generate Story price history (mock data with realistic volatility)
        const mockPriceHistory = generateStoryPriceHistory(7)
        setPriceHistory(mockPriceHistory)
        setStoryPrice(mockPriceHistory[mockPriceHistory.length - 1]?.price || 0.25)

        // Calculate stats
        const totalRoyalties = royaltyData.reduce((sum: number, royalty: { amount: any }) => {
          return sum + parseFloat(royalty.amount || "0") / 1e18 // Convert from wei
        }, 0)

        setStats({
          totalAssets: assetData.length,
          totalTransactions: transactionData.length,
          totalRoyalties: totalRoyalties.toFixed(4),
          totalValue: (totalRoyalties * (mockPriceHistory[mockPriceHistory.length - 1]?.price || 0.25)).toFixed(2)
        })
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const generateStoryPriceHistory = (days: number): PriceData[] => {
    const data: PriceData[] = []
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    const basePrice = 0.25

    for (let i = days; i >= 0; i--) {
      const timestamp = now - i * dayMs
      
      const volatility = (Math.random() - 0.5) * 1.08 // ±8% volatility
      const trendFactor = (days - i) * 0.002 // Slight upward trend
      const price = basePrice + basePrice * volatility + trendFactor+3.294

      data.push({
        timestamp,
        price: Math.max(0.01, price), // Ensure positive price
        date: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      })
    }

    return data
  }

  const quickActions = [
    {
      title: "Create IP Asset",
      description: "Register new intellectual property",
      icon: Plus,
      href: "/dashboard/ip-assets",
      accent: "purple"
    },
    {
      title: "Bridge Tokens",
      description: "Cross-chain token swapping",
      icon: Repeat,
      href: "/dashboard/bridge",
      accent: "green"
    },
    {
      title: "AI Assistant",
      description: "Get intelligent help",
      icon: MessageSquare,
      href: "/dashboard/ai-chat",
      accent: "blue"
    },
    {
      title: "Check Activity",
      description: "View recent activity",
      icon: ArrowLeftRight,
      href: "/dashboard/transactions",
      accent: "orange"
    }
  ]

  const getAccentClasses = (accent: string) => {
    const classes = {
      purple: "border-purple-500/30 group-hover:border-purple-500/50 group-hover:bg-purple-500/5",
      green: "border-green-500/30 group-hover:border-green-500/50 group-hover:bg-green-500/5",
      blue: "border-blue-500/30 group-hover:border-blue-500/50 group-hover:bg-blue-500/5",
      orange: "border-orange-500/30 group-hover:border-orange-500/50 group-hover:bg-orange-500/5"
    }
    return classes[accent as keyof typeof classes] || classes.blue
  }

  const getIconAccentClasses = (accent: string) => {
    const classes = {
      purple: "text-purple-400 group-hover:text-purple-300",
      green: "text-green-400 group-hover:text-green-300",
      blue: "text-blue-400 group-hover:text-blue-300",
      orange: "text-orange-400 group-hover:text-orange-300"
    }
    return classes[accent as keyof typeof classes] || classes.blue
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-black/50 border border-white/20 rounded-lg p-6 animate-pulse">
              <div className="h-16 bg-white/10 rounded mb-4"></div>
              <div className="h-4 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 text-transparent bg-clip-text mb-2">
          Dashboard Overview
        </h1>
        <p className="text-white/60">
          Welcome back! Here's what's happening with your IP portfolio on Story Protocol.
        </p>
      </div>

      {/* Story Price Chart & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Story Price Chart */}
        <Card className="lg:col-span-2 bg-black/50 border-white/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Story Protocol Price
            </CardTitle>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold text-white">${storyPrice?.toFixed(4) || '0.0000'}</p>
                <p className="text-sm text-green-400">
                  +0.0012 (+4.8%) 24h
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory}>
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
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#a855f7" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-black/50 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <div className={`group p-3 rounded-lg border border-white/20 hover:border-white/40 ${getAccentClasses(action.accent)} transition-all duration-300 cursor-pointer`}>
                  <div className="flex items-center gap-3">
                    <action.icon className={`w-5 h-5 ${getIconAccentClasses(action.accent)}`} />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">{action.title}</h4>
                      <p className="text-xs text-white/60">{action.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Data Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent IP Assets */}
        <Card className="bg-black/50 border-white/20 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-400" />
              Recent IP Assets
            </CardTitle>
            <Link href="/dashboard/ip-assets">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                <Eye className="w-4 h-4 mr-1" />
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {ipAssets.length > 0 ? ipAssets.map((asset) => (
              <Link key={asset.id} href={`/dashboard/${asset.id}`}>
                <div className="group p-3 rounded-lg border border-white/10 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-3">
                    {asset.nftMetadata?.imageUrl ? (
                      <Image
                        src={asset.nftMetadata.imageUrl}
                        alt={asset.nftMetadata.name || "IP Asset"}
                        width={32}
                        height={32}
                        className="rounded"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center">
                        <FileText className="w-4 h-4 text-purple-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {asset.nftMetadata?.name || shortenAddress(asset.id)}
                      </p>
                      <p className="text-xs text-white/60">
                        {asset.childrenCount} children • {asset.parentCount} parents
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto mb-4 text-white/30" />
                <p className="text-white/60 text-sm">No IP assets found</p>
                <Link href="/dashboard/ip-assets">
                  <Button size="sm" className="mt-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30">
                    Create Asset
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-black/50 border-white/20 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-blue-400" />
              Recent Transactions
            </CardTitle>
            <Link href="/dashboard/transactions">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                <Eye className="w-4 h-4 mr-1" />
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.length > 0 ? transactions.map((transaction) => (
              <div key={transaction.id} className="group p-3 rounded-lg border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center">
                    <Activity className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {transaction.actionType}
                    </p>
                    <p className="text-xs text-white/60">
                      {shortenAddress(transaction.initiator)} • {new Date(parseInt(transaction.blockTimestamp) * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto mb-4 text-white/30" />
                <p className="text-white/60 text-sm">No transactions found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Royalties */}
        <Card className="bg-black/50 border-white/20 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              Recent Royalties
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
              <Eye className="w-4 h-4 mr-1" />
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {royalties.length > 0 ? royalties.map((royalty) => (
              <div key={royalty.id} className="group p-3 rounded-lg border border-white/10 hover:border-green-500/30 hover:bg-green-500/5 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center">
                    <Coins className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {(parseFloat(royalty.amount) / 1e18).toFixed(4)} STORY
                    </p>
                    <p className="text-xs text-white/60">
                      From {shortenAddress(royalty.payerIpId)}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-white/30" />
                <p className="text-white/60 text-sm">No royalties found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
