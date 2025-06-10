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
import { Search, DollarSign, RefreshCw, ExternalLink, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { shortenAddress, formatTimestamp, formatAmount } from "@/lib/utils"
import type { GeminiFilterResponse } from "@/lib/gemini-agent"

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

  useEffect(() => {
    loadRoyalties()

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

  const handleApplyAIFilter = (filter: GeminiFilterResponse) => {
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

  const handleViewResponse = (royalty: RoyaltyPay) => {
    setSelectedRoyalty(royalty)
    setShowApiModal(true)
  }

  const totalAmount = royalties.reduce((sum, r) => sum + Number.parseFloat(r.amount || "0"), 0)

  return (
    <div className="min-h-screen bg-black">

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-black to-purple-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <DollarSign className="w-12 h-12 text-purple-400 mr-4" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                Royalties Explorer
              </h1>
            </div>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Track royalty payments across the Story Protocol ecosystem. View payment flows between IP assets and
              analyze revenue streams.
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
              placeholder="Search by payer IP, receiver IP, sender, or token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadRoyalties}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => window.open("https://example.com", "_blank")}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              External Link
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Royalties List */}
      <div className="container mx-auto px-4">
        {loading ? (
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoyalties.map((royalty) => (
              <Card key={royalty.id} className="bg-gray-800 text-white">
                <CardHeader>
                  <CardTitle>
                    {shortenAddress(royalty.payerIpId)} → {shortenAddress(royalty.receiverIpId)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <span>Sender:</span>
                    <span>{shortenAddress(royalty.sender)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span>Token:</span>
                    <span>{royalty.token.substring(0,4)}..{royalty.token.substring(39)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span>Amount:</span>
                    <span>{royalty.amount}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span>Timestamp:</span>
                    <span>{formatTimestamp(royalty.timestamp)}</span>
                  </div>
                  <Button
                    onClick={() => handleViewResponse(royalty)}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    View Response
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* API Response Modal */}
      {selectedRoyalty && (
        <ApiResponseModal
          isOpen={showApiModal}
          onClose={() => setShowApiModal(false)}
          response={apiResponse}
          royalty={selectedRoyalty}
        />
      )}

      {/* Total Amount */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center items-center"
        >
          <Badge className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
            Total Amount: {formatAmount(totalAmount)}
          </Badge>
        </motion.div>
      </div>
    </div>
  )
}
