"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown, RefreshCw, CheckCircle } from "lucide-react"
import { debridgeApi, type SupportedChain, type Token, type DLNOrderEstimation } from "@/lib/debridge-api"

interface BridgeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BridgeModal({ isOpen, onClose }: BridgeModalProps) {
  const [chains, setChains] = useState<SupportedChain[]>([])
  const [fromChain, setFromChain] = useState<SupportedChain | null>(null)
  const [toChain, setToChain] = useState<SupportedChain | null>(null)
  const [fromTokens, setFromTokens] = useState<Token[]>([])
  const [toTokens, setToTokens] = useState<Token[]>([])
  const [fromToken, setFromToken] = useState<Token | null>(null)
  const [toToken, setToToken] = useState<Token | null>(null)
  const [amount, setAmount] = useState("")
  const [estimation, setEstimation] = useState<DLNOrderEstimation | null>(null)
  const [loading, setLoading] = useState(false)
  const [estimating, setEstimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadChains()
    }
  }, [isOpen])

  useEffect(() => {
    if (fromChain) {
      loadTokens(fromChain.chainId, "from")
    }
  }, [fromChain])

  useEffect(() => {
    if (toChain) {
      loadTokens(toChain.chainId, "to")
    }
  }, [toChain])

  const loadChains = async () => {
    try {
      setLoading(true)
      const chainsData = await debridgeApi.getSupportedChains()
      setChains(chainsData)
    } catch (error) {
      console.error("Failed to load chains:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadTokens = async (chainId: number, type: "from" | "to") => {
    try {
      const tokens = await debridgeApi.getTokenList(chainId)
      if (type === "from") {
        setFromTokens(tokens)
        setFromToken(null)
      } else {
        setToTokens(tokens)
        setToToken(null)
      }
    } catch (error) {
      console.error(`Failed to load tokens for chain ${chainId}:`, error)
    }
  }

  const getEstimation = async () => {
    if (!fromChain || !toChain || !fromToken || !toToken || !amount) return

    try {
      setEstimating(true)
      const amountInWei = debridgeApi.parseAmount(amount, fromToken.decimals)

      const estimationData = await debridgeApi.createDLNOrder({
        srcChainId: fromChain.chainId,
        srcChainTokenIn: fromToken.address,
        srcChainTokenInAmount: amountInWei,
        dstChainId: toChain.chainId,
        dstChainTokenOut: toToken.address,
        enableEstimate: true,
      })

      setEstimation(estimationData)
    } catch (error) {
      console.error("Failed to get estimation:", error)
      setEstimation(null)
    } finally {
      setEstimating(false)
    }
  }

  const swapChains = () => {
    const tempChain = fromChain
    const tempToken = fromToken
    const tempTokens = fromTokens

    setFromChain(toChain)
    setToChain(tempChain)
    setFromToken(toToken)
    setToToken(tempToken)
    setFromTokens(toTokens)
    setToTokens(tempTokens)
    setEstimation(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-black/95 border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowUpDown className="h-6 w-6" />
            Cross-Chain Bridge
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* From Section */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg">From</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Chain</label>
                  <Select
                    value={fromChain?.chainId.toString()}
                    onValueChange={(value) => {
                      const chain = chains.find((c) => c.chainId.toString() === value)
                      setFromChain(chain || null)
                    }}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select chain" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/20">
                      {chains.map((chain) => (
                        <SelectItem key={chain.chainId} value={chain.chainId.toString()}>
                          <div className="flex items-center gap-2">
                            {chain.logoURI && (
                              <img
                                src={chain.logoURI || "/placeholder.svg"}
                                alt={chain.chainName}
                                className="w-5 h-5"
                              />
                            )}
                            {chain.chainName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block">Token</label>
                  <Select
                    value={fromToken?.address}
                    onValueChange={(value) => {
                      const token = fromTokens.find((t) => t.address === value)
                      setFromToken(token || null)
                    }}
                    disabled={!fromChain}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/20">
                      {fromTokens.map((token) => (
                        <SelectItem key={token.address} value={token.address}>
                          <div className="flex items-center gap-2">
                            {token.logoURI && (
                              <img src={token.logoURI || "/placeholder.svg"} alt={token.symbol} className="w-5 h-5" />
                            )}
                            <span>{token.symbol}</span>
                            <span className="text-white/60 text-sm">({token.name})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Amount</label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  disabled={!fromToken}
                />
              </div>
            </CardContent>
          </Card>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={swapChains}
              className="border-white/20 text-white hover:bg-white/10"
              disabled={!fromChain || !toChain}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* To Section */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg">To</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Chain</label>
                  <Select
                    value={toChain?.chainId.toString()}
                    onValueChange={(value) => {
                      const chain = chains.find((c) => c.chainId.toString() === value)
                      setToChain(chain || null)
                    }}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select chain" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/20">
                      {chains.map((chain) => (
                        <SelectItem key={chain.chainId} value={chain.chainId.toString()}>
                          <div className="flex items-center gap-2">
                            {chain.logoURI && (
                              <img
                                src={chain.logoURI || "/placeholder.svg"}
                                alt={chain.chainName}
                                className="w-5 h-5"
                              />
                            )}
                            {chain.chainName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block">Token</label>
                  <Select
                    value={toToken?.address}
                    onValueChange={(value) => {
                      const token = toTokens.find((t) => t.address === value)
                      setToToken(token || null)
                    }}
                    disabled={!toChain}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/20">
                      {toTokens.map((token) => (
                        <SelectItem key={token.address} value={token.address}>
                          <div className="flex items-center gap-2">
                            {token.logoURI && (
                              <img src={token.logoURI || "/placeholder.svg"} alt={token.symbol} className="w-5 h-5" />
                            )}
                            <span>{token.symbol}</span>
                            <span className="text-white/60 text-sm">({token.name})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {estimation && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 font-medium">Estimated Output</span>
                  </div>
                  <p className="text-white">
                    {debridgeApi.formatAmount(
                      estimation.estimation.dstChainTokenOut.amount,
                      estimation.estimation.dstChainTokenOut.decimals,
                    )}{" "}
                    {estimation.estimation.dstChainTokenOut.symbol}
                  </p>
                  {estimation.estimation.recommendedSlippage && (
                    <p className="text-white/60 text-sm mt-1">
                      Recommended Slippage: {estimation.estimation.recommendedSlippage}%
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={getEstimation}
              disabled={!fromChain || !toChain || !fromToken || !toToken || !amount || estimating}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {estimating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Getting Quote...
                </>
              ) : (
                "Get Quote"
              )}
            </Button>

            <Button variant="outline" onClick={onClose} className="border-white/20 text-white">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
