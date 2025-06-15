const DEBRIDGE_API_BASE = "https://deswap.debridge.finance/v1.0"
const DEBRIDGE_STATS_API = "https://stats-api.dln.trade/api"

// Chain logo mapping for popular chains
const CHAIN_LOGOS: Record<number, string> = {
  1: "https://cryptologos.cc/logos/ethereum-eth-logo.png", // Ethereum
  56: "https://cryptologos.cc/logos/bnb-bnb-logo.png", // BSC
  137: "https://cryptologos.cc/logos/polygon-matic-logo.png", // Polygon
  43114: "https://cryptologos.cc/logos/avalanche-avax-logo.png", // Avalanche
  250: "https://cryptologos.cc/logos/fantom-ftm-logo.png", // Fantom
  42161: "https://bridge.arbitrum.io/logo.png", // Arbitrum
  10: "https://cryptologos.cc/logos/optimism-ethereum-op-logo.png", // Optimism
  100000013: "https://docs.story.foundation/img/logo.svg", // Story Protocol
}

export interface SupportedChain {
  chainId: number
  originalChainId: number
  chainName: string
  nativeCurrency?: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls?: string[]
  blockExplorerUrls?: string[]
  logoURI?: string
}

export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
  chainId: number
  isNative?: boolean
  tags?: Array<{
    name: string
    sourceUrl?: string | null
  }>
  eip2612?: boolean
}

export interface DLNOrderEstimation {
  estimation: {
    srcChainTokenIn: {
      address: string
      name: string
      symbol: string
      decimals: number
      amount: string
      chainId: number
      approximateOperatingExpense?: string
      mutatedWithOperatingExpense?: boolean
      approximateUsdValue?: number
      originApproximateUsdValue?: number
    }
    srcChainTokenOut?: {
      address: string
      name: string
      symbol: string
      decimals: number
      amount: string
      chainId: number
      maxRefundAmount?: string
      approximateUsdValue?: number
    }
    dstChainTokenOut: {
      address: string
      name: string
      symbol: string
      decimals: number
      amount: string
      chainId: number
      recommendedAmount?: string
      withoutAdditionalTakerRewardsAmount?: string
      maxTheoreticalAmount?: string
      approximateUsdValue?: number
      recommendedApproximateUsdValue?: number
      maxTheoreticalApproximateUsdValue?: number
      withoutAdditionalTakerRewardsApproximateUsdValue?: number
    }
    recommendedSlippage?: number
    costsDetails?: Array<{
      chain: string
      tokenIn: string
      tokenOut: string
      amountIn: string
      amountOut: string
      type: string
      payload?: {
        feeAmount?: string
        feeBps?: string
        amountOutBeforeCorrection?: string
        estimatedVolatilityBps?: string
        actualFeeAmount?: string
        actualFeeBps?: string
        subsidyAmount?: string
        feeApproximateUsdValue?: string
      }
    }>
  }
  tx?: {
    to: string
    data: string
    value: string
    gasLimit?: number
  }
  orderId?: string
  prependedOperatingExpenseCost?: string
  order?: {
    approximateFulfillmentDelay?: number
    salt?: number
    metadata?: string
  }
  fixFee?: string
  userPoints?: number
  integratorPoints?: number
  actualUserPoints?: number
  actualIntegratorPoints?: number
  estimatedTransactionFee?: {
    total?: string
    details?: {
      giveOrderState?: string
      giveOrderWallet?: string
      nonceMaster?: string
      txFee?: string
      priorityFee?: string
      gasLimit?: string
      gasPrice?: string
      baseFee?: string
      maxFeePerGas?: string
      maxPriorityFeePerGas?: string
    }
  }
}

export interface OrderDetails {
  orderId: string
  status: string
  externalCallState?: string
  orderStruct?: {
    makerOrderNonce: number
    makerSrc: string
    giveOffer: {
      chainId: string
      tokenAddress: string
      amount: number
    }
    receiverDst: string
    takeOffer: {
      chainId: string
      tokenAddress: string
      amount: number
    }
    givePatchAuthoritySrc: string
    orderAuthorityAddressDst: string
    allowedTakerDst: string
    allowedCancelBeneficiarySrc: string
    externalCall?: string
  }
}

export interface OrderStatus {
  orderId: string
  status: string
}

export interface ChainSwapEstimation {
  estimation: {
    tokenIn: {
      address: string
      name: string
      symbol: string
      decimals: number
      amount: string
    }
    tokenOut: {
      address: string
      name: string
      symbol: string
      decimals: number
      amount: string
      minAmount: string
    }
    slippage: number
    recommendedSlippage: number
  }
}

export interface ChainSwapTransaction {
  tokenIn: {
    address: string
    name: string
    symbol: string
    decimals: number
    amount: string
  }
  tokenOut: {
    address: string
    name: string
    symbol: string
    decimals: number
    amount: string
    minAmount: string
  }
  slippage: number
  recommendedSlippage: number
  tx: {
    to: string
    data: string
    value: string
  }
}

export interface SwapData {
  orderId: string
  fromToken: Token
  toToken: Token
  fromChain: SupportedChain
  toChain: SupportedChain
  fromAmount: string
  toAmount: string
  rate: string
  fees: {
    protocolFee: string
    solverFee: string
    totalFee: string
  }
  timestamp: number
  status: "pending" | "completed" | "failed"
  txHash?: string
  orderDetails?: OrderDetails
  estimation?: DLNOrderEstimation
}

export interface CancelTransaction {
  to: string
  data: string
  value: string
  chainId: number
  from: string
  cancelBeneficiary: string
}

// Story Protocol is chain ID 100000013 according to the API docs
export const STORY_CHAIN_ID = 100000013

export const debridgeApi:any = {
  async getSupportedChains(): Promise<SupportedChain[]> {
    try {
      const response = await fetch(`${DEBRIDGE_API_BASE}/supported-chains-info`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      // Map the chains and add additional info
      const chains: SupportedChain[] = data.chains.map((chain: any) => {
        const chainInfo: SupportedChain = {
          chainId: chain.chainId,
          originalChainId: chain.originalChainId,
          chainName: chain.chainName,
        }

        // Add native currency and logo info for known chains
        // First try to use our predefined logos, then fallback to existing logic
        if (CHAIN_LOGOS[chain.chainId]) {
          chainInfo.logoURI = CHAIN_LOGOS[chain.chainId]
        }

        switch (chain.chainId) {
          case 1:
            chainInfo.nativeCurrency = { name: "Ether", symbol: "ETH", decimals: 18 }
            break
          case 56:
            chainInfo.nativeCurrency = { name: "BNB", symbol: "BNB", decimals: 18 }
            break
          case 137:
            chainInfo.nativeCurrency = { name: "MATIC", symbol: "MATIC", decimals: 18 }
            break
          case 42161:
            chainInfo.nativeCurrency = { name: "Ether", symbol: "ETH", decimals: 18 }
            break
          case STORY_CHAIN_ID:
            chainInfo.nativeCurrency = { name: "IP", symbol: "IP", decimals: 18 }
            break
          case 10:
            chainInfo.nativeCurrency = { name: "Ether", symbol: "ETH", decimals: 18 }
            break
          case 8453:
            chainInfo.nativeCurrency = { name: "Ether", symbol: "ETH", decimals: 18 }
            break
          case 43114:
            chainInfo.nativeCurrency = { name: "AVAX", symbol: "AVAX", decimals: 18 }
            break
        }

        return chainInfo
      })

      return chains
    } catch (error) {
      console.error("Failed to fetch supported chains:", error)
      throw error
    }
  },

  async getTokenList(chainId: number): Promise<Token[]> {
    try {
      const response = await fetch(`${DEBRIDGE_API_BASE}/token-list?chainId=${chainId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      const tokens: Token[] = Object.values(data.tokens).map((token: any) => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoURI: token.logoURI,
        chainId: chainId,
        tags: token.tags,
        eip2612: token.eip2612,
        isNative: token.address === "0x0000000000000000000000000000000000000000",
      }))

      return tokens
    } catch (error) {
      console.error(`Failed to fetch tokens for chain ${chainId}:`, error)
      throw error
    }
  },

  async createDLNOrder(params: {
    srcChainId: number
    srcChainTokenIn: string
    srcChainTokenInAmount: string
    dstChainId: number
    dstChainTokenOut: string
    dstChainTokenOutAmount?: string
    dstChainTokenOutRecipient?: string
    senderAddress?: string
    srcChainOrderAuthorityAddress?: string
    dstChainOrderAuthorityAddress?: string
    enableEstimate?: boolean
    additionalTakerRewardBps?: number
    srcIntermediaryTokenAddress?: string
    dstIntermediaryTokenAddress?: string
    dstIntermediaryTokenSpenderAddress?: string
    intermediaryTokenUSDPrice?: number
    srcAllowedCancelBeneficiary?: string
    referralCode?: number
    affiliateFeePercent?: number
    affiliateFeeRecipient?: string
    srcChainTokenInSenderPermit?: string
    allowedTaker?: string
    dlnHook?: string
    prependOperatingExpenses?: boolean
    metadata?: string
    ptp?: boolean
    skipSolanaRecipientValidation?: boolean
    srcChainPriorityLevel?: "normal" | "agressive"
  }): Promise<DLNOrderEstimation> {
    try {
      const searchParams = new URLSearchParams({
        srcChainId: params.srcChainId.toString(),
        srcChainTokenIn: params.srcChainTokenIn,
        srcChainTokenInAmount: params.srcChainTokenInAmount,
        dstChainId: params.dstChainId.toString(),
        dstChainTokenOut: params.dstChainTokenOut,
      })

      // Add optional parameters
      if (params.dstChainTokenOutAmount) searchParams.append("dstChainTokenOutAmount", params.dstChainTokenOutAmount)
      if (params.dstChainTokenOutRecipient)
        searchParams.append("dstChainTokenOutRecipient", params.dstChainTokenOutRecipient)
      if (params.senderAddress) searchParams.append("senderAddress", params.senderAddress)
      if (params.srcChainOrderAuthorityAddress)
        searchParams.append("srcChainOrderAuthorityAddress", params.srcChainOrderAuthorityAddress)
      if (params.dstChainOrderAuthorityAddress)
        searchParams.append("dstChainOrderAuthorityAddress", params.dstChainOrderAuthorityAddress)
      if (params.enableEstimate) searchParams.append("enableEstimate", "true")
      if (params.additionalTakerRewardBps !== undefined)
        searchParams.append("additionalTakerRewardBps", params.additionalTakerRewardBps.toString())
      if (params.srcIntermediaryTokenAddress)
        searchParams.append("srcIntermediaryTokenAddress", params.srcIntermediaryTokenAddress)
      if (params.dstIntermediaryTokenAddress)
        searchParams.append("dstIntermediaryTokenAddress", params.dstIntermediaryTokenAddress)
      if (params.dstIntermediaryTokenSpenderAddress)
        searchParams.append("dstIntermediaryTokenSpenderAddress", params.dstIntermediaryTokenSpenderAddress)
      if (params.intermediaryTokenUSDPrice !== undefined)
        searchParams.append("intermediaryTokenUSDPrice", params.intermediaryTokenUSDPrice.toString())
      if (params.srcAllowedCancelBeneficiary)
        searchParams.append("srcAllowedCancelBeneficiary", params.srcAllowedCancelBeneficiary)
      if (params.referralCode !== undefined) searchParams.append("referralCode", params.referralCode.toString())
      if (params.affiliateFeePercent !== undefined)
        searchParams.append("affiliateFeePercent", params.affiliateFeePercent.toString())
      if (params.affiliateFeeRecipient) searchParams.append("affiliateFeeRecipient", params.affiliateFeeRecipient)
      if (params.srcChainTokenInSenderPermit)
        searchParams.append("srcChainTokenInSenderPermit", params.srcChainTokenInSenderPermit)
      if (params.allowedTaker) searchParams.append("allowedTaker", params.allowedTaker)
      if (params.dlnHook) searchParams.append("dlnHook", params.dlnHook)
      if (params.prependOperatingExpenses) searchParams.append("prependOperatingExpenses", "true")
      if (params.metadata) searchParams.append("metadata", params.metadata)
      if (params.ptp) searchParams.append("ptp", "true")
      if (params.skipSolanaRecipientValidation) searchParams.append("skipSolanaRecipientValidation", "true")
      if (params.srcChainPriorityLevel) searchParams.append("srcChainPriorityLevel", params.srcChainPriorityLevel)

      const response = await fetch(`${DEBRIDGE_API_BASE}/dln/order/create-tx?${searchParams}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errorMessage || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to create DLN order:", error)
      throw error
    }
  },

  async getOrderDetails(orderId: string): Promise<OrderDetails> {
    try {
      // Validate orderId format (must be 0x followed by 64 hex characters)
      if (!/^0x[0-9a-fA-F]{64}$/.test(orderId)) {
        throw new Error("Invalid order ID format. Must be 0x followed by 64 hex characters.")
      }

      const response = await fetch(`${DEBRIDGE_API_BASE}/dln/order/${orderId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errorMessage || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to get order details:", error)
      throw error
    }
  },

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    try {
      // Validate orderId format
      if (!/^0x[0-9a-fA-F]{64}$/.test(orderId)) {
        throw new Error("Invalid order ID format. Must be 0x followed by 64 hex characters.")
      }

      const response = await fetch(`${DEBRIDGE_API_BASE}/dln/order/${orderId}/status`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errorMessage || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to get order status:", error)
      throw error
    }
  },

  async getOrderIdsByTxHash(txHash: string): Promise<string[]> {
    try {
      const response = await fetch(`${DEBRIDGE_API_BASE}/dln/tx/${txHash}/order-ids`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errorMessage || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.orderIds
    } catch (error) {
      console.error("Failed to get order IDs by tx hash:", error)
      throw error
    }
  },

  async getCancelTransaction(orderId: string): Promise<CancelTransaction> {
    try {
      // Validate orderId format
      if (!/^0x[0-9a-fA-F]{64}$/.test(orderId)) {
        throw new Error("Invalid order ID format. Must be 0x followed by 64 hex characters.")
      }

      const response = await fetch(`${DEBRIDGE_API_BASE}/dln/order/${orderId}/cancel-tx`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errorMessage || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to get cancel transaction:", error)
      throw error
    }
  },

  async getExtCallCancelTransaction(orderId: string): Promise<CancelTransaction> {
    try {
      // Validate orderId format
      if (!/^0x[0-9a-fA-F]{64}$/.test(orderId)) {
        throw new Error("Invalid order ID format. Must be 0x followed by 64 hex characters.")
      }

      const response = await fetch(`${DEBRIDGE_API_BASE}/dln/order/${orderId}/extcall-cancel-tx`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errorMessage || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to get external call cancel transaction:", error)
      throw error
    }
  },

  async estimateChainSwap(params: {
    chainId: number
    tokenIn: string
    tokenInAmount: string
    tokenOut: string
    slippage?: string
    affiliateFeePercent?: number
    affiliateFeeRecipient?: string
  }): Promise<ChainSwapEstimation> {
    try {
      const searchParams = new URLSearchParams({
        chainId: params.chainId.toString(),
        tokenIn: params.tokenIn,
        tokenInAmount: params.tokenInAmount,
        tokenOut: params.tokenOut,
      })

      if (params.slippage) searchParams.append("slippage", params.slippage)
      if (params.affiliateFeePercent !== undefined)
        searchParams.append("affiliateFeePercent", params.affiliateFeePercent.toString())
      if (params.affiliateFeeRecipient) searchParams.append("affiliateFeeRecipient", params.affiliateFeeRecipient)

      const response = await fetch(`${DEBRIDGE_API_BASE}/chain/estimation?${searchParams}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errorMessage || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to estimate chain swap:", error)
      throw error
    }
  },

  async createChainSwapTransaction(params: {
    chainId: number
    tokenIn: string
    tokenInAmount: string
    tokenOut: string
    tokenOutRecipient: string
    slippage?: string
    affiliateFeePercent?: number
    affiliateFeeRecipient?: string
    senderAddress?: string
  }): Promise<ChainSwapTransaction> {
    try {
      const searchParams = new URLSearchParams({
        chainId: params.chainId.toString(),
        tokenIn: params.tokenIn,
        tokenInAmount: params.tokenInAmount,
        tokenOut: params.tokenOut,
        tokenOutRecipient: params.tokenOutRecipient,
      })

      if (params.slippage) searchParams.append("slippage", params.slippage)
      if (params.affiliateFeePercent !== undefined)
        searchParams.append("affiliateFeePercent", params.affiliateFeePercent.toString())
      if (params.affiliateFeeRecipient) searchParams.append("affiliateFeeRecipient", params.affiliateFeeRecipient)
      if (params.senderAddress) searchParams.append("senderAddress", params.senderAddress)

      const response = await fetch(`${DEBRIDGE_API_BASE}/chain/transaction?${searchParams}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errorMessage || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to create chain swap transaction:", error)
      throw error
    }
  },

  // Helper functions
  formatAmount(amount: string, decimals: number): string {
    const num = Number.parseFloat(amount) / Math.pow(10, decimals)
    return num.toFixed(6)
  },

  parseAmount(amount: string, decimals: number): string {
    const num = Number.parseFloat(amount) * Math.pow(10, decimals)
    return Math.floor(num).toString()
  },

  // Generate a valid order ID for demo purposes
  generateOrderId(): string {
    const hex = "0123456789abcdef"
    let result = "0x"
    for (let i = 0; i < 64; i++) {
      result += hex[Math.floor(Math.random() * 16)]
    }
    return result
  },

  // Validate if chains and tokens are supported by attempting an estimation
  async validatePair(
    fromChainId: number,
    fromTokenAddress: string,
    toChainId: number,
    toTokenAddress: string,
  ): Promise<boolean> {
    try {
      // Try a small estimation to see if the pair is supported
      await this.createDLNOrder({
        srcChainId: fromChainId,
        srcChainTokenIn: fromTokenAddress,
        srcChainTokenInAmount: "1000000000000000000", // 1 token with 18 decimals
        dstChainId: toChainId,
        dstChainTokenOut: toTokenAddress,
        dstChainTokenOutAmount: "auto",
      })
      return true
    } catch (error) {
      console.error("Pair validation failed:", error)
      return false
    }
  },
}
