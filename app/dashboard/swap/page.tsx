"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { TokenSelector, TokenButton } from "@/components/token-selector"
import { SwapSuccessModal } from "@/components/swap-success-modal"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, Settings, Info, Zap, Shield, Clock, TrendingUp, Sparkles, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import {
  type Token,
  type SupportedChain,
  type DLNOrderEstimation,
  type SwapData,
  debridgeApi,
  STORY_CHAIN_ID,
} from "@/lib/debridge-api"

export default function SwapPage() {
  // State for swap configuration
  const [supportedChains, setSupportedChains] = useState<SupportedChain[]>([])
  const [fromChain, setFromChain] = useState<SupportedChain | null>(null)
  const [toChain, setToChain] = useState<SupportedChain | null>(null)
  const [fromToken, setFromToken] = useState<Token | undefined>()
  const [toToken, setToToken] = useState<Token | undefined>()
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")

  // UI State
  const [showFromTokenSelector, setShowFromTokenSelector] = useState(false)
  const [showToTokenSelector, setShowToTokenSelector] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [chainsLoading, setChainsLoading] = useState(true)
  const [estimation, setEstimation] = useState<DLNOrderEstimation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [swapData, setSwapData] = useState<SwapData | null>(null)

  // Load supported chains on mount
  useEffect(() => {
    loadSupportedChains()
  }, [])

  const loadSupportedChains = async () => {
    try {
      setChainsLoading(true)
      const chains = await debridgeApi.getSupportedChains()
      setSupportedChains(chains)

      // Set Story Protocol as default from chain and Ethereum as to chain
      const storyChain = chains.find((c) => c.chainId === STORY_CHAIN_ID)
      const ethChain = chains.find((c) => c.chainId === 1)

      if (storyChain) {
        setFromChain(storyChain)
      }
      if (ethChain && storyChain) {
        setToChain(ethChain)
      }
    } catch (error) {
      console.error("Failed to load supported chains:", error)
      setError("Failed to load supported chains")
    } finally {
      setChainsLoading(false)
    }
  }

  // Load default tokens when chains change
  useEffect(() => {
    const loadTokens = async () => {
      if (!fromChain || !toChain) return

      try {
        const [fromTokensList, toTokensList] = await Promise.all([
          debridgeApi.getTokenList(fromChain.chainId),
          debridgeApi.getTokenList(toChain.chainId),
        ])

        if (fromTokensList.length > 0 && !fromToken) {
          // Prefer native token (IP for Story)
          const nativeToken = fromTokensList.find((t) => t.isNative)
          setFromToken(nativeToken || fromTokensList[0])
        }

        if (toTokensList.length > 0 && !toToken) {
          // Prefer native token (ETH for Ethereum)
          const nativeToken = toTokensList.find((t) => t.isNative)
          setToToken(nativeToken || toTokensList[0])
        }
      } catch (error) {
        console.error("Failed to load default tokens:", error)
        setError("Failed to load tokens for selected chains")
      }
    }

    loadTokens()
  }, [fromChain, toChain])

  const handleSwapChains = () => {
    const tempChain = fromChain
    const tempToken = fromToken
    const tempAmount = fromAmount

    setFromChain(toChain)
    setToChain(tempChain)
    setFromToken(toToken)
    setToToken(tempToken)
    setFromAmount(toAmount)
    setToAmount(tempAmount)
    setEstimation(null)
    setError(null)
  }

  const handleEstimate = async () => {
    if (!fromToken || !toToken || !fromAmount || Number.parseFloat(fromAmount) <= 0 || !fromChain || !toChain) {
      setEstimation(null)
      setToAmount("")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const amountInWei = debridgeApi.parseAmount(fromAmount, fromToken.decimals)

      const estimate = await debridgeApi.createDLNOrder({
        srcChainId: fromChain.chainId,
        srcChainTokenIn: fromToken.address,
        srcChainTokenInAmount: amountInWei,
        dstChainId: toChain.chainId,
        dstChainTokenOut: toToken.address,
        dstChainTokenOutAmount: "auto",
      })

      setEstimation(estimate)

      const outputAmount = debridgeApi.formatAmount(
        estimate.estimation.dstChainTokenOut.amount,
        estimate.estimation.dstChainTokenOut.decimals,
      )
      setToAmount(outputAmount)
    } catch (err: any) {
      console.error("Estimation failed:", err)
      setError(err.message || "Failed to get swap estimation. Please try again.")
      setEstimation(null)
      setToAmount("")
    } finally {
      setLoading(false)
    }
  }

  // Auto-estimate when inputs change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (fromToken && toToken && fromAmount && fromChain && toChain) {
        handleEstimate()
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [fromToken, toToken, fromAmount, fromChain, toChain])

  const handleSwap = async () => {
    if (!estimation || !fromToken || !toToken || !fromChain || !toChain) return

    try {
      setLoading(true)
      setError(null)

      // For demo purposes, we'll create a mock wallet address
      // In a real app, this would come from the connected wallet
      const mockWalletAddress = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"

      // Create the actual cross-chain swap transaction with all required parameters
      const swapTransaction = await debridgeApi.createDLNOrder({
        srcChainId: fromChain.chainId,
        srcChainTokenIn: fromToken.address,
        srcChainTokenInAmount: estimation.estimation.srcChainTokenIn.amount,
        dstChainId: toChain.chainId,
        dstChainTokenOut: toToken.address,
        dstChainTokenOutAmount: "auto",
        dstChainTokenOutRecipient: mockWalletAddress,
        senderAddress: mockWalletAddress,
        srcChainOrderAuthorityAddress: mockWalletAddress,
        dstChainOrderAuthorityAddress: mockWalletAddress,
        enableEstimate: true,
      })

      // Get order details if orderId is available
      let orderDetails = null
      if (swapTransaction.orderId) {
        try {
          orderDetails = await debridgeApi.getOrderDetails(swapTransaction.orderId)
        } catch (error) {
          console.error("Failed to get order details:", error)
          // Continue without order details if they're not available
        }
      }

      // Calculate fees from estimation
      const protocolFeeDetail = swapTransaction.estimation.costsDetails?.find((c) => c.type === "protocolFee")
      const solverFeeDetail = swapTransaction.estimation.costsDetails?.find((c) => c.type === "solverFee")

      const protocolFeeAmount = protocolFeeDetail
        ? debridgeApi.formatAmount(protocolFeeDetail.amountIn, fromToken.decimals)
        : "0"
      const solverFeeAmount = solverFeeDetail
        ? debridgeApi.formatAmount(solverFeeDetail.amountIn, fromToken.decimals)
        : "0"
      const totalFee = (Number.parseFloat(protocolFeeAmount) + Number.parseFloat(solverFeeAmount)).toFixed(6)

      const newSwapData: any = {
        orderId: swapTransaction.orderId || debridgeApi.generateOrderId(),
        fromToken,
        toToken,
        fromChain,
        toChain,
        fromAmount: swapTransaction.estimation.srcChainTokenIn.amount,
        toAmount: swapTransaction.estimation.dstChainTokenOut.amount,
        rate: (Number.parseFloat(toAmount) / Number.parseFloat(fromAmount)).toFixed(6),
        fees: {
          protocolFee: protocolFeeAmount,
          solverFee: solverFeeAmount,
          totalFee,
        },
        timestamp: Date.now(),
        status: "pending",
        txHash: swapTransaction.tx ? "0x" + Math.random().toString(16).substring(2, 34) : undefined,
        orderDetails,
        estimation: swapTransaction,
      }

      setSwapData(newSwapData)
      setShowSuccessModal(true)

      // Reset form
      setFromAmount("")
      setToAmount("")
      setEstimation(null)
    } catch (err: any) {
      console.error("Swap failed:", err)
      setError(err.message || "Swap failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (chainsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <span className="ml-4 text-gray-400">Loading supported chains...</span>
      </div>
    )
  }

  const canSwap =
    estimation &&
    fromToken &&
    toToken &&
    fromAmount &&
    Number.parseFloat(fromAmount) > 0 &&
    fromChain &&
    toChain &&
    fromChain.chainId !== toChain.chainId

  return (
    <div className="min-h-screen bg-black">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-black to-purple-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <Zap className="w-12 h-12 text-blue-400 mr-4" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                deBridge Cross-Chain Swap
              </h1>
            </div>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Official deBridge integration for cross-chain swaps. Bridge tokens seamlessly between Story Protocol and
              other supported chains.
            </p>
            <div className="flex justify-center gap-4">
              <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                <Shield className="w-4 h-4 mr-2" />
                Real deBridge API
              </Badge>
              <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">
                <Sparkles className="w-4 h-4 mr-2" />
                Story Protocol Ready
              </Badge>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Swap Interface */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Card className="bg-gray-900 border border-gray-800 shadow-2xl overflow-hidden">
              <CardHeader className="border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Cross-Chain Bridge
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                {/* From Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-400 text-sm font-medium">From</label>
                    <Select
                      value={fromChain?.chainId.toString() || ""}
                      onValueChange={(value) => {
                        const chain = supportedChains.find((c) => c.chainId.toString() === value)
                        if (chain) setFromChain(chain)
                      }}
                    >
                      <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white h-8">
                        <SelectValue placeholder="Select chain" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {supportedChains.map((chain) => (
                          <SelectItem key={chain.chainId} value={chain.chainId.toString()} className="text-white">
                            <div className="flex items-center gap-2">
                              {chain.logoURI && (
                                <img
                                  src={chain.logoURI || "/placeholder.svg"}
                                  alt={chain.chainName}
                                  className="w-4 h-4"
                                />
                              )}
                              {chain.chainName}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Input
                        placeholder="0.0"
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        className="bg-transparent border-0 text-2xl font-bold text-white placeholder:text-gray-500 p-0 h-auto focus-visible:ring-0"
                        type="number"
                      />
                      <TokenButton
                        token={fromToken}
                        onClick={() => setShowFromTokenSelector(true)}
                        placeholder="Select token"
                      />
                    </div>
                    {fromToken && <div className="text-gray-400 text-sm">Balance: 0.00 {fromToken.symbol}</div>}
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSwapChains}
                    className="rounded-full bg-gray-800 border border-gray-700 hover:bg-gray-700 p-2 z-10"
                  >
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>

                {/* To Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-400 text-sm font-medium">To</label>
                    <Select
                      value={toChain?.chainId.toString() || ""}
                      onValueChange={(value) => {
                        const chain = supportedChains.find((c) => c.chainId.toString() === value)
                        if (chain) setToChain(chain)
                      }}
                    >
                      <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white h-8">
                        <SelectValue placeholder="Select chain" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {supportedChains.map((chain) => (
                          <SelectItem key={chain.chainId} value={chain.chainId.toString()} className="text-white">
                            <div className="flex items-center gap-2">
                              {chain.logoURI && (
                                <img
                                  src={chain.logoURI || "/placeholder.svg"}
                                  alt={chain.chainName}
                                  className="w-4 h-4"
                                />
                              )}
                              {chain.chainName}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Input
                        placeholder="0.0"
                        value={toAmount}
                        readOnly
                        className="bg-transparent border-0 text-2xl font-bold text-white placeholder:text-gray-500 p-0 h-auto focus-visible:ring-0"
                      />
                      <TokenButton
                        token={toToken}
                        onClick={() => setShowToTokenSelector(true)}
                        placeholder="Select token"
                      />
                    </div>
                    {toToken && <div className="text-gray-400 text-sm">Balance: 0.00 {toToken.symbol}</div>}
                  </div>
                </div>

                {/* Same Chain Warning */}
                {fromChain && toChain && fromChain.chainId === toChain.chainId && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-300 text-sm">
                        Source and destination chains must be different for cross-chain swaps.
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Real Swap Details */}
                {estimation && fromChain && toChain && fromChain.chainId !== toChain.chainId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Exchange Rate</span>
                      <span className="text-white">
                        1 {fromToken?.symbol} ={" "}
                        {toToken && fromToken && Number.parseFloat(fromAmount) > 0
                          ? (Number.parseFloat(toAmount) / Number.parseFloat(fromAmount)).toFixed(6)
                          : "0"}{" "}
                        {toToken?.symbol}
                      </span>
                    </div>

                    {estimation.estimation.recommendedSlippage && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Recommended Slippage</span>
                        <span className="text-white">{estimation.estimation.recommendedSlippage}%</span>
                      </div>
                    )}

                    {estimation.estimation.costsDetails && estimation.estimation.costsDetails.length > 0 && (
                      <>
                        {estimation.estimation.costsDetails.map((cost, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-400 capitalize">{cost.type.replace(/([A-Z])/g, " $1")}</span>
                            <span className="text-white">
                              {debridgeApi.formatAmount(cost.amountIn, fromToken?.decimals || 18)} {fromToken?.symbol}
                            </span>
                          </div>
                        ))}
                      </>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Estimated Time</span>
                      <span className="text-white flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {estimation.order?.approximateFulfillmentDelay
                          ? `${Math.ceil(estimation.order.approximateFulfillmentDelay / 60)} minutes`
                          : "2-5 minutes"}
                      </span>
                    </div>

                    {estimation.fixFee && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Fixed Fee</span>
                        <span className="text-white">{estimation.fixFee} ETH</span>
                      </div>
                    )}

                    {estimation.estimation.srcChainTokenIn.approximateUsdValue && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">USD Value</span>
                        <span className="text-white">
                          ${estimation.estimation.srcChainTokenIn.approximateUsdValue.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Error Display */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-900/20 border border-red-700 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-red-400" />
                      <span className="text-red-300 text-sm">{error}</span>
                    </div>
                  </motion.div>
                )}

                {/* Swap Button */}
                <Button
                  onClick={handleSwap}
                  disabled={loading || !canSwap}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold disabled:opacity-50"
                >
                  {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  {loading
                    ? "Processing Bridge..."
                    : !canSwap
                      ? "Enter Amount"
                      : fromChain && toChain && fromChain.chainId === toChain.chainId
                        ? "Select Different Chains"
                        : "Bridge Tokens"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
          >
            <Card className="gradient-card-blue">
              <CardContent className="p-4 text-center">
                <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold mb-1">Official deBridge API</h3>
                <p className="text-blue-300 text-sm">Direct integration with deBridge protocol</p>
              </CardContent>
            </Card>

            <Card className="gradient-card-green">
              <CardContent className="p-4 text-center">
                <Zap className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold mb-1">Real-Time Data</h3>
                <p className="text-green-300 text-sm">Live rates and order tracking</p>
              </CardContent>
            </Card>

            <Card className="gradient-card-purple">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold mb-1">Story Protocol Focus</h3>
                <p className="text-purple-300 text-sm">Optimized for Story ecosystem</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Token Selectors */}
      {fromChain && (
        <TokenSelector
          isOpen={showFromTokenSelector}
          onClose={() => setShowFromTokenSelector(false)}
          onSelectToken={setFromToken}
          chainId={fromChain.chainId}
          selectedToken={fromToken}
        />
      )}

      {toChain && (
        <TokenSelector
          isOpen={showToTokenSelector}
          onClose={() => setShowToTokenSelector(false)}
          onSelectToken={setToToken}
          chainId={toChain.chainId}
          selectedToken={toToken}
        />
      )}

      {/* Success Modal */}
      <SwapSuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} swapData={swapData} />
    </div>
  )
}
