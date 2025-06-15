"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { type RoyaltyPay, api } from "@/lib/api"
import { Navigation } from "@/components/navigation"
import { ApiResponseModal } from "@/components/api-response-modal"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, DollarSign, Database, RefreshCw, ArrowUpRight, ArrowDownRight, ExternalLink, Sparkles, Filter, ChevronLeft, ChevronRight, Copy } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { shortenAddress, formatTimestamp, formatAmount } from "@/lib/utils"

export default function RoyaltiesPage() {
  const searchParams = useSearchParams()
  const initialIpId = searchParams.get("ipId") || ""
  const aiFilterParam = searchParams.get("aiFilter")

  const [royalties, setRoyalties] = useState<RoyaltyPay[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(initialIpId)
  const [selectedRoyalty, setSelectedRoyalty] = useState<RoyaltyPay | null>(null)
  const [showApiModal, setShowApiModal] = useState(false)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    loadRoyalties()

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

  const loadRoyalties = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.listRoyaltyPays()
      if (response.error) {
        setError(response.error)
        setRoyalties([])
      } else {
        setRoyalties(response.data || [])
      }
      setApiResponse(response)
    } catch (error) {
      console.error("Failed to load royalties:", error)
      setError("Failed to load royalties")
      setRoyalties([])
    } finally {
      setLoading(false)
    }
  }

  const handleApplyAIFilter = (filter: any) => {
    if (filter.dataType !== "royalties") {
      // Navigate to the appropriate page
      const path = filter.dataType === "ip_assets" ? "/" : `/${filter.dataType.replace("_", "-")}`
      window.location.href = `${path}?aiFilter=${encodeURIComponent(JSON.stringify(filter))}`
      return
    }

    // Apply filters to royalties
    setSearchTerm(filter.filters.searchTerm || "")
    setActiveFilter(filter.explanation)
  }

  const filteredRoyalties = royalties.filter(
    (royalty) =>
      royalty.payerIpId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      royalty.receiverIpId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      royalty.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      royalty.token.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredRoyalties.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRoyalties = filteredRoyalties.slice(startIndex, endIndex)

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handleViewResponse = (royalty: RoyaltyPay) => {
    setSelectedRoyalty(royalty)
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

  const totalAmount = royalties.reduce((sum, r) => sum + Number.parseFloat(r.amount || "0"), 0)

  // Format large numbers for total volume
  const formatLargeNumber = (num: number) => {
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(2)}B`
    } else if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`
    } else if (num >= 1) {
      return num.toFixed(2)
    }
    return num.toFixed(6)
  }

  // Format token amounts with proper smallest unit conversion
  const formatTokenAmount = (amount: string | number) => {
    const num = Number(amount || 0)
    
    // Handle very small numbers
    if (num < 0.000001) {
      return `${num.toExponential(2)} IP`
    }
    
    // Assuming 18 decimal places (convert from smallest units)
    const actualAmount = num / Math.pow(10, 18)
    
    if (actualAmount >= 1000000000) {
      return `${(actualAmount / 1000000000).toFixed(2)}B IP`
    } else if (actualAmount >= 1000000) {
      return `${(actualAmount / 1000000).toFixed(2)}M IP`
    } else if (actualAmount >= 1000) {
      return `${(actualAmount / 1000).toFixed(2)}K IP`
    } else if (actualAmount >= 1) {
      return `${actualAmount.toFixed(2)} IP`
    } else if (actualAmount >= 0.01) {
      return `${actualAmount.toFixed(4)} IP`
    }
    return `${actualAmount.toFixed(6)} IP`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 text-transparent bg-clip-text mb-2">
              Royalties Explorer
            </h1>
            <p className="text-white/60">
              Track royalty payments across the Story Protocol ecosystem. View payment flows between IP assets and analyze revenue streams.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={loadRoyalties}
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5 z-10 pointer-events-none" />
          <Input
            placeholder="Search by payer IP, receiver IP, sender, or token..."
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
              All Royalties
            </Button>
            {Array.from(new Set(royalties.map(r => r.token))).slice(0, 6).map((token) => (
              <Button
                key={token}
                size="sm"
                variant={searchTerm === token ? "default" : "outline"}
                onClick={() => setSearchTerm(token)}
                className={searchTerm === token ? "bg-white/20 text-white" : "border-white/20 text-white hover:bg-white/10"}
              >
                {shortenAddress(token, 6, 4)}
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
          <Button onClick={loadRoyalties} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
            Try Again
          </Button>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <Card className="bg-black/20 border-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Royalties</p>
                <p className="text-2xl font-bold text-white">{royalties.length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-white/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Filtered Results</p>
                <p className="text-2xl font-bold text-white">{filteredRoyalties.length}</p>
              </div>
              <Search className="h-8 w-8 text-white/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Volume</p>
                <p className="text-lg font-bold text-white">{formatLargeNumber(totalAmount)}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-white/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Token Types</p>
                <p className="text-2xl font-bold text-white">
                  {new Set(royalties.map((r) => r.token)).size}
                </p>
              </div>
              <Database className="h-8 w-8 text-white/60" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Royalties Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" />
          <span className="ml-4 text-white/60">Loading royalties...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {currentRoyalties.map((royalty, index) => (
            <motion.div
              key={royalty.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="bg-black/20 border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white">Royalty Payment</CardTitle>
                    <Badge className="bg-white/10 text-white border-white/20 px-3 py-1">
                      <DollarSign className="w-3 h-3 mr-1" />
                      <span className="font-mono text-sm">{formatTokenAmount(royalty.amount || 0)}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Payer and Receiver Section */}
                  <div className="bg-white/5 p-3 rounded border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white/60 mb-1 font-medium">PAYER IP</div>
                        <div className="flex items-center gap-2">
                          <div className="text-white font-mono text-xs">{shortenAddress(royalty.payerIpId, 8, 6)}</div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(royalty.payerIpId)}
                            className="h-5 w-5 p-0 text-white/40 hover:text-white hover:bg-white/10"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <ArrowDownRight className="w-4 h-4 text-white/40 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white/60 mb-1 font-medium">RECEIVER IP</div>
                        <div className="flex items-center gap-2">
                          <div className="text-white font-mono text-xs">{shortenAddress(royalty.receiverIpId, 8, 6)}</div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(royalty.receiverIpId)}
                            className="h-5 w-5 p-0 text-white/40 hover:text-white hover:bg-white/10"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-white/60 font-medium text-xs uppercase tracking-wide">Sender</label>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-mono text-xs">{shortenAddress(royalty.sender, 8, 6)}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(royalty.sender)}
                          className="h-6 w-6 p-0 text-white/40 hover:text-white hover:bg-white/10"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-white/60 font-medium text-xs uppercase tracking-wide">Token</label>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-mono text-xs">{shortenAddress(royalty.token, 8, 6)}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(royalty.token)}
                          className="h-6 w-6 p-0 text-white/40 hover:text-white hover:bg-white/10"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-white/60 font-medium text-xs uppercase tracking-wide">Timestamp</label>
                    <p className="text-white text-sm">{formatTimestamp(royalty.blockTimestamp)}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <a 
                      href={`https://aeneid.storyscan.io/address/${royalty.receiverIpId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button size="sm" variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        View in Explorer
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewResponse(royalty)}
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
      {!loading && filteredRoyalties.length > itemsPerPage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mt-8 pt-6 border-t border-white/10"
        >
          <div className="text-sm text-white/60">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredRoyalties.length)} of {filteredRoyalties.length} entries
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

      {!loading && filteredRoyalties.length === 0 && !error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <DollarSign className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white/60 mb-2">No Royalties Found</h3>
          <p className="text-white/40">Try adjusting your search criteria</p>
        </motion.div>
      )}

      {/* API Response Modal */}
      <ApiResponseModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        title={selectedRoyalty ? `Royalty: ${formatTokenAmount(selectedRoyalty.amount || 0)}` : "Royalties API Response"}
        data={selectedRoyalty || apiResponse}
      />
    </div>
  )
}
