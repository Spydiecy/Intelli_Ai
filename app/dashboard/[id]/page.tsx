"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { type IPAsset, type IPLicenseTerm, type IPAssetEdge, api } from "@/lib/api"
import { ApiResponseModal } from "@/components/api-response-modal"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Users, GitBranch, Shield, FileText, Database, Eye, Calendar, Hash } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

export default function IPAssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [asset, setAsset] = useState<IPAsset | null>(null)
  const [licenseTerms, setLicenseTerms] = useState<IPLicenseTerm[]>([])
  const [edges, setEdges] = useState<IPAssetEdge[]>([])
  const [loading, setLoading] = useState(true)
  const [showApiModal, setShowApiModal] = useState(false)
  const [apiModalData, setApiModalData] = useState<any>(null)
  const [apiModalTitle, setApiModalTitle] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      loadAssetDetails(params.id as string)
    }
  }, [params.id])

  const loadAssetDetails = async (assetId: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log("Loading asset details for:", assetId)

      // Load asset details
      const assetResponse = await api.getIPAsset(assetId)
      console.log("Asset response:", assetResponse)
      
      if (assetResponse.error) {
        setError(assetResponse.error)
        return
      }
      
      setAsset(assetResponse.data)

      // Load license terms
      if (assetResponse.data?.ipId) {
        try {
          console.log("Loading license terms for IP ID:", assetResponse.data.ipId)
          const licenseResponse = await api.getIPLicenseTerms(assetResponse.data.ipId)
          console.log("License response:", licenseResponse)
          setLicenseTerms(licenseResponse.data || [])
        } catch (error) {
          console.error("Failed to load license terms:", error)
        }
      }

      // Load edges
      try {
        console.log("Loading edges for IP ID:", assetResponse.data?.ipId)
        const edgesResponse = await api.listIPEdges({
          where: { ipId: assetResponse.data?.ipId },
        })
        console.log("Edges response:", edgesResponse)
        
        // Handle both array and object response formats
        const edgesData = Array.isArray(edgesResponse) ? edgesResponse[0]?.data : edgesResponse.data
        setEdges(edgesData || [])
      } catch (error) {
        console.error("Failed to load edges:", error)
      }
    } catch (error) {
      console.error("Failed to load asset details:", error)
      setError("Failed to load asset details")
    } finally {
      setLoading(false)
    }
  }

  const handleViewApiResponse = (data: any, title: string) => {
    setApiModalData(data)
    setApiModalTitle(title)
    setShowApiModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <span className="ml-4 text-gray-400">Loading IP Asset Details...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Asset</h2>
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => router.push("/")} className="bg-purple-600 hover:bg-purple-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Explorer
          </Button>
        </div>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Asset Not Found</h2>
          <Button onClick={() => router.push("/")} className="bg-purple-600 hover:bg-purple-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Explorer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black border-b border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center mb-6">
              <Button onClick={() => router.push("/")} variant="ghost" className="text-gray-400 hover:text-white mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Explorer
              </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-4">
                  {asset.nftMetadata?.name || `IP Asset #${asset.id}`}
                </h1>

                <div className="flex flex-wrap gap-3 mb-6">
                  {asset.isGroup && (
                    <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                      <Users className="w-4 h-4 mr-2" />
                      Group Asset
                    </Badge>
                  )}
                  <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">
                    <Hash className="w-4 h-4 mr-2" />
                    {asset.id}
                  </Badge>
                  <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
                    <Calendar className="w-4 h-4 mr-2" />
                    Block {asset.blockNumber}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-900 border border-purple-500/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-300">{asset.parentCount}</div>
                    <div className="text-sm text-gray-400">Parents</div>
                  </div>
                  <div className="bg-gray-900 border border-blue-500/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-300">{asset.childrenCount}</div>
                    <div className="text-sm text-gray-400">Children</div>
                  </div>
                  <div className="bg-gray-900 border border-green-500/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-300">{asset.ancestorCount}</div>
                    <div className="text-sm text-gray-400">Ancestors</div>
                  </div>
                  <div className="bg-gray-900 border border-orange-500/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-300">{asset.descendantCount}</div>
                    <div className="text-sm text-gray-400">Descendants</div>
                  </div>
                </div>
              </div>

              {asset.nftMetadata?.imageUrl && (
                <div className="lg:w-80">
                  <div className="relative w-full h-80 rounded-xl overflow-hidden border border-gray-600">
                    <Image
                      src={asset.nftMetadata.imageUrl || "/placeholder.svg"}
                      alt={asset.nftMetadata.name || "IP Asset"}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=320&width=320"
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="details" className="data-[state=active]:bg-purple-600">
              <FileText className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="license-terms" className="data-[state=active]:bg-blue-600">
              <Shield className="w-4 h-4 mr-2" />
              License Terms ({licenseTerms.length})
            </TabsTrigger>
            <TabsTrigger value="relationships" className="data-[state=active]:bg-green-600">
              <GitBranch className="w-4 h-4 mr-2" />
              Relationships ({edges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">Asset Information</CardTitle>
                  <Button
                    onClick={() => handleViewApiResponse(asset, "IP Asset Details")}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    View Raw Data
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-400">IP ID</label>
                        <p className="text-white font-mono text-sm bg-gray-800 p-2 rounded border border-gray-600">
                          {asset.ipId}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-400">Token Contract</label>
                        <p className="text-white font-mono text-sm bg-gray-800 p-2 rounded border border-gray-600">
                          {asset.nftMetadata?.tokenContract || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-400">Token ID</label>
                        <p className="text-white font-mono text-sm bg-gray-800 p-2 rounded border border-gray-600">
                          {asset.nftMetadata?.tokenId || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-400">Transaction Hash</label>
                        <p className="text-white font-mono text-sm bg-gray-800 p-2 rounded border border-gray-600 break-all">
                          {asset.transactionHash}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-400">Block Timestamp</label>
                        <p className="text-white text-sm bg-gray-800 p-2 rounded border border-gray-600">
                          {new Date(Number.parseInt(asset.blockTimestamp) * 1000).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-400">Arbitration Policy</label>
                        <p className="text-white font-mono text-sm bg-gray-800 p-2 rounded border border-gray-600 break-all">
                          {asset.latestArbitrationPolicy || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {asset.rootIpIds && asset.rootIpIds.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">Root IP IDs</label>
                      <div className="space-y-2">
                        {asset.rootIpIds.map((rootId, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-800 p-3 rounded border border-gray-600"
                          >
                            <span className="text-white font-mono text-sm">{rootId}</span>
                            <Link href={`/dashboard/${rootId}`}>
                              <Button size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="license-terms">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              {licenseTerms.length > 0 ? (
                licenseTerms.map((term, index) => (
                  <Card key={term.id} className="bg-gray-900 border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-white">License Term #{index + 1}</CardTitle>
                      <div className="flex gap-2">
                        {term.disabled && <Badge variant="destructive">Disabled</Badge>}
                        <Button
                          onClick={() => handleViewApiResponse(term, `License Term #${index + 1}`)}
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-gray-300 hover:bg-gray-800"
                        >
                          <Database className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-400">License Terms ID</label>
                          <p className="text-white font-mono text-sm bg-gray-800 p-2 rounded border border-gray-600">
                            {term.licenseTermsId}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-400">License Template</label>
                          <p className="text-white font-mono text-sm bg-gray-800 p-2 rounded border border-gray-600">
                            {term.licenseTemplate}
                          </p>
                        </div>
                      </div>

                      {term.licensingConfig && (
                        <div>
                          <label className="text-sm font-medium text-gray-400 mb-2 block">
                            Licensing Configuration
                          </label>
                          <div className="bg-gray-800 p-4 rounded border border-gray-600 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Commercial Rev Share:</span>
                              <span className="text-white">{term.licensingConfig.commercialRevShare}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Minting Fee:</span>
                              <span className="text-white">{term.licensingConfig.mintingFee || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Is Set:</span>
                              <span className="text-white">{term.licensingConfig.isSet ? "Yes" : "No"}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="text-center py-12">
                    <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No License Terms</h3>
                    <p className="text-gray-500">This IP Asset has no associated license terms.</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="relationships">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              {edges.length > 0 ? (
                edges.map((edge, index) => (
                  <Card key={`${edge.ipId}-${edge.parentIpId}-${index}`} className="bg-gray-900 border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-white">Relationship #{index + 1}</CardTitle>
                      <Button
                        onClick={() => handleViewApiResponse(edge, `Relationship #${index + 1}`)}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        <Database className="w-4 h-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between bg-gray-800 p-4 rounded border border-gray-600">
                        <div className="flex-1">
                          <div className="text-sm text-gray-400 mb-1">Parent IP</div>
                          <div className="text-white font-mono text-sm">{edge.parentIpId}</div>
                        </div>
                        <div className="mx-4">
                          <GitBranch className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-400 mb-1">Child IP</div>
                          <div className="text-white font-mono text-sm">{edge.ipId}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-400">License Token ID</label>
                          <p className="text-white font-mono text-sm bg-gray-800 p-2 rounded border border-gray-600">
                            {edge.licenseTokenId}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-400">License Terms ID</label>
                          <p className="text-white font-mono text-sm bg-gray-800 p-2 rounded border border-gray-600">
                            {edge.licenseTermsId}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/dashboard/${edge.parentIpId}`}>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                            <Eye className="w-4 h-4 mr-2" />
                            View Parent
                          </Button>
                        </Link>
                        {edge.ipId !== asset.ipId && (
                          <Link href={`/dashboard/${edge.ipId}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-800"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Child
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="text-center py-12">
                    <GitBranch className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No Relationships</h3>
                    <p className="text-gray-500">This IP Asset has no parent-child relationships.</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* API Response Modal */}
      <ApiResponseModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        title={apiModalTitle}
        data={apiModalData}
      />
    </div>
  )
}
