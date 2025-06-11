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
      <DialogContent 
        className="bg-black/90 border-white/20 backdrop-blur-sm p-0 overflow-hidden token-selector-dialog"
        style={{
          width: 'min(calc(100vw - 2rem), 28rem)',
          maxWidth: 'min(calc(100vw - 2rem), 28rem)',
          maxHeight: 'calc(100vh - 2rem)',
          margin: '0 auto'
        }}
      >
        <div className="p-6 space-y-4 overflow-hidden w-full">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-white">Select Token</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-hidden w-full">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4 z-10 pointer-events-none" />
              <Input
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full bg-black/50 border-white/20 text-white placeholder:text-white/40 backdrop-blur-sm hover:border-white/30 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-red-300 text-sm">{error}</div>
              </div>
            )}

            <ScrollArea className="h-80 w-full overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/40"></div>
                </div>
              ) : (
                <div className="space-y-2 pr-2 overflow-hidden">
                  {filteredTokens.map((token:any) => (
                    <button
                      key={`${token.chainId}-${token.address}`}
                      onClick={() => handleSelectToken(token)}
                      className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-white/10 transition-colors border border-transparent hover:border-white/20 backdrop-blur-sm overflow-hidden"
                    >
                      <div className="relative w-10 h-10 rounded-full bg-black/30 border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                          className={`text-sm font-bold text-white/60 ${token.logoURI ? "hidden" : ""}`}
                          style={{ display: token.logoURI ? "none" : "block" }}
                        >
                          {token.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 text-left min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-white font-medium truncate flex-1">{token.symbol}</span>
                          <div className="flex gap-1 flex-shrink-0">
                            {token.isNative && (
                              <Badge className="bg-white/10 text-white border-white/20 text-xs">
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
                        </div>
                        <div className="text-white/60 text-sm truncate">{token.name}</div>
                        <div className="text-white/40 text-xs font-mono truncate">
                          {token.address.slice(0, 6)}...{token.address.slice(-4)}
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredTokens.length === 0 && !loading && !error && (
                    <div className="text-center py-8 text-white/60">No tokens found</div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
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
      className="w-full justify-between bg-black/50 border-white/20 text-white hover:bg-white/10 hover:border-white/30 h-12 backdrop-blur-sm transition-all min-w-0"
    >
      <div className="flex items-center space-x-2 min-w-0 flex-1">
        {token ? (
          <>
            <div className="relative w-6 h-6 rounded-full bg-black/30 border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                className={`text-xs font-bold text-white/60 ${token.logoURI ? "hidden" : ""}`}
                style={{ display: token.logoURI ? "none" : "block" }}
              >
                {token.symbol.slice(0, 2)}
              </span>
            </div>
            <span className="font-medium truncate">{token.symbol}</span>
            {token.isNative && (
              <Badge className="bg-white/10 text-white border-white/20 text-xs flex-shrink-0">Native</Badge>
            )}
          </>
        ) : (
          <span className="text-white/60 truncate">{placeholder}</span>
        )}
      </div>
      <ChevronDown className="w-4 h-4 text-white/60 flex-shrink-0" />
    </Button>
  )
}
