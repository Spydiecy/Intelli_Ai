"use client"

import { useState, useEffect } from "react"
import { type IPAsset, api } from "@/lib/api"
import { Navigation } from "@/components/navigation"
import { ApiResponseModal } from "@/components/api-response-modal"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreateIPAssetModal } from "@/components/create-ip-asset-modal"
import { Search, Sparkles, Database, RefreshCw, Eye, Users, GitBranch, Shield, ExternalLink, Plus } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { shortenAddress } from "@/lib/utils"

export default function HomePage() {
  const [assets, setAssets] = useState<IPAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAsset, setSelectedAsset] = useState<IPAsset | null>(null)
  const [showApiModal, setShowApiModal] = useState(false)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.listIPAssets()
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
    (asset) =>
      asset.nftMetadata?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.ipId.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleViewResponse = (asset: IPAsset) => {
    setSelectedAsset(asset)
    setShowApiModal(true)
  }

  const handleCreateSuccess = () => {
    // Refresh the assets list after successful creation
    loadAssets()
  }

  return (
    <div className="min-h-screen bg-black">

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-12 h-12 text-blue-400 mr-4" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                IP Assets Explorer
              </h1>
            </div>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Discover and explore IP Assets on the Story Protocol blockchain. View detailed information, relationships,
              and licensing terms.
            </p>
            
            {/* Create IP Asset CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-8"
            >
              <Button
                onClick={() => setCreateModalOpen(true)}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New IP Asset
              </Button>
              <p className="text-sm text-gray-400 mt-2">
                Register your intellectual property on Story Protocol
              </p>
            </motion.div>
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
              placeholder="Search by name, ID, or IP ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create IP Asset
            </Button>
            <Button
              onClick={loadAssets}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
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
            className="mb-6 bg-gray-800 border border-purple-500/30 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center">
              <Sparkles className="w-5 h-5 text-purple-400 mr-2" />
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
            <Button onClick={loadAssets} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
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
          <Card className="gradient-card-purple">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{assets.length}</div>
                  <div className="text-sm text-purple-300">Total Assets</div>
                </div>
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card-blue">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{filteredAssets.length}</div>
                  <div className="text-sm text-blue-300">Filtered Results</div>
                </div>
                <Search className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card-green">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{assets.filter((a) => a.isGroup).length}</div>
                  <div className="text-sm text-green-300">Group Assets</div>
                </div>
                <Users className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card-orange">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {assets.reduce((sum, a) => sum + a.childrenCount, 0)}
                  </div>
                  <div className="text-sm text-orange-300">Total Children</div>
                </div>
                <GitBranch className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Assets Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
            <span className="ml-4 text-gray-400">Loading IP Assets...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="bg-gray-900 border border-gray-800 hover:border-purple-500/50 transition-all duration-300">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                          {asset.nftMetadata?.name || `IP Asset #${shortenAddress(asset.id, 8, 4)}`}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {asset.isGroup && (
                            <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                              <Users className="w-3 h-3 mr-1" />
                              Group
                            </Badge>
                          )}
                          <Badge className="bg-gray-800 text-gray-300 border-gray-700">
                            ID: {shortenAddress(asset.id, 6, 4)}
                          </Badge>
                        </div>
                      </div>
                      {asset.nftMetadata?.imageUrl && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-700">
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
                        <div className="flex items-center text-gray-400">
                          <GitBranch className="w-4 h-4 mr-2 text-green-400" />
                          <span>Parents: {asset.parentCount}</span>
                        </div>
                        <div className="flex items-center text-gray-400">
                          <Users className="w-4 h-4 mr-2 text-blue-400" />
                          <span>Children: {asset.childrenCount}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-400">
                          <Shield className="w-4 h-4 mr-2 text-purple-400" />
                          <span>Ancestors: {asset.ancestorCount}</span>
                        </div>
                        <div className="flex items-center text-gray-400">
                          <GitBranch className="w-4 h-4 mr-2 text-orange-400" />
                          <span>Descendants: {asset.descendantCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">IP ID:</p>
                      <p className="text-xs font-mono text-gray-400 bg-gray-800 p-1 rounded">
                        {shortenAddress(asset.ipId, 10, 6)}
                      </p>
                    </div>

                    <p className="text-xs text-gray-500 mb-3">
                      Block: {asset.blockNumber} •{" "}
                      {new Date(Number.parseInt(asset.blockTimestamp) * 1000).toLocaleDateString()}
                    </p>

                    <div className="flex gap-2">
                      <Link href={`/dashboard/${asset.id}`} className="flex-1">
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewResponse(asset)}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
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
                          className="text-xs text-green-400 hover:text-green-300 hover:bg-gray-800"
                        >
                          View Transactions
                        </Button>
                      </Link>
                      <Link href={`/dashboard/royalties?ipId=${asset.ipId}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-purple-400 hover:text-purple-300 hover:bg-gray-800"
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
        )}

        {!loading && filteredAssets.length === 0 && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No IP Assets Found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search criteria or create a new IP asset</p>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First IP Asset
            </Button>
          </motion.div>
        )}
      </div>

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
