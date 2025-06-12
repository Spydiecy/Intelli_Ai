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
import { ArrowLeft, Users, GitBranch, Shield, FileText, Database, Eye, Calendar, Hash, Copy } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { shortenAddress } from "@/lib/utils"

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
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-1/2 mb-6"></div>
          <div className="h-32 bg-white/10 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Error Loading Asset</h2>
          <p className="text-red-400">{error}</p>
          <Link href="/dashboard/ip-assets">
            <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to IP Assets
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Asset Not Found</h2>
          <Link href="/dashboard/ip-assets">
            <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to IP Assets
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center mb-6">
          <Link href="/dashboard/ip-assets">
            <Button variant="ghost" className="text-white/60 hover:text-white mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to IP Assets
            </Button>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 text-transparent bg-clip-text mb-4">
              {asset.nftMetadata?.name || `IP Asset #${shortenAddress(asset.id)}`}
            </h1>

            <div className="flex flex-wrap gap-3 mb-6">
              {asset.isGroup && (
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  <Users className="w-4 h-4 mr-2" />
                  Group Asset
                </Badge>
              )}
              <Badge className="bg-white/20 text-white/80 border-white/20">
                <Hash className="w-4 h-4 mr-2" />
                {shortenAddress(asset.id)}
              </Badge>
              <Badge className="bg-white/20 text-white/80 border-white/20">
                <Calendar className="w-4 h-4 mr-2" />
                Block {asset.blockNumber}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/50 border border-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{asset.parentCount}</div>
                <div className="text-sm text-white/60">Parents</div>
              </div>
              <div className="bg-black/50 border border-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{asset.childrenCount}</div>
                <div className="text-sm text-white/60">Children</div>
              </div>
              <div className="bg-black/50 border border-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{asset.ancestorCount}</div>
                <div className="text-sm text-white/60">Ancestors</div>
              </div>
              <div className="bg-black/50 border border-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{asset.descendantCount}</div>
                <div className="text-sm text-white/60">Descendants</div>
              </div>
            </div>
          </div>

          {asset.nftMetadata?.imageUrl && (
            <div className="lg:w-80">
              <div className="relative w-full h-80 rounded-xl overflow-hidden border border-white/20">
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
      </div>

      {/* Content */}
      <div>
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="bg-black/50 border border-white/20 backdrop-blur-sm">
            <TabsTrigger value="details" className="data-[state=active]:bg-white/20 text-white/80 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="license-terms" className="data-[state=active]:bg-white/20 text-white/80 data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" />
              License Terms ({licenseTerms.length})
            </TabsTrigger>
            <TabsTrigger value="relationships" className="data-[state=active]:bg-white/20 text-white/80 data-[state=active]:text-white">
              <GitBranch className="w-4 h-4 mr-2" />
              Relationships ({edges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card className="bg-black/50 border-white/20 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Asset Information</CardTitle>
                <Button
                  onClick={() => handleViewApiResponse(asset, "IP Asset Details")}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white/80 hover:bg-white/10"
                >
                  <Database className="w-4 h-4 mr-2" />
                  View Raw Data
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-white/60">IP ID</label>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-mono text-sm bg-black/30 p-2 rounded border border-white/20 flex-1 break-all">
                          {asset.ipId}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigator.clipboard.writeText(asset.ipId)}
                          className="text-white/60 hover:text-white"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/60">Token Contract</label>
                      <p className="text-white font-mono text-sm bg-black/30 p-2 rounded border border-white/20 break-all">
                        {asset.nftMetadata?.tokenContract || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/60">Token ID</label>
                      <p className="text-white font-mono text-sm bg-black/30 p-2 rounded border border-white/20">
                        {asset.nftMetadata?.tokenId || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-white/60">Transaction Hash</label>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-mono text-sm bg-black/30 p-2 rounded border border-white/20 flex-1 break-all">
                          {asset.transactionHash}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigator.clipboard.writeText(asset.transactionHash)}
                          className="text-white/60 hover:text-white"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/60">Block Timestamp</label>
                      <p className="text-white text-sm bg-black/30 p-2 rounded border border-white/20">
                        {new Date(Number.parseInt(asset.blockTimestamp) * 1000).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/60">Arbitration Policy</label>
                      <p className="text-white font-mono text-sm bg-black/30 p-2 rounded border border-white/20 break-all">
                        {asset.latestArbitrationPolicy || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {asset.rootIpIds && asset.rootIpIds.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-white/60 mb-2 block">Root IP IDs</label>
                    <div className="space-y-2">
                      {asset.rootIpIds.map((rootId, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-black/30 p-3 rounded border border-white/20"
                        >
                          <span className="text-white font-mono text-sm break-all flex-1">{rootId}</span>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigator.clipboard.writeText(rootId)}
                              className="text-white/60 hover:text-white"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Link href={`/dashboard/${rootId}`}>
                              <Button size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="license-terms">
            <div className="space-y-4">
              {licenseTerms.length > 0 ? (
                licenseTerms.map((term, index) => (
                  <Card key={term.id} className="bg-black/50 border-white/20 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-white">License Term #{index + 1}</CardTitle>
                      <div className="flex gap-2">
                        {term.disabled && (
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Disabled</Badge>
                        )}
                        <Button
                          onClick={() => handleViewApiResponse(term, `License Term #${index + 1}`)}
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white/80 hover:bg-white/10"
                        >
                          <Database className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-white/60">License Terms ID</label>
                          <p className="text-white font-mono text-sm bg-black/30 p-2 rounded border border-white/20">
                            {term.licenseTermsId}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-white/60">License Template</label>
                          <p className="text-white font-mono text-sm bg-black/30 p-2 rounded border border-white/20 break-all">
                            {term.licenseTemplate}
                          </p>
                        </div>
                      </div>

                      {term.licensingConfig && (
                        <div>
                          <label className="text-sm font-medium text-white/60 mb-2 block">
                            Licensing Configuration
                          </label>
                          <div className="bg-black/30 p-4 rounded border border-white/20 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-white/60">Commercial Rev Share:</span>
                              <span className="text-white">{term.licensingConfig.commercialRevShare}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Minting Fee:</span>
                              <span className="text-white">{term.licensingConfig.mintingFee || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Is Set:</span>
                              <span className="text-white">{term.licensingConfig.isSet ? "Yes" : "No"}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-black/50 border-white/20 backdrop-blur-sm">
                  <CardContent className="text-center py-12">
                    <Shield className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white/80 mb-2">No License Terms</h3>
                    <p className="text-white/60">This IP Asset has no associated license terms.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="relationships">
            <div className="space-y-4">
              {edges.length > 0 ? (
                edges.map((edge, index) => (
                  <Card key={`${edge.ipId}-${edge.parentIpId}-${index}`} className="bg-black/50 border-white/20 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-white">Relationship #{index + 1}</CardTitle>
                      <Button
                        onClick={() => handleViewApiResponse(edge, `Relationship #${index + 1}`)}
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white/80 hover:bg-white/10"
                      >
                        <Database className="w-4 h-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between bg-black/30 p-4 rounded border border-white/20">
                        <div className="flex-1">
                          <div className="text-sm text-white/60 mb-1">Parent IP</div>
                          <div className="text-white font-mono text-sm break-all">{edge.parentIpId}</div>
                        </div>
                        <div className="mx-4">
                          <GitBranch className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-white/60 mb-1">Child IP</div>
                          <div className="text-white font-mono text-sm break-all">{edge.ipId}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-white/60">License Token ID</label>
                          <p className="text-white font-mono text-sm bg-black/30 p-2 rounded border border-white/20">
                            {edge.licenseTokenId}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-white/60">License Terms ID</label>
                          <p className="text-white font-mono text-sm bg-black/30 p-2 rounded border border-white/20">
                            {edge.licenseTermsId}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/dashboard/${edge.parentIpId}`}>
                          <Button size="sm" className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30">
                            <Eye className="w-4 h-4 mr-2" />
                            View Parent
                          </Button>
                        </Link>
                        {edge.ipId !== asset.ipId && (
                          <Link href={`/dashboard/${edge.ipId}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/20 text-white/80 hover:bg-white/10"
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
                <Card className="bg-black/50 border-white/20 backdrop-blur-sm">
                  <CardContent className="text-center py-12">
                    <GitBranch className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white/80 mb-2">No Relationships</h3>
                    <p className="text-white/60">This IP Asset has no parent-child relationships.</p>
                  </CardContent>
                </Card>
              )}
            </div>
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
