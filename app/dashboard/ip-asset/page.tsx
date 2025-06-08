"use client"

import { useState, useEffect } from "react"
import { type IPAsset, api } from "@/lib/api"
import { IPAssetCard } from "@/components/ip-asset-card"
import { ApiResponseModal } from "@/components/api-response-modal"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Sparkles, Database, RefreshCw } from 'lucide-react'
import { motion } from "framer-motion"

export default function HomePage() {
  const [assets, setAssets] = useState<IPAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAsset, setSelectedAsset] = useState<IPAsset | null>(null)
  const [showApiModal, setShowApiModal] = useState(false)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Loading assets...")
      
      const response = await api.listIPAssets()
      console.log("API Response:", response)
      
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

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black border-b border-gray-800">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-12 h-12 text-purple-400 mr-4" />
              <h1 className="text-5xl font-bold text-white">
                Story Protocol Explorer
              </h1>
            </div>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Discover and explore IP Assets on the Story Protocol blockchain. View detailed information, relationships,
              and licensing terms.
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
              placeholder="Search by name, ID, or IP ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadAssets}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowApiModal(true)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <Database className="w-4 h-4 mr-2" />
              View API Response
            </Button>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-8"
          >
            <h3 className="text-red-400 font-semibold mb-2">API Error</h3>
            <p className="text-red-300">{error}</p>
            <Button onClick={loadAssets} className="mt-4 bg-red-600 hover:bg-red-700">
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
          <div className="bg-gray-900 border border-purple-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-300">{assets.length}</div>
            <div className="text-sm text-gray-400">Total Assets</div>
          </div>
          <div className="bg-gray-900 border border-blue-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-300">{filteredAssets.length}</div>
            <div className="text-sm text-gray-400">Filtered Results</div>
          </div>
          <div className="bg-gray-900 border border-green-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-300">{assets.filter((a) => a.isGroup).length}</div>
            <div className="text-sm text-gray-400">Group Assets</div>
          </div>
          <div className="bg-gray-900 border border-orange-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-300">
              {assets.reduce((sum, a) => sum + a.childrenCount, 0)}
            </div>
            <div className="text-sm text-gray-400">Total Children</div>
          </div>
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
              <IPAssetCard
                key={asset.id}
                asset={asset}
                index={index}
                onViewResponse={() => handleViewResponse(asset)}
              />
            ))}
          </div>
        )}

        {!loading && filteredAssets.length === 0 && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Assets Found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
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
    </div>
  )
}
