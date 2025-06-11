"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { type LicenseMintingFeePaid, api } from "@/lib/api"
import { Navigation } from "@/components/navigation"
import { ApiResponseModal } from "@/components/api-response-modal"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, CreditCard, Database, RefreshCw, ArrowUpRight, ArrowDownRight, ExternalLink, Filter, ChevronLeft, ChevronRight, Copy } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { shortenAddress, formatTimestamp, formatAmount } from "@/lib/utils"

export default function MintingFeesPage() {
  const searchParams = useSearchParams()
  const initialIpId = searchParams.get("ipId") || ""

  const [mintingFees, setMintingFees] = useState<LicenseMintingFeePaid[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(initialIpId)
  const [selectedFee, setSelectedFee] = useState<LicenseMintingFeePaid | null>(null)
  const [showApiModal, setShowApiModal] = useState(false)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    loadMintingFees()
  }, [])

  const loadMintingFees = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.listLicenseMintingFees()
      if (response.error) {
        setError(response.error)
        setMintingFees([])
      } else {
        setMintingFees(response.data || [])
      }
      setApiResponse(response)
    } catch (error) {
      console.error("Failed to load minting fees:", error)
      setError("Failed to load minting fees")
      setMintingFees([])
    } finally {
      setLoading(false)
    }
  }

  const filteredFees = mintingFees.filter(
    (fee) =>
      fee.receiverIpId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.payer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.token.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleViewResponse = (fee: LicenseMintingFeePaid) => {
    setSelectedFee(fee)
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

  const totalAmount = mintingFees.reduce((sum, f) => sum + Number.parseFloat(f.amount || "0"), 0)

  // Format large numbers for total volume (no Wei conversion, just K/M/B suffixes)
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

  // Format token amounts with proper Wei-like conversion (Story Protocol uses IP token)
  const formatTokenAmount = (amount: string | number) => {
    const num = Number(amount || 0)
    
    // Handle very small numbers
    if (num < 0.000001) {
      return `${num.toExponential(2)} IP`
    }
    
    // Assuming 18 decimal places like ETH (convert from Wei-like units)
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

  // Pagination logic
  const totalPages = Math.ceil(filteredFees.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentFees = filteredFees.slice(startIndex, endIndex)

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 text-transparent bg-clip-text mb-2">
              Minting Fees Explorer
            </h1>
            <p className="text-white/60">
              Track license minting fee payments across the Story Protocol ecosystem. Monitor fee flows and analyze minting costs.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={loadMintingFees}
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
            placeholder="Search by receiver IP, payer, or token..."
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
          className="bg-black/30 border border-white/10 rounded-lg p-4 backdrop-blur-sm"
        >
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={searchTerm === "" ? "default" : "outline"}
              onClick={() => setSearchTerm("")}
              className={searchTerm === "" ? "bg-white/20 text-white" : "border-white/20 text-white hover:bg-white/10"}
            >
              All Fees
            </Button>
            {Array.from(new Set(mintingFees.map(f => f.token))).map(token => (
              <Button
                key={token}
                size="sm"
                variant={searchTerm === token ? "default" : "outline"}
                onClick={() => setSearchTerm(token)}
                className={searchTerm === token ? "bg-white/20 text-white" : "border-white/20 text-white hover:bg-white/10"}
              >
                {token}
              </Button>
            ))}
          </div>
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
            <Button onClick={loadMintingFees} className="mt-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300">
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
                  <div className="text-2xl font-bold text-white">{mintingFees.length}</div>
                  <div className="text-sm text-white/60">Total Fees</div>
                </div>
                <CreditCard className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{filteredFees.length}</div>
                  <div className="text-sm text-white/60">Filtered Results</div>
                </div>
                <Search className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-white">{formatLargeNumber(totalAmount)}</div>
                  <div className="text-sm text-white/60">Total Volume</div>
                </div>
                <ArrowUpRight className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {new Set(mintingFees.map((f) => f.token)).size}
                  </div>
                  <div className="text-sm text-white/60">Token Types</div>
                </div>
                <Database className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Minting Fees Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
            <span className="ml-4 text-white/60">Loading minting fees...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {currentFees.map((fee, index) => (
                <motion.div
                  key={fee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="bg-black/20 border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm hover:shadow-xl">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-white">Minting Fee</CardTitle>
                        <Badge className="bg-white/10 text-white border-white/20 px-3 py-1">
                          <CreditCard className="w-3 h-3 mr-1" />
                          <span className="font-mono text-sm">{formatTokenAmount(fee.amount || 0)}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Payer and Receiver Section */}
                      <div className="bg-white/5 p-3 rounded border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-white/60 mb-1 font-medium">PAYER</div>
                            <div className="flex items-center gap-2">
                              <div className="text-white font-mono text-xs">{shortenAddress(fee.payer, 8, 6)}</div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(fee.payer)}
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
                              <div className="text-white font-mono text-xs">{shortenAddress(fee.receiverIpId, 8, 6)}</div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(fee.receiverIpId)}
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
                          <label className="text-white/60 font-medium text-xs uppercase tracking-wide">Block</label>
                          <p className="text-white font-mono">{fee.blockNumber}</p>
                        </div>
                        <div>
                          <label className="text-white/60 font-medium text-xs uppercase tracking-wide">Token</label>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-mono text-xs">{shortenAddress(fee.token, 8, 6)}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(fee.token)}
                              className="h-6 w-6 p-0 text-white/40 hover:text-white hover:bg-white/10"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-white/60 font-medium text-xs uppercase tracking-wide">Timestamp</label>
                        <p className="text-white text-sm">{formatTimestamp(fee.blockTimestamp)}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-white/10">
                        <a 
                          href={`https://aeneid.storyscan.io/address/${fee.receiverIpId}`}
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
                          onClick={() => handleViewResponse(fee)}
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

            {/* Pagination */}
            {filteredFees.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-8">
                <div className="text-white/60 text-sm">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredFees.length)} of {filteredFees.length} entries
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
              </div>
            )}
          </>
        )}

        {!loading && currentFees.length === 0 && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <CreditCard className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white/60 mb-2">No Minting Fees Found</h3>
            <p className="text-white/40">
              {filteredFees.length === 0 ? "Try adjusting your search criteria" : "No entries on this page"}
            </p>
          </motion.div>
        )}

      {/* API Response Modal */}
      <ApiResponseModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        title={selectedFee ? `Minting Fee: ${Number(selectedFee.amount || 0).toFixed(6)}` : "Minting Fees API Response"}
        data={selectedFee || apiResponse}
      />
    </div>
  )
}
