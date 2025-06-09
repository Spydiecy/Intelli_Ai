"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ExternalLink, Copy, ArrowRight, Clock, Shield, RefreshCw } from "lucide-react"
import type { SwapData, OrderStatus } from "@/lib/debridge-api"
import { debridgeApi } from "@/lib/debridge-api"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

interface SwapSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  swapData: SwapData | null
}

export function SwapSuccessModal({ isOpen, onClose, swapData }: SwapSuccessModalProps) {
  const [copied, setCopied] = useState(false)
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (swapData?.orderId && isOpen) {
      loadOrderStatus()
      // Poll for status updates every 10 seconds
      const interval = setInterval(loadOrderStatus, 10000)
      return () => clearInterval(interval)
    }
  }, [swapData?.orderId, isOpen])

  const loadOrderStatus = async () => {
    if (!swapData?.orderId) return

    try {
      setLoading(true)
      const status = await debridgeApi.getOrderStatus(swapData.orderId)
      setOrderStatus(status)
    } catch (error) {
      console.error("Failed to load order status:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!swapData) return null

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(swapData.orderId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Fulfilled":
      case "ClaimedUnlock":
        return "bg-green-600/20 text-green-300 border-green-500/30"
      case "Created":
      case "SentUnlock":
        return "bg-yellow-600/20 text-yellow-300 border-yellow-500/30"
      case "OrderCancelled":
      case "SentOrderCancel":
      case "ClaimedOrderCancel":
        return "bg-red-600/20 text-red-300 border-red-500/30"
      default:
        return "bg-blue-600/20 text-blue-300 border-blue-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Fulfilled":
      case "ClaimedUnlock":
        return <CheckCircle className="w-3 h-3 mr-1" />
      case "Created":
      case "SentUnlock":
        return <Clock className="w-3 h-3 mr-1" />
      default:
        return <Clock className="w-3 h-3 mr-1" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            Cross-Chain Swap Initiated!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="flex justify-center"
          >
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
          </motion.div>

          {/* Swap Details */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Token Swap Visual */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                      {swapData.fromToken.logoURI ? (
                        <img
                          src={swapData.fromToken.logoURI || "/placeholder.svg"}
                          alt={swapData.fromToken.symbol}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = "none"
                            target.nextElementSibling?.classList.remove("hidden")
                          }}
                        />
                      ) : null}
                      <span className={`text-sm font-bold text-gray-400 ${swapData.fromToken.logoURI ? "hidden" : ""}`}>
                        {swapData.fromToken.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-lg">
                        {debridgeApi.formatAmount(swapData.fromAmount, swapData.fromToken.decimals)}{" "}
                        {swapData.fromToken.symbol}
                      </div>
                      <div className="text-gray-400 text-sm">{swapData.fromChain.chainName}</div>
                    </div>
                  </div>

                  <ArrowRight className="w-6 h-6 text-purple-400" />

                  <div className="flex items-center space-x-3">
                    <div className="relative w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                      {swapData.toToken.logoURI ? (
                        <img
                          src={swapData.toToken.logoURI || "/placeholder.svg"}
                          alt={swapData.toToken.symbol}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = "none"
                            target.nextElementSibling?.classList.remove("hidden")
                          }}
                        />
                      ) : null}
                      <span className={`text-sm font-bold text-gray-400 ${swapData.toToken.logoURI ? "hidden" : ""}`}>
                        {swapData.toToken.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-lg">
                        {debridgeApi.formatAmount(swapData.toAmount, swapData.toToken.decimals)}{" "}
                        {swapData.toToken.symbol}
                      </div>
                      <div className="text-gray-400 text-sm">{swapData.toChain.chainName}</div>
                    </div>
                  </div>
                </div>

                {/* Swap Rate */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Exchange Rate</span>
                    <span className="text-white font-mono">
                      1 {swapData.fromToken.symbol} = {swapData.rate} {swapData.toToken.symbol}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Order Status</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadOrderStatus}
                  disabled={loading}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Order ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-sm">
                      {swapData.orderId.slice(0, 8)}...{swapData.orderId.slice(-6)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyOrderId}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Current Status</span>
                  {orderStatus ? (
                    <Badge className={getStatusColor(orderStatus.status)}>
                      {getStatusIcon(orderStatus.status)}
                      {orderStatus.status}
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-600/20 text-gray-300 border-gray-500/30">
                      <Clock className="w-3 h-3 mr-1" />
                      Loading...
                    </Badge>
                  )}
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Timestamp</span>
                  <span className="text-white">{new Date(swapData.timestamp).toLocaleString()}</span>
                </div>

                {swapData.txHash && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Transaction Hash</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono text-sm">
                        {swapData.txHash.slice(0, 8)}...{swapData.txHash.slice(-6)}
                      </span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Real Order Details */}
          {swapData.orderDetails && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold mb-4">Order Details</h3>
                <div className="space-y-3 text-sm">
                  {swapData.orderDetails.orderStruct && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Maker Source</span>
                        <span className="text-white font-mono">
                          {swapData.orderDetails.orderStruct.makerSrc.slice(0, 8)}...
                          {swapData.orderDetails.orderStruct.makerSrc.slice(-6)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Receiver Destination</span>
                        <span className="text-white font-mono">
                          {swapData.orderDetails.orderStruct.receiverDst.slice(0, 8)}...
                          {swapData.orderDetails.orderStruct.receiverDst.slice(-6)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Give Amount</span>
                        <span className="text-white">
                          {swapData.orderDetails.orderStruct.giveOffer.amount} (Chain{" "}
                          {swapData.orderDetails.orderStruct.giveOffer.chainId})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Take Amount</span>
                        <span className="text-white">
                          {swapData.orderDetails.orderStruct.takeOffer.amount} (Chain{" "}
                          {swapData.orderDetails.orderStruct.takeOffer.chainId})
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                What's Next?
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">Your cross-chain swap is being processed by deBridge solvers</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Track progress using the Order ID above</span>
                </div>
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300">Tokens will appear in your destination wallet when completed</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              Make Another Swap
            </Button>
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              onClick={() => window.open(`https://app.debridge.finance/order?orderId=${swapData.orderId}`, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Track on deBridge
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
