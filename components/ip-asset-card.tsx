"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { IPAsset } from "@/lib/api"
import { Eye, Users, GitBranch, Shield, ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

interface IPAssetCardProps {
  asset: IPAsset
  index: number
  onViewResponse: () => void
}

export function IPAssetCard({ asset, index, onViewResponse }: IPAssetCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="group"
    >
      <Card className="bg-gray-900 border-gray-700 hover:border-purple-500/50 transition-all duration-300 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                {asset.nftMetadata?.name || `IP Asset #${asset.nftMetadata?.tokenId || asset.id}`}
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {asset.isGroup && (
                  <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                    <Users className="w-3 h-3 mr-1" />
                    Group
                  </Badge>
                )}
                <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">ID: {asset.id.slice(0, 8)}...</Badge>
              </div>
            </div>
            {asset.nftMetadata?.imageUrl && (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-600">
                <Image
                  src={asset.nftMetadata.imageUrl || "/placeholder.svg"}
                  alt={asset.nftMetadata.name || "IP Asset"}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=64&width=64"
                  }}
                />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
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

          <div className="pt-2 border-t border-gray-700">
            <p className="text-xs text-gray-500 mb-3">
              Block: {asset.blockNumber} • {new Date(Number.parseInt(asset.blockTimestamp) * 1000).toLocaleDateString()}
            </p>

            <div className="flex gap-2">
              <Link href={`/dashboard/${asset.id}`} className="flex-1">
                <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={onViewResponse}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
