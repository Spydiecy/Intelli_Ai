"use client"

import { useWallet } from "@/contexts/WalletContext"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function ConnectWalletButton({ className }: { className?: string }) {
  const { 
    connectWallet, 
    disconnectWallet, 
    connected, 
    connecting, 
    publicKey,
    openAccountModal
  } = useWallet()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const truncateAddress = (address?: string | null) => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  
  const handleConnect = async () => {
    await connectWallet()
  }
  
  const handleDisconnect = async () => {
    await disconnectWallet()
    setIsDropdownOpen(false)
  }

  const getTomoIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500">
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1"/>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  
  if (connected && publicKey) {
    return (
      <div className="relative">
        <Button 
          variant="outline"
          size="sm"
          className={cn(
            "border-white/20 bg-black/30 backdrop-blur-sm hover:bg-white/10",
            "flex items-center gap-2", 
            className
          )}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {getTomoIcon()}
          <span>{truncateAddress(publicKey)}</span>
        </Button>
        
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md border border-white/10 bg-black/80 backdrop-blur-lg shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-2 text-xs text-gray-400 border-b border-white/10">
              Connected via Tomo
            </div>
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors"
              onClick={() => openAccountModal()}
            >
              Account Details
            </button>
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors"
              onClick={handleDisconnect}
            >
              Disconnect Wallet
            </button>
          </div>
        )}
      </div>
    )
  }

    return (
    <Button 
      variant="outline"
      size="sm"
      className={cn(
        "border-white/20 bg-black/30 backdrop-blur-sm hover:bg-white/10",
        "flex items-center gap-2", 
        className
      )}
      onClick={handleConnect}
      disabled={connecting}
    >
      {getTomoIcon()}
      <span>{connecting ? "Connecting..." : "Connect Wallet"}</span>
    </Button>
  )
}
