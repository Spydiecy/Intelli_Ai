"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useConnectModal, useAccountModal, useChainModal } from '@tomo-inc/tomo-evm-kit'
import { useAccount, useDisconnect } from 'wagmi'

interface WalletContextType {
  wallet: any | null
  connecting: boolean
  connected: boolean
  publicKey: string | null
  connectWallet: () => void
  disconnectWallet: () => Promise<void>
  // Tomo-specific methods
  openConnectModal: () => void
  openAccountModal: () => void
  openChainModal: () => void
}

const WalletContext = createContext<WalletContextType>({
  wallet: null,
  connecting: false,
  connected: false,
  publicKey: null,
  connectWallet: () => {},
  disconnectWallet: async () => {},
  openConnectModal: () => {},
  openAccountModal: () => {},
  openChainModal: () => {}
})

export const useWallet = () => useContext(WalletContext)

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<any | null>(null)
  const [connecting, setConnecting] = useState(false)

  // Tomo EVM Kit hooks - with safe defaults
  const { openConnectModal } = useConnectModal() || { openConnectModal: () => {} }
  const { openAccountModal } = useAccountModal() || { openAccountModal: () => {} }
  const { openChainModal } = useChainModal() || { openChainModal: () => {} }
  const { address, isConnected } = useAccount() || { address: undefined, isConnected: false }
  const { disconnect } = useDisconnect() || { disconnect: async () => {} }

  // Combined state - only using Tomo now
  const connected = isConnected
  const publicKey = address || null

  useEffect(() => {
    if (isConnected && address) {
      setWallet(address)
    } else {
      setWallet(null)
    }
  }, [isConnected, address])

  const connectWallet = () => {
    // Directly open Tomo connect modal
    if (openConnectModal) {
      openConnectModal()
    }
  }

  const disconnectWallet = async () => {
    try {
      if (disconnect) {
        await disconnect()
      }
      setWallet(null)
    } catch (error) {
      console.error("Error disconnecting wallet:", error)
    }
  }

  return (
    <WalletContext.Provider 
      value={{
        wallet,
        connecting,
        connected,
        publicKey,
        connectWallet,
        disconnectWallet,
        openConnectModal: openConnectModal || (() => {}),
        openAccountModal: openAccountModal || (() => {}),
        openChainModal: openChainModal || (() => {})
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
