"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { type Transaction, api } from "@/lib/api"
import { Navigation } from "@/components/navigation"
import { ApiResponseModal } from "@/components/api-response-modal"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Activity, Database, RefreshCw, ArrowUpRight, ExternalLink, Sparkles } from 'lucide-react'
import Link from "next/link"
import { motion } from "framer-motion"
import { shortenAddress, formatTimestamp } from "@/lib/utils"
import { type GeminiFilterResponse } from "@/lib/gemini-agent"

export default function TransactionsPage() {
  const searchParams = useSearchParams()
  const initialIpId = searchParams.get("ipId") || ""
  const aiFilterParam = searchParams.get("aiFilter")

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(initialIpId)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showApiModal, setShowApiModal] = useState(false)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  useEffect(() => {
    loadTransactions()

    // Apply AI filter if present in URL
    if (aiFilterParam) {
      try {
        const filter = JSON.parse(decodeURIComponent(aiFilterParam)) as GeminiFilterResponse
        if (filter.filters.searchTerm) {
          setSearchTerm(filter.filters.searchTerm)
        }
        setActiveFilter(filter.explanation)
      } catch (err) {
        console.error("Failed to parse AI filter from URL", err)
      }
    }
  }, [aiFilterParam])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.listLatestTransactions()
      if (response.error) {
        setError(response.error)
        setTransactions([])
      } else {
        setTransactions(response.data || [])
      }
      setApiResponse(response)
    } catch (error) {
      console.error("Failed to load transactions:", error)
      setError("Failed to load transactions")
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const handleApplyAIFilter = (filter: GeminiFilterResponse) => {
    if (filter.dataType !== "transactions") {
      // Navigate to the appropriate page
      const path = filter.dataType === "ip_assets" ? "/" : `/${filter.dataType.replace('_', '-')}`
      window.location.href = `${path}?aiFilter=${encodeURIComponent(JSON.stringify(filter))}`
      return
    }

    // Apply filters to transactions
    setSearchTerm(filter.filters.searchTerm || "")
    setActiveFilter(filter.explanation)
  }

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.ipId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.initiator.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleViewResponse = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowApiModal(true)
  }

  return (
    <div className="min-h-screen bg-black">

      {/* Header */}
      <div className="bg-gradient-to-r from-green-900 via-black to-green-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <Activity className="w-12 h-12 text-green-400 mr-4" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Transactions Explorer
              </h1>
            </div>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Explore all transactions on the Story Protocol blockchain. View transaction details, initiators, and
              related IP assets.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by action type, IP ID, transaction hash, or initiator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadTransactions}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowApiModal(true)}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <Database className="w-4 h-4 mr-2" />
              View API Response
            </Button>
          </div>
        </motion.div>

        {/* Active Filter */}
        {activeFilter && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gray-800 border border-green-500/30 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center">
              <Sparkles className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-gray-300">AI Filter: {activeFilter}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveFilter(null)
                setSearchTerm("")
              }}
              className="text-gray-400 hover:text-gray-200"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-8"
          >
            <h3 className="text-red-400 font-semibold mb-2">Error</h3>
            <p className="text-red-300">{error}</p>
            <Button onClick={loadTransactions} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card className="gradient-card-green">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{transactions.length}</div>
                  <div className="text-sm text-green-300">Total Transactions</div>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card-blue">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{filteredTransactions.length}</div>
                  <div className="text-sm text-blue-300">Filtered Results</div>
                </div>
                <Search className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card-purple">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {new Set(transactions.map((t) => t.actionType)).size}
                  </div>
                  <div className="text-sm text-purple-300">Action Types</div>
                </div>
                <Database className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
            <span className="ml-4 text-gray-400">Loading transactions...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-gray-900 border border-gray-800 hover:border-green-500/50 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">{transaction.actionType}</CardTitle>
                      <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
                        <Activity className="w-3 h-3 mr-1" />
                        Transaction
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <label className="text-gray-400 font-medium">IP ID</label>
                        <p className="text-white font-mono text-xs bg-gray-800 p-2 rounded border border-gray-700">
                          {shortenAddress(transaction.ipId, 12, 8)}
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-400 font-medium">Transaction Hash</label>
                        <p className="text-white font-mono text-xs bg-gray-800 p-2 rounded border border-gray-700">
                          {shortenAddress(transaction.txHash, 12, 8)}
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-400 font-medium">Initiator</label>
                        <p className="text-white font-mono text-xs bg-gray-800 p-2 rounded border border-gray-700">
                          {shortenAddress(transaction.initiator, 12, 8)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-gray-400 font-medium">Block</label>
                          <p className="text-white">{transaction.blockNumber}</p>
                        </div>
                        <div>
                          <label className="text-gray-400 font-medium">Resource Type</label>
                          <p className="text-white">{transaction.resourceType}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-gray-400 font-medium">Timestamp</label>
                        <p className="text-white">{formatTimestamp(transaction.blockTimestamp)}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-700">
                      <Link href={`/dashboard/transactions/?search=${transaction.ipId}`}>
                        <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                          <ArrowUpRight className="w-4 h-4 mr-1" />
                          View IP Asset
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewResponse(transaction)}
                        className="text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filteredTransactions.length === 0 && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Transactions Found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </motion.div>
        )}
      </div>

      {/* API Response Modal */}
      <ApiResponseModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        title={selectedTransaction ? `Transaction: ${selectedTransaction.actionType}` : "Transactions API Response"}
        data={selectedTransaction || apiResponse}
      />
    </div>
  )
}
