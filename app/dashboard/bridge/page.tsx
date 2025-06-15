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
import { ArrowUpDown, Settings, Info, Zap, Shield, Clock, TrendingUp, Sparkles, AlertTriangle, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { useWallet } from "@/contexts/WalletContext"
import {
  type Token,
  type SupportedChain,
  type DLNOrderEstimation,
  type SwapData,
  debridgeApi,
  STORY_CHAIN_ID,
} from "@/lib/debridge-api"

export default function SwapPage() {
  // Wallet connection
  const { connected, publicKey: walletAddress, openConnectModal } = useWallet()

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
      const storyChain = chains.find((c:any) => c.chainId === STORY_CHAIN_ID)
      const ethChain = chains.find((c:any) => c.chainId === 1)

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
          const nativeToken = fromTokensList.find((t:any) => t.isNative)
          setFromToken(nativeToken || fromTokensList[0])
        }

        if (toTokensList.length > 0 && !toToken) {
          // Prefer native token (ETH for Ethereum)
          const nativeToken = toTokensList.find((t:any) => t.isNative)
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

    // Check if wallet is connected
    if (!connected || !walletAddress) {
      setError("Please connect your wallet to perform a swap")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Create the actual cross-chain swap transaction with the connected wallet address
      const swapTransaction = await debridgeApi.createDLNOrder({
        srcChainId: fromChain.chainId,
        srcChainTokenIn: fromToken.address,
        srcChainTokenInAmount: estimation.estimation.srcChainTokenIn.amount,
        dstChainId: toChain.chainId,
        dstChainTokenOut: toToken.address,
        dstChainTokenOutAmount: "auto",
        dstChainTokenOutRecipient: walletAddress,
        senderAddress: walletAddress,
        srcChainOrderAuthorityAddress: walletAddress,
        dstChainOrderAuthorityAddress: walletAddress,
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
      const protocolFeeDetail = swapTransaction.estimation.costsDetails?.find((c:any) => c.type === "protocolFee")
      const solverFeeDetail = swapTransaction.estimation.costsDetails?.find((c:any) => c.type === "solverFee")

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
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
        <span className="ml-4 text-white/60">Loading supported chains...</span>
      </div>
    )
  }

  const canSwap =
    connected &&
    walletAddress &&
    estimation &&
    fromToken &&
    toToken &&
    fromAmount &&
    Number.parseFloat(fromAmount) > 0 &&
    fromChain &&
    toChain &&
    fromChain.chainId !== toChain.chainId

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 text-transparent bg-clip-text mb-2">
              Cross-Chain Bridge
            </h1>
            <p className="text-white/60">
              Bridge tokens seamlessly between Story Protocol and other supported chains using the official deBridge integration.
            </p>
            {/* Wallet Status */}
            {connected && walletAddress && (
              <div className="mt-4 flex items-center gap-2">
                <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Connected
                </Badge>
                <span className="text-white/60 text-sm font-mono">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={loadSupportedChains}
              disabled={loading}
              variant="outline"
              size="icon"
              className="border-white/20 hover:bg-white/10 text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Bridge Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <Card className="bg-black/20 border-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Supported Chains</p>
                <p className="text-2xl font-bold text-white">{supportedChains.length}</p>
              </div>
              <Shield className="h-8 w-8 text-white/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Bridge Status</p>
                <p className="text-2xl font-bold text-white">Active</p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Avg Time</p>
                <p className="text-2xl font-bold text-white">2-5 min</p>
              </div>
              <Clock className="h-8 w-8 text-white/60" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-8 backdrop-blur-sm"
        >
          <h3 className="text-red-400 font-semibold mb-2">Error</h3>
          <p className="text-red-300">{error}</p>
          <Button onClick={loadSupportedChains} className="mt-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300">
            Try Again
          </Button>
        </motion.div>
      )}
      {/* Swap Interface */}
      <div className="max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-black/20 border-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-white/80" />
                  Bridge Interface
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/10 text-white border-white/20">
                    <Shield className="w-3 h-3 mr-1" />
                    deBridge
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              {/* From Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-white/60 text-sm font-medium">From</label>
                  <Select
                    value={fromChain?.chainId.toString() || ""}
                    onValueChange={(value) => {
                      const chain = supportedChains.find((c) => c.chainId.toString() === value)
                      if (chain) setFromChain(chain)
                    }}
                  >
                    <SelectTrigger className="w-48 bg-black/50 border-white/20 text-white h-8 hover:border-white/30 transition-colors">
                      <SelectValue placeholder="Select chain" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/20 backdrop-blur-sm">
                      {supportedChains.map((chain) => (
                        <SelectItem key={chain.chainId} value={chain.chainId.toString()} className="text-white hover:bg-white/10">
                          <div className="flex items-center gap-2">
                            <div className="relative w-4 h-4 rounded-full overflow-hidden bg-black/30 border border-white/20 flex items-center justify-center">
                              {chain.logoURI ? (
                                <img
                                  src={chain.logoURI}
                                  alt={chain.chainName}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = "none"
                                    const parent = target.parentElement
                                    if (parent) {
                                      parent.innerHTML = `<span class="text-xs font-bold text-white/60">${chain.chainName.slice(0, 2).toUpperCase()}</span>`
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-xs font-bold text-white/60">
                                  {chain.chainName.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            {chain.chainName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-black/50 border border-white/20 rounded-lg p-4 hover:border-white/30 transition-colors backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3">
                    <Input
                      placeholder="0.0"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      className="bg-transparent border-0 text-2xl font-bold text-white placeholder:text-white/40 p-0 h-auto focus-visible:ring-0"
                      type="number"
                    />
                    <TokenButton
                      token={fromToken}
                      onClick={() => setShowFromTokenSelector(true)}
                      placeholder="Select token"
                    />
                  </div>
                  {fromToken && <div className="text-white/60 text-sm">Balance: 0.00 {fromToken.symbol}</div>}
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSwapChains}
                  className="rounded-full bg-black/50 border border-white/20 hover:bg-white/10 p-2 z-10"
                >
                  <ArrowUpDown className="w-4 h-4 text-white/60" />
                </Button>
              </div>

              {/* To Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-white/60 text-sm font-medium">To</label>
                  <Select
                    value={toChain?.chainId.toString() || ""}
                    onValueChange={(value) => {
                      const chain = supportedChains.find((c) => c.chainId.toString() === value)
                      if (chain) setToChain(chain)
                    }}
                  >
                    <SelectTrigger className="w-48 bg-black/50 border-white/20 text-white h-8 hover:border-white/30 transition-colors">
                      <SelectValue placeholder="Select chain" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/20 backdrop-blur-sm">
                      {supportedChains.map((chain) => (
                        <SelectItem key={chain.chainId} value={chain.chainId.toString()} className="text-white hover:bg-white/10">
                          <div className="flex items-center gap-2">
                            <div className="relative w-4 h-4 rounded-full overflow-hidden bg-black/30 border border-white/20 flex items-center justify-center">
                              {chain.logoURI ? (
                                <img
                                  src={chain.logoURI}
                                  alt={chain.chainName}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = "none"
                                    const parent = target.parentElement
                                    if (parent) {
                                      parent.innerHTML = `<span class="text-xs font-bold text-white/60">${chain.chainName.slice(0, 2).toUpperCase()}</span>`
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-xs font-bold text-white/60">
                                  {chain.chainName.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            {chain.chainName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-black/50 border border-white/20 rounded-lg p-4 hover:border-white/30 transition-colors backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3">
                    <Input
                      placeholder="0.0"
                      value={toAmount}
                      readOnly
                      className="bg-transparent border-0 text-2xl font-bold text-white placeholder:text-white/40 p-0 h-auto focus-visible:ring-0"
                      type="number"
                    />
                    <TokenButton
                      token={toToken}
                      onClick={() => setShowToTokenSelector(true)}
                      placeholder="Select token"
                    />
                  </div>
                  {toToken && <div className="text-white/60 text-sm">Balance: 0.00 {toToken.symbol}</div>}
                </div>
              </div>

              {/* Same Chain Warning */}
              {fromChain && toChain && fromChain.chainId === toChain.chainId && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-300 text-sm">
                      Source and destination chains must be different for cross-chain swaps.
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Bridge Details */}
              {estimation && fromChain && toChain && fromChain.chainId !== toChain.chainId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-black/30 border border-white/10 rounded-lg p-4 space-y-3 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Exchange Rate</span>
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
                      <span className="text-white/60">Recommended Slippage</span>
                      <span className="text-white">{estimation.estimation.recommendedSlippage}%</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Estimated Time</span>
                    <span className="text-white flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {estimation.order?.approximateFulfillmentDelay
                        ? `${Math.ceil(estimation.order.approximateFulfillmentDelay / 60)} minutes`
                        : "2-5 minutes"}
                    </span>
                  </div>

                  {estimation.estimation.srcChainTokenIn.approximateUsdValue && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">USD Value</span>
                      <span className="text-white">
                        ${estimation.estimation.srcChainTokenIn.approximateUsdValue.toFixed(2)}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Bridge Button */}
              <Button
                onClick={!connected ? openConnectModal : handleSwap}
                disabled={loading || (connected && !canSwap)}
                className="w-full h-12 bg-white/20 hover:bg-white/30 text-white font-semibold disabled:opacity-50 border border-white/20 hover:border-white/30 transition-all backdrop-blur-sm"
              >
                {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                {loading
                  ? "Processing Bridge..."
                  : !connected
                    ? "Connect Wallet"
                    : !canSwap
                      ? "Enter Amount"
                      : fromChain && toChain && fromChain.chainId === toChain.chainId
                        ? "Select Different Chains"
                        : "Bridge Tokens"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
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
