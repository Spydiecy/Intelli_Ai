const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.storyapis.com"
const API_KEY = process.env.NEXT_PUBLIC_STORY_API_KEY || ""
const CHAIN = process.env.NEXT_PUBLIC_STORY_CHAIN || "story-aeneid"

const headers = {
  "X-Api-Key": API_KEY,
  "X-Chain": CHAIN,
  "Content-Type": "application/json",
}

export interface IPAsset {
  ancestorCount: number
  blockNumber: string
  blockTimestamp: string
  childrenCount: number
  descendantCount: number
  id: string
  ipId: string
  isGroup: boolean
  latestArbitrationPolicy: string
  nftMetadata: {
    chainId: string
    imageUrl: string
    name: string
    tokenContract: string
    tokenId: string
    tokenUri: string
  }
  parentCount: number
  rootCount: number
  rootIpIds: string[]
  transactionHash: string
}

export interface IPLicenseTerm {
  blockNumber: string
  blockTime: string
  disabled: boolean
  id: string
  ipId: string
  licenseTemplate: string
  licenseTermsId: string
  licensingConfig: {
    commercialRevShare: number
    disabled: boolean
    expectGroupRewardPool: string
    expectMinimumGroupRewardShare: number
    hookData: string
    isSet: boolean
    licensingHook: string
    mintingFee: string
  }
}

export interface IPAssetEdge {
  blockNumber: string
  blockTime: string
  ipId: string
  licenseTemplate: string
  licenseTermsId: string
  licenseTokenId: string
  parentIpId: string
  transactionHash: string
  transactionIndex: string
}

export interface Dispute {
  arbitrationPolicy: string
  blockNumber: any
  blockTimestamp: any
  counterEvidenceHash: string
  currentTag: string
  data: string
  deletedAt: any
  disputeTimestamp: any
  evidenceHash: string
  id: any
  initiator: string
  liveness: any
  logIndex: any
  status: string
  targetIpId: string
  targetTag: string
  transactionHash: string
  umaLink: string
}

// Add these new interfaces after the existing ones
export interface Transaction {
  actionType: string
  blockNumber: string
  blockTimestamp: string
  createdAt: string
  id: string
  initiator: string
  ipId: string
  logIndex: string
  resourceId: string
  resourceType: string
  transactionIndex: string
  txHash: string
}

export interface RoyaltyPay {
  amount: string
  blockNumber: string
  blockTimestamp: string
  id: string
  payerIpId: string
  receiverIpId: string
  sender: string
  token: string
}

export interface LicenseToken {
  blockNumber: string
  blockTime: string
  burntAt: string
  id: string
  licenseTemplate: string
  licenseTermsId: string
  licensorIpId: string
  owner: string
  transferable: string
}

export interface LicenseMintingFeePaid {
  amount: string
  blockNumber: string
  blockTimestamp: string
  id: string
  payer: string
  receiverIpId: string
  token: string
}

export const api = {
  async listIPAssets(options: any = {}) {
    const response = await fetch(`${API_BASE_URL}/api/v3/assets`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        options: {
          orderBy: "blockNumber",
          orderDirection: "desc",
          pagination: { limit: 10 },
          ...options,
        },
      }),
    })
    return response.json()
  },

  async getIPAsset(assetId: string) {
    const response = await fetch(`${API_BASE_URL}/api/v3/assets/${assetId}`, {
      method: "GET",
      headers,
    })
    return response.json()
  },

  async getIPLicenseTerms(ipId: string) {
    const response = await fetch(`${API_BASE_URL}/api/v3/licenses/ip/terms/${ipId}`, {
      method: "GET",
      headers,
    })
    return response.json()
  },

  async listIPEdges(options: any = {}) {
    const response = await fetch(`${API_BASE_URL}/api/v3/assets/edges`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        options: {
          orderBy: "blockNumber",
          orderDirection: "desc",
          pagination: { limit: 50 },
          ...options,
        },
      }),
    })
    return response.json()
  },

  async getDispute(disputeId: string) {
    const response = await fetch(`${API_BASE_URL}/api/v3/disputes/${disputeId}`, {
      method: "GET",
      headers,
    })
    return response.json()
  },

  async listTransactions(options: any = {}) {
    const response = await fetch(`${API_BASE_URL}/api/v3/transactions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        options: {
          orderBy: "blockNumber",
          orderDirection: "desc",
          pagination: { limit: 50 },
          ...options,
        },
      }),
    })
    return response.json()
  },

  async listLatestTransactions(options: any = {}) {
    const response = await fetch(`${API_BASE_URL}/api/v3/transactions/latest`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        options: {
          orderBy: "blockNumber",
          orderDirection: "desc",
          pagination: { limit: 50 },
          ...options,
        },
      }),
    })
    return response.json()
  },

  async getTransaction(trxId: string) {
    const response = await fetch(`${API_BASE_URL}/api/v3/transactions/${trxId}`, {
      method: "GET",
      headers,
    })
    return response.json()
  },

  async listRoyaltyPays(options: any = {}) {
    const response = await fetch(`${API_BASE_URL}/api/v3/royalties/payments`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        options: {
          orderBy: "blockNumber",
          orderDirection: "desc",
          pagination: { limit: 50 },
          ...options,
        },
      }),
    })
    return response.json()
  },

  async getRoyaltyPay(royaltyPayId: string) {
    const response = await fetch(`${API_BASE_URL}/api/v3/royalties/payments/${royaltyPayId}`, {
      method: "GET",
      headers,
    })
    return response.json()
  },

  async listLicenseTokens(options: any = {}) {
    const response = await fetch(`${API_BASE_URL}/api/v3/licenses/tokens`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        options: {
          orderBy: "blockNumber",
          orderDirection: "desc",
          pagination: { limit: 50 },
          ...options,
        },
      }),
    })
    return response.json()
  },

  async listLicenseMintingFees(options: any = {}) {
    const response = await fetch(`${API_BASE_URL}/api/v3/licenses/mintingfees`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        options: {
          orderBy: "blockNumber",
          orderDirection: "desc",
          pagination: { limit: 50 },
          ...options,
        },
      }),
    })
    return response.json()
  },

  async getLicenseMintingFee(licenseMintingFeePaidId: string) {
    const response = await fetch(`${API_BASE_URL}/api/v3/licenses/mintingfees/${licenseMintingFeePaidId}`, {
      method: "GET",
      headers,
    })
    return response.json()
  },
}
