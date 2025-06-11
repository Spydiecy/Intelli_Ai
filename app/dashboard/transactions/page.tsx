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
import { Search, Activity, Database, RefreshCw, ArrowUpRight, ExternalLink, Sparkles, ChevronLeft, ChevronRight, Filter, Copy } from 'lucide-react'
import Link from "next/link"
import { motion } from "framer-motion"
import { shortenAddress, formatTimestamp } from "@/lib/utils"

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
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    loadTransactions()

    // Apply AI filter if present in URL
    if (aiFilterParam) {
      try {
        const filter = JSON.parse(decodeURIComponent(aiFilterParam)) 
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

  const handleApplyAIFilter = (filter:any) => {
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

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex)

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handleViewResponse = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowApiModal(true)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 text-transparent bg-clip-text mb-2">
              Transactions Explorer
            </h1>
            <p className="text-white/60">
              Explore all transactions on the Story Protocol blockchain. View transaction details, initiators, and related IP assets.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={loadTransactions}
              disabled={loading}
              variant="outline"
              size="icon"
              className="border-white/20 hover:bg-white/10 text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>
      {/* Search and Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4 mb-8"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
          <Input
            placeholder="Search by action type, IP ID, transaction hash, or initiator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black/50 border-white/20 text-white placeholder:text-white/40 backdrop-blur-sm hover:border-white/30 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="border-white/20 hover:bg-white/10 text-white gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button
            onClick={() => setShowApiModal(true)}
            variant="outline"
            className="border-white/20 hover:bg-white/10 text-white gap-2"
          >
            <Database className="w-4 h-4" />
            View API Response
          </Button>
        </div>
      </motion.div>

      {/* Quick Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-black/30 border border-white/10 rounded-lg p-4 backdrop-blur-sm mb-6"
        >
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={searchTerm === "" ? "default" : "outline"}
              onClick={() => setSearchTerm("")}
              className={searchTerm === "" ? "bg-white/20 text-white" : "border-white/20 text-white hover:bg-white/10"}
            >
              All Transactions
            </Button>
            {/* Action Type Filters */}
            {Array.from(new Set(transactions.map(t => t.actionType))).slice(0, 6).map((actionType) => (
              <Button
                key={actionType}
                size="sm"
                variant={searchTerm === actionType ? "default" : "outline"}
                onClick={() => setSearchTerm(actionType)}
                className={searchTerm === actionType ? "bg-white/20 text-white" : "border-white/20 text-white hover:bg-white/10"}
              >
                {actionType}
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Active Filter */}
      {activeFilter && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-black/20 border border-white/10 rounded-lg p-4 flex items-center justify-between backdrop-blur-sm"
        >
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-white/60 mr-2" />
            <span className="text-white/80">AI Filter: {activeFilter}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveFilter(null)
              setSearchTerm("")
            }}
            className="text-white/60 hover:text-white hover:bg-white/10"
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
          className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-8 backdrop-blur-sm"
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
        <Card className="bg-black/20 border-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Transactions</p>
                <p className="text-2xl font-bold text-white">{transactions.length}</p>
              </div>
              <Activity className="h-8 w-8 text-white/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Filtered Results</p>
                <p className="text-2xl font-bold text-white">{filteredTransactions.length}</p>
              </div>
              <Search className="h-8 w-8 text-white/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Action Types</p>
                <p className="text-2xl font-bold text-white">
                  {new Set(transactions.map((t) => t.actionType)).size}
                </p>
              </div>
              <Database className="h-8 w-8 text-white/60" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" />
          <span className="ml-4 text-white/60">Loading transactions...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {currentTransactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="bg-black/20 border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white">{transaction.actionType}</CardTitle>
                    <Badge className="bg-white/10 text-white/80 border-white/20">
                      <Activity className="w-3 h-3 mr-1" />
                      Transaction
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <label className="text-white/60 font-medium">IP ID</label>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-mono text-xs bg-black/20 p-2 rounded border border-white/10 flex-1">
                          {shortenAddress(transaction.ipId, 12, 8)}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(transaction.ipId)}
                          className="text-white/60 hover:text-white hover:bg-white/10 p-1 h-8 w-8"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-white/60 font-medium">Transaction Hash</label>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-mono text-xs bg-black/20 p-2 rounded border border-white/10 flex-1">
                          {shortenAddress(transaction.txHash, 12, 8)}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(transaction.txHash)}
                          className="text-white/60 hover:text-white hover:bg-white/10 p-1 h-8 w-8"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-white/60 font-medium">Initiator</label>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-mono text-xs bg-black/20 p-2 rounded border border-white/10 flex-1">
                          {shortenAddress(transaction.initiator, 12, 8)}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(transaction.initiator)}
                          className="text-white/60 hover:text-white hover:bg-white/10 p-1 h-8 w-8"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-white/60 font-medium">Block</label>
                        <p className="text-white">{transaction.blockNumber}</p>
                      </div>
                      <div>
                        <label className="text-white/60 font-medium">Resource Type</label>
                        <p className="text-white">{transaction.resourceType}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-white/60 font-medium">Timestamp</label>
                      <p className="text-white">{formatTimestamp(transaction.blockTimestamp)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <a 
                      href={`https://aeneid.storyscan.io/tx/${transaction.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button size="sm" variant="outline" className="w-full border-white/20 text-white/80 hover:bg-white/10">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        View Transaction
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewResponse(transaction)}
                      className="text-white/60 hover:text-white hover:bg-white/10"
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

      {/* Pagination */}
      {!loading && filteredTransactions.length > itemsPerPage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mt-8 pt-6 border-t border-white/10"
        >
          <div className="text-sm text-white/60">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === totalPages || 
                  Math.abs(page - currentPage) <= 1
                )
                .map((page, index, array) => (
                  <div key={page} className="flex items-center">
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="text-white/40 px-1">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-8 h-8 p-0 ${
                        currentPage === page 
                          ? "bg-white/20 text-white border-white/30" 
                          : "border-white/20 text-white hover:bg-white/10"
                      }`}
                    >
                      {page}
                    </Button>
                  </div>
                ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {!loading && filteredTransactions.length === 0 && !error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <Activity className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white/60 mb-2">No Transactions Found</h3>
          <p className="text-white/40">Try adjusting your search criteria</p>
        </motion.div>
      )}

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
