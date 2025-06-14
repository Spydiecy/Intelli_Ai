import { apiQueue } from "./queue-manager"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.storyapis.com"
const API_KEY = process.env.NEXT_PUBLIC_STORY_API_KEY || ""
const CHAIN = process.env.NEXT_PUBLIC_STORY_CHAIN || "story-aeneid"

const headers = {
  "X-Api-Key": API_KEY,
  "X-Chain": CHAIN,
  "Content-Type": "application/json",
}

// Enhanced API call wrapper with better error handling
async function makeAPICall(url: string, options: RequestInit = {}): Promise<any> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

  try {
    console.log(`Making API call to: ${url}`)

    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log(`API response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API error response: ${errorText}`)

      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please wait and try again.")
      } else if (response.status === 401) {
        throw new Error("API authentication failed. Please check your API key.")
      } else if (response.status === 404) {
        throw new Error("API endpoint not found.")
      } else {
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }
    }

    const data = await response.json()
    console.log(`API call successful, data length: ${data?.data?.length || 0}`)
    return data
  } catch (error: any) {
    clearTimeout(timeoutId)

    if (error.name === "AbortError") {
      throw new Error("API request timed out")
    }

    console.error(`API call failed: ${error.message}`)
    throw error
  }
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

export interface LicenseMintingFeePaid {
  amount: string
  blockNumber: string
  blockTimestamp: string
  id: string
  payer: string
  receiverIpId: string
  token: string
}

export const enhancedApi = {
  async listIPAssets(options: any = {}) {
    return apiQueue.addToQueue(async () => {
      const response = await makeAPICall(`${API_BASE_URL}/api/v3/assets`, {
        method: "POST",
        body: JSON.stringify({
          options: {
            orderBy: "blockNumber",
            orderDirection: "desc",
            pagination: { limit: 20, offset: 0 },
            ...options,
          },
        }),
      })
      return response
    })
  },

  async getIPAsset(assetId: string) {
    return apiQueue.addToQueue(async () => {
      const response = await makeAPICall(`${API_BASE_URL}/api/v3/assets/${assetId}`, {
        method: "GET",
      })
      return response
    })
  },

  async getIPLicenseTerms(ipId: string) {
    return apiQueue.addToQueue(async () => {
      const response = await makeAPICall(`${API_BASE_URL}/api/v3/licenses/ip/terms/${ipId}`, {
        method: "GET",
      })
      return response
    })
  },

  async listTransactions(options: any = {}) {
    return apiQueue.addToQueue(async () => {
      const response = await makeAPICall(`${API_BASE_URL}/api/v3/transactions`, {
        method: "POST",
        body: JSON.stringify({
          options: {
            orderBy: "blockNumber",
            orderDirection: "desc",
            pagination: { limit: 20, offset: 0 },
            ...options,
          },
        }),
      })
      return response
    })
  },

  async listLatestTransactions(options: any = {}) {
    return apiQueue.addToQueue(async () => {
      const response = await makeAPICall(`${API_BASE_URL}/api/v3/transactions/latest`, {
        method: "POST",
        body: JSON.stringify({
          options: {
            orderBy: "blockNumber",
            orderDirection: "desc",
            pagination: { limit: 20, offset: 0 },
            ...options,
          },
        }),
      })
      return response
    })
  },

  async listRoyaltyPays(options: any = {}) {
    return apiQueue.addToQueue(async () => {
      const response = await makeAPICall(`${API_BASE_URL}/api/v3/royalties/payments`, {
        method: "POST",
        body: JSON.stringify({
          options: {
            orderBy: "blockNumber",
            orderDirection: "desc",
            pagination: { limit: 20, offset: 0 },
            ...options,
          },
        }),
      })
      return response
    })
  },

  async listLicenseMintingFees(options: any = {}) {
    return apiQueue.addToQueue(async () => {
      const response = await makeAPICall(`${API_BASE_URL}/api/v3/licenses/mintingfees`, {
        method: "POST",
        body: JSON.stringify({
          options: {
            orderBy: "blockNumber",
            orderDirection: "desc",
            pagination: { limit: 20, offset: 0 },
            ...options,
          },
        }),
      })
      return response
    })
  },

  async testConnection() {
    return apiQueue.addToQueue(async () => {
      const response = await makeAPICall(`${API_BASE_URL}/api/v3/assets`, {
        method: "POST",
        body: JSON.stringify({
          options: {
            pagination: { limit: 1, offset: 0 },
          },
        }),
      })
      return response
    })
  },
}
