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
import { Search, CreditCard, Database, RefreshCw, ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react"
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

  const totalAmount = mintingFees.reduce((sum, f) => sum + Number.parseFloat(f.amount || "0"), 0)

  return (
    <div className="min-h-screen  text-white bg-black"> 

      {/* Header */}
      <div className="bg-gradient-to-r from-pink-900 via-pink-800 to-pink-900 text-black bg-black">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <CreditCard className="w-12 h-12 text-pink-400 mr-4" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-400 via-rose-400 to-red-400 bg-clip-text text-transparent">
                Minting Fees Explorer
              </h1>
            </div>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Track license minting fee payments across the Story Protocol ecosystem. Monitor fee flows and analyze
              minting costs.
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
          <div className="relative flex-1 bg-black">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by receiver IP, payer, or token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-pink-500 shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadMintingFees}
              disabled={loading}
              className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowApiModal(true)}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
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
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8"
          >
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
            <Button onClick={loadMintingFees} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
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
          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-pink-700">{mintingFees.length}</div>
                  <div className="text-sm text-pink-600">Total Fees</div>
                </div>
                <CreditCard className="w-8 h-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-rose-700">{filteredFees.length}</div>
                  <div className="text-sm text-rose-600">Filtered Results</div>
                </div>
                <Search className="w-8 h-8 text-rose-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-green-700">{formatAmount(totalAmount.toString())}</div>
                  <div className="text-sm text-green-600">Total Volume</div>
                </div>
                <ArrowUpRight className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-700">
                    {new Set(mintingFees.map((f) => f.token)).size}
                  </div>
                  <div className="text-sm text-blue-600">Token Types</div>
                </div>
                <Database className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Minting Fees Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
            <span className="ml-4 text-gray-600">Loading minting fees...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredFees.map((fee, index) => (
              <motion.div
                key={fee.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-white border-gray-200 hover:border-pink-300 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-gray-900">Minting Fee</CardTitle>
                      <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                        <CreditCard className="w-3 h-3 mr-1" />
                        {formatAmount(fee.amount)} {fee.token}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded border">
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-1">Payer</div>
                        <div className="text-gray-900 font-mono text-xs">{shortenAddress(fee.payer, 12, 8)}</div>
                      </div>
                      <div className="mx-4">
                        <ArrowDownRight className="w-6 h-6 text-pink-500" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-1">Receiver IP</div>
                        <div className="text-gray-900 font-mono text-xs">{shortenAddress(fee.receiverIpId, 12, 8)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-gray-500 font-medium">Block</label>
                          <p className="text-gray-900">{fee.blockNumber}</p>
                        </div>
                        <div>
                          <label className="text-gray-500 font-medium">Token</label>
                          <p className="text-gray-900">{fee.token}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-gray-500 font-medium">Timestamp</label>
                        <p className="text-gray-900">{formatTimestamp(fee.blockTimestamp)}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                      <Link href={`/?search=${fee.receiverIpId}`}>
                        <Button size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                          <ArrowUpRight className="w-4 h-4 mr-1" />
                          View Receiver
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewResponse(fee)}
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
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

        {!loading && filteredFees.length === 0 && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Minting Fees Found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </motion.div>
        )}
      </div>

      {/* API Response Modal */}
      <ApiResponseModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        title={selectedFee ? `Minting Fee: ${formatAmount(selectedFee.amount)}` : "Minting Fees API Response"}
        data={selectedFee || apiResponse}
      />
    </div>
  )
}
