"use client"

import { Button } from "@/components/ui/button"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronDown } from "lucide-react"
import { type Token, debridgeApi } from "@/lib/debridge-api"

interface TokenSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectToken: (token: Token) => void
  chainId: number
  selectedToken?: Token
}

export function TokenSelector({ isOpen, onClose, onSelectToken, chainId, selectedToken }: TokenSelectorProps) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && chainId) {
      loadTokens()
    }
  }, [isOpen, chainId])

  const loadTokens = async () => {
    try {
      setLoading(true)
      setError(null)
      const tokenList = await debridgeApi.getTokenList(chainId)
      setTokens(tokenList)
    } catch (error) {
      console.error("Failed to load tokens:", error)
      setError("Failed to load tokens for this chain")
    } finally {
      setLoading(false)
    }
  }

  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.address.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelectToken = (token: Token) => {
    onSelectToken(token)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Select Token</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 " />
            <Input
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 w-fit"
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <div className="text-red-300 text-sm">{error}</div>
            </div>
          )}

          <ScrollArea className="h-80">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTokens.map((token:any) => (
                  <button
                    key={`${token.chainId}-${token.address}`}
                    onClick={() => handleSelectToken(token)}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <div className="relative w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                      {token.logoURI ? (
                        <img
                          src={token.logoURI || "/placeholder.svg"}
                          alt={token.symbol}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = "none"
                            target.nextElementSibling?.classList.remove("hidden")
                          }}
                        />
                      ) : null}
                      <span
                        className={`text-sm font-bold text-gray-400 ${token.logoURI ? "hidden" : ""}`}
                        style={{ display: token.logoURI ? "none" : "block" }}
                      >
                        {token.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{token.symbol}</span>
                        {token.isNative && (
                          <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 text-xs">
                            Native
                          </Badge>
                        )}
                        {token.tags && token.tags.includes("PEG:BTC") && (
                          <Badge className="bg-orange-600/20 text-orange-300 border-orange-500/30 text-xs">BTC</Badge>
                        )}
                        {token.tags && token.tags.includes("PEG:ETH") && (
                          <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30 text-xs">ETH</Badge>
                        )}
                      </div>
                      <div className="text-gray-400 text-sm">{token.name}</div>
                      <div className="text-gray-500 text-xs font-mono">
                        {token.address.slice(0, 8)}...{token.address.slice(-6)}
                      </div>
                    </div>
                  </button>
                ))}
                {filteredTokens.length === 0 && !loading && !error && (
                  <div className="text-center py-8 text-gray-400">No tokens found</div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface TokenButtonProps {
  token?: Token
  onClick: () => void
  placeholder?: string
}

export function TokenButton({ token, onClick, placeholder = "Select token" }: TokenButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="w-full justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700 h-12"
    >
      <div className="flex items-center space-x-2">
        {token ? (
          <>
            <div className="relative w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
              {token.logoURI ? (
                <img
                  src={token.logoURI || "/placeholder.svg"}
                  alt={token.symbol}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    target.nextElementSibling?.classList.remove("hidden")
                  }}
                />
              ) : null}
              <span
                className={`text-xs font-bold ${token.logoURI ? "hidden" : ""}`}
                style={{ display: token.logoURI ? "none" : "block" }}
              >
                {token.symbol.slice(0, 2)}
              </span>
            </div>
            <span className="font-medium">{token.symbol}</span>
            {token.isNative && (
              <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 text-xs">Native</Badge>
            )}
          </>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </div>
      <ChevronDown className="w-4 h-4 text-gray-400" />
    </Button>
  )
}
