"use client"

import { useState, useEffect } from "react"
import { type IPAsset, api } from "@/lib/api"
import { ApiResponseModal } from "@/components/api-response-modal"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateIPAssetModal } from "@/components/create-ip-asset-modal"
import { useWallet } from "@/contexts/WalletContext"
import { Search, Sparkles, Database, RefreshCw, Eye, Users, GitBranch, Shield, ExternalLink, Plus, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { shortenAddress } from "@/lib/utils"

export default function IPAssetsPage() {
  const [assets, setAssets] = useState<IPAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAsset, setSelectedAsset] = useState<IPAsset | null>(null)
  const [showApiModal, setShowApiModal] = useState(false)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterType, setFilterType] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("recent")
  const itemsPerPage = 6

  // Get wallet context
  const { connected, openConnectModal } = useWallet()

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.listIPAssetsAll()
      if (response.error) {
        setError(response.error)
        setAssets([])
      } else {
        setAssets(response.data || [])
      }
      setApiResponse(response)
    } catch (error) {
      console.error("Failed to load assets:", error)
      setError("Failed to load assets")
      setAssets([])
    } finally {
      setLoading(false)
    }
  }

  const handleApplyAIFilter = (filter:any) => {
    if (filter.dataType !== "ip_assets") {
      // Navigate to the appropriate page
      window.location.href = `/${filter.dataType.replace("_", "-")}?aiFilter=${encodeURIComponent(JSON.stringify(filter))}`
      return
    }

    // Apply filters to IP assets
    setSearchTerm(filter.filters.searchTerm || "")
    setActiveFilter(filter.explanation)
  }

  const filteredAssets = assets.filter(
    (asset) => {
      const matchesSearch = asset.nftMetadata?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.ipId.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = filterType === "all" || 
        (filterType === "group" && asset.isGroup) ||
        (filterType === "individual" && !asset.isGroup) ||
        (filterType === "hasChildren" && asset.childrenCount > 0) ||
        (filterType === "hasParents" && asset.parentCount > 0)
      
      return matchesSearch && matchesFilter
    }
  )

  // Sort filtered assets
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return Number(b.blockTimestamp) - Number(a.blockTimestamp)
      case "oldest":
        return Number(a.blockTimestamp) - Number(b.blockTimestamp)
      case "name":
        const aName = a.nftMetadata?.name || a.id
        const bName = b.nftMetadata?.name || b.id
        return aName.localeCompare(bName)
      case "children":
        return b.childrenCount - a.childrenCount
      default:
        return 0
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedAssets.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAssets = sortedAssets.slice(startIndex, startIndex + itemsPerPage)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterType, sortBy])

  const handleViewResponse = (asset: IPAsset) => {
    setSelectedAsset(asset)
    setShowApiModal(true)
  }

  const handleCreateSuccess = () => {
    // Refresh the assets list after successful creation
    loadAssets()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 text-transparent bg-clip-text mb-2">
              IP Assets Explorer
            </h1>
            <p className="text-white/60">
              Discover and explore IP Assets on the Story Protocol blockchain. View detailed information, relationships,
              and licensing terms.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => {
                if (connected) {
                  setCreateModalOpen(true)
                } else {
                  openConnectModal()
                }
              }}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              {connected ? "Create IP Asset" : "Connect Wallet to Create"}
            </Button>
            <Button
              onClick={loadAssets}
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
        className="flex flex-col gap-4 mb-8"
      >
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5 z-10 pointer-events-none" />
          <Input
            placeholder="Search by name, ID, or IP ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black/50 border-white/20 text-white placeholder:text-white/40 backdrop-blur-sm hover:border-white/30 transition-colors"
          />
        </div>
        
        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">Filters:</span>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px] bg-black/50 border-white/20 text-white hover:border-white/30">
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/20 backdrop-blur-sm">
                <SelectItem value="all" className="text-white hover:bg-white/10">All Assets</SelectItem>
                <SelectItem value="group" className="text-white hover:bg-white/10">Group Assets</SelectItem>
                <SelectItem value="individual" className="text-white hover:bg-white/10">Individual</SelectItem>
                <SelectItem value="hasChildren" className="text-white hover:bg-white/10">Has Children</SelectItem>
                <SelectItem value="hasParents" className="text-white hover:bg-white/10">Has Parents</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] bg-black/50 border-white/20 text-white hover:border-white/30">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/20 backdrop-blur-sm">
                <SelectItem value="recent" className="text-white hover:bg-white/10">Most Recent</SelectItem>
                <SelectItem value="oldest" className="text-white hover:bg-white/10">Oldest First</SelectItem>
                <SelectItem value="name" className="text-white hover:bg-white/10">Name A-Z</SelectItem>
                <SelectItem value="children" className="text-white hover:bg-white/10">Most Children</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => setShowApiModal(true)}
              variant="outline"
              className="border-white/20 hover:bg-white/10 text-white gap-2"
            >
              <Database className="w-4 h-4" />
              View API Response
            </Button>
          </div>
        </div>
      </motion.div>

        {/* Active Filter */}
        {activeFilter && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-black/30 border border-white/10 rounded-lg p-4 flex items-center justify-between backdrop-blur-sm"
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
            className="bg-black/30 border border-white/20 rounded-lg p-4 mb-8 backdrop-blur-sm"
          >
            <h3 className="text-white font-semibold mb-2">Error</h3>
            <p className="text-white/70">{error}</p>
            <Button onClick={loadAssets} className="mt-4 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm">
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
          <Card className="bg-black/50 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{assets.length}</div>
                  <div className="text-sm text-white/60">Total Assets</div>
                </div>
                <Shield className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{sortedAssets.length}</div>
                  <div className="text-sm text-white/60">Filtered Results</div>
                </div>
                <Search className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{assets.filter((a) => a.isGroup).length}</div>
                  <div className="text-sm text-white/60">Group Assets</div>
                </div>
                <Users className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-white/20 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {assets.reduce((sum, a) => sum + a.childrenCount, 0)}
                  </div>
                  <div className="text-sm text-white/60">Total Children</div>
                </div>
                <GitBranch className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Assets Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
            <span className="ml-4 text-white/60">Loading IP Assets...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedAssets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="bg-black/50 border border-white/20 hover:border-white/40 transition-all duration-300 backdrop-blur-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-white/80 transition-colors">
                            {asset.nftMetadata?.name || `IP Asset #${shortenAddress(asset.id, 8, 4)}`}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {asset.isGroup && (
                              <Badge className="bg-black/30 text-white/80 border-white/20">
                                <Users className="w-3 h-3 mr-1" />
                                Group
                              </Badge>
                            )}
                            <Badge className="bg-black/50 text-white/80 border-white/20">
                              ID: {shortenAddress(asset.id, 6, 4)}
                            </Badge>
                          </div>
                        </div>
                        {asset.nftMetadata?.imageUrl && (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20">
                            <Image
                              src={asset.nftMetadata.imageUrl || "https://cdn-icons-png.flaticon.com/512/11542/11542598.png"}
                              alt={asset.nftMetadata.name || "IP Asset"}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "https://cdn-icons-png.flaticon.com/512/11542/11542598.png"
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-white/60">
                            <GitBranch className="w-4 h-4 mr-2 text-white/60" />
                            <span>Parents: {asset.parentCount}</span>
                          </div>
                          <div className="flex items-center text-white/60">
                            <Users className="w-4 h-4 mr-2 text-white/60" />
                            <span>Children: {asset.childrenCount}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center text-white/60">
                            <Shield className="w-4 h-4 mr-2 text-white/60" />
                            <span>Ancestors: {asset.ancestorCount}</span>
                          </div>
                          <div className="flex items-center text-white/60">
                            <GitBranch className="w-4 h-4 mr-2 text-white/60" />
                            <span>Descendants: {asset.descendantCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-xs text-white/50 mb-1">IP ID:</p>
                        <p className="text-xs font-mono text-white/70 bg-black/50 p-1 rounded border border-white/20">
                          {shortenAddress(asset.ipId, 10, 6)}
                        </p>
                      </div>

                      <p className="text-xs text-white/50 mb-3">
                        Block: {asset.blockNumber} •{" "}
                        {new Date(Number.parseInt(asset.blockTimestamp) * 1000).toLocaleDateString()}
                      </p>

                      <div className="flex gap-2">
                        <Link href={`/dashboard/${asset.id}`} className="flex-1">
                          <Button className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewResponse(asset)}
                          className="border-white/20 text-white/80 hover:bg-white/10 backdrop-blur-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Quick Navigation Links */}
                      <div className="flex gap-1 mt-2">
                        <Link href={`/dashboard/transactions?ipId=${asset.ipId}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-white/60 hover:text-white/80 hover:bg-white/10"
                          >
                            View Transactions
                          </Button>
                        </Link>
                        <Link href={`/dashboard/royalties?ipId=${asset.ipId}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-white/60 hover:text-white/80 hover:bg-white/10"
                          >
                            View Royalties
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mt-8 pt-6 border-t border-white/10"
              >
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <span>
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedAssets.length)} of {sortedAssets.length} results
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-white/20 text-white/80 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const isCurrentPage = page === currentPage
                      const showPage = page === 1 || page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      
                      if (!showPage) {
                        if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="text-white/40 px-2">...</span>
                        }
                        return null
                      }
                      
                      return (
                        <Button
                          key={page}
                          variant={isCurrentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={
                            isCurrentPage
                              ? "bg-white/20 text-white border-white/20"
                              : "border-white/20 text-white/80 hover:bg-white/10"
                          }
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-white/20 text-white/80 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}
          </>
        )}

        {!loading && sortedAssets.length === 0 && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Shield className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white/80 mb-2">No IP Assets Found</h3>
            <p className="text-white/60 mb-6">Try adjusting your search criteria or create a new IP asset</p>
            <Button
              onClick={() => {
                if (connected) {
                  setCreateModalOpen(true)
                } else {
                  openConnectModal()
                }
              }}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              {connected ? "Create Your First IP Asset" : "Connect Wallet to Create Asset"}
            </Button>
          </motion.div>
        )}

      {/* API Response Modal */}
      <ApiResponseModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        title={selectedAsset ? `IP Asset: ${selectedAsset.nftMetadata?.name || selectedAsset.id}` : "API Response"}
        data={selectedAsset || apiResponse}
      />

      {/* Create IP Asset Modal */}
      <CreateIPAssetModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
