"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ExternalLink, Copy, Users, Calendar, Hash, ImageIcon, Network } from "lucide-react"
import type { IPAsset } from "@/lib/api"

interface AssetModalProps {
  asset: IPAsset | null
  isOpen: boolean
  onClose: () => void
  similarAssets?: IPAsset[]
}

export function AssetModal({ asset, isOpen, onClose, similarAssets = [] }: AssetModalProps) {
  const [imageError, setImageError] = useState(false)

  if (!asset) return null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {asset.nftMetadata?.name || `Asset ${asset.id?.slice(0, 8)}`}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Image and Basic Info */}
          <div className="space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 mb-4">
                  {asset.nftMetadata?.imageUrl && !imageError ? (
                    <img
                      src={asset.nftMetadata.imageUrl || "/placeholder.svg"}
                      alt={asset.nftMetadata.name || "Asset"}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-white/40" />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Asset Type</span>
                    <Badge variant={asset.isGroup ? "default" : "secondary"}>
                      {asset.isGroup ? "Group Asset" : "Individual Asset"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Children</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{asset.childrenCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Descendants</span>
                    <span>{asset.descendantCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Block Number</span>
                    <div className="flex items-center gap-1">
                      <Hash className="h-4 w-4" />
                      <span className="font-mono">{asset.blockNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Created</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(asset.blockTimestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <div className="space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Asset Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm">IP Asset ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-white/10 px-2 py-1 rounded text-sm font-mono break-all">{asset.ipId}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(asset.ipId)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-sm">Transaction Hash</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-white/10 px-2 py-1 rounded text-sm font-mono break-all">
                      {asset.transactionHash}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(asset.transactionHash)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {asset.nftMetadata?.tokenContract && (
                  <div>
                    <label className="text-white/60 text-sm">Token Contract</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-white/10 px-2 py-1 rounded text-sm font-mono break-all">
                        {asset.nftMetadata.tokenContract}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(asset.nftMetadata.tokenContract)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {asset.nftMetadata?.tokenId && (
                  <div>
                    <label className="text-white/60 text-sm">Token ID</label>
                    <div className="mt-1">
                      <code className="bg-white/10 px-2 py-1 rounded text-sm font-mono">
                        {asset.nftMetadata.tokenId}
                      </code>
                    </div>
                  </div>
                )}

                {asset.nftMetadata?.tokenUri && (
                  <div>
                    <label className="text-white/60 text-sm">Metadata URI</label>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={asset.nftMetadata.tokenUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm break-all"
                      >
                        {asset.nftMetadata.tokenUri}
                      </a>
                      <ExternalLink className="h-4 w-4 text-white/60" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Root Assets */}
            {asset.rootIpIds && asset.rootIpIds.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Root Assets ({asset.rootCount})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {asset.rootIpIds.slice(0, 3).map((rootId, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <code className="bg-white/10 px-2 py-1 rounded text-xs font-mono break-all flex-1">
                          {rootId}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(rootId)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {asset.rootIpIds.length > 3 && (
                      <p className="text-white/60 text-sm">+{asset.rootIpIds.length - 3} more root assets</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Similar Assets */}
        {similarAssets.length > 0 && (
          <Card className="bg-white/5 border-white/10 mt-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Similar Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {similarAssets.slice(0, 6).map((similarAsset, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {similarAsset.nftMetadata?.name || `Asset ${similarAsset.id?.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-white/60 truncate">
                          {similarAsset.ipId?.slice(0, 10)}...{similarAsset.ipId?.slice(-8)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} className="border-white/20 text-white">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
