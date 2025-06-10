"use client"

import { http } from "viem"
import { privateKeyToAccount, type Address } from "viem/accounts"
import { StoryClient, type StoryConfig, type IpMetadata } from "@story-protocol/core-sdk"
import { PinataSDK } from "pinata-web3"
import { createHash } from "crypto"

// Types
export interface CreateIPAssetParams {
  title: string
  description: string
  imageFile?: File
  nftName?: string
  nftDescription?: string
  creatorName?: string
  creatorAddress?: string
  creatorDescription?: string
  socialMedia?: Array<{
    platform: string
    url: string
  }>
  customPrivateKey?: string // New field for custom private key
}

export interface CreateIPAssetResult {
  txHash: string
  ipId: string
  tokenId: string
  spgNftContract: string
  explorerUrl: string
  ipMetadataUri: string
  nftMetadataUri: string
  walletAddress: string
  usingCustomWallet: boolean
}

// SPG NFT Contract address (public collection for testing)
const SPG_NFT_CONTRACT = "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc" as Address

// Initialize Story Protocol Client with custom or environment private key
function createStoryClient(customPrivateKey?: string) {
  let privateKeyToUse: string

  if (customPrivateKey) {
    // Use custom private key provided by user
    privateKeyToUse = customPrivateKey
  } else {
    // Fall back to environment variable
    const privateKeyEnv = process.env.NEXT_PUBLIC_WALLET_PRIVATE_KEY || process.env.NEXT_PUBLIC_DUMMY_WALLET_KEY
    
    if (!privateKeyEnv) {
      throw new Error("No private key available. Please provide a custom private key or set NEXT_PUBLIC_WALLET_PRIVATE_KEY or NEXT_PUBLIC_DUMMY_WALLET_KEY environment variable.")
    }
    privateKeyToUse = privateKeyEnv
  }

  // Clean and validate private key
  let cleanPrivateKey = privateKeyToUse.trim()
  
  // Remove 0x prefix if present
  if (cleanPrivateKey.startsWith('0x')) {
    cleanPrivateKey = cleanPrivateKey.slice(2)
  }
  
  // Validate hex string length (64 characters for 32 bytes)
  if (cleanPrivateKey.length !== 64) {
    throw new Error(`Invalid private key length. Expected 64 hex characters, got ${cleanPrivateKey.length}`)
  }
  
  // Validate hex characters
  if (!/^[0-9a-fA-F]+$/.test(cleanPrivateKey)) {
    throw new Error("Private key must contain only hexadecimal characters")
  }

  const privateKey = `0x${cleanPrivateKey}` as Address
  const account = privateKeyToAccount(privateKey)

  const config: StoryConfig = {
    account: account,
    transport: http("https://aeneid.storyrpc.io"),
    chainId: "aeneid",
  }

  return { client: StoryClient.newClient(config), account }
}

// Initialize Pinata client
function createPinataClient() {
  const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT
  
  if (!pinataJwt) {
    throw new Error("NEXT_PUBLIC_PINATA_JWT environment variable is required")
  }

  return new PinataSDK({
    pinataJwt: pinataJwt,
  })
}

// Upload JSON to IPFS
async function uploadJSONToIPFS(jsonMetadata: any): Promise<{ ipfsUrl: string; contentHash: string }> {
  const pinata = createPinataClient()
  
  try {
    const { IpfsHash } = await pinata.upload.json(jsonMetadata)
    const contentHash = createHash("sha256")
      .update(JSON.stringify(jsonMetadata))
      .digest("hex")
    
    return {
      ipfsUrl: `https://ipfs.io/ipfs/${IpfsHash}`,
      contentHash: `0x${contentHash}`,
    }
  } catch (error) {
    console.error("Failed to upload JSON to IPFS:", error)
    throw new Error(`IPFS upload failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Upload image to IPFS
async function uploadImageToIPFS(imageFile: File): Promise<{ ipfsUrl: string; contentHash: string }> {
  const pinata = createPinataClient()
  
  try {
    const { IpfsHash } = await pinata.upload.file(imageFile)
    
    // Create hash from file buffer
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentHash = createHash("sha256").update(buffer).digest("hex")
    
    return {
      ipfsUrl: `https://ipfs.io/ipfs/${IpfsHash}`,
      contentHash: `0x${contentHash}`,
    }
  } catch (error) {
    console.error("Failed to upload image to IPFS:", error)
    throw new Error(`Image upload failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Validate private key format
export function validatePrivateKey(key: string): boolean {
  if (!key) return false
  
  // Remove 0x prefix if present
  const cleanKey = key.startsWith('0x') ? key.slice(2) : key
  
  // Check if it's a valid hex string of correct length (64 characters = 32 bytes)
  const hexRegex = /^[0-9a-fA-F]{64}$/
  return hexRegex.test(cleanKey)
}

// Main function to create IP Asset
export async function createIPAsset(params: CreateIPAssetParams): Promise<CreateIPAssetResult> {
  try {
    console.log("Starting IP Asset creation process...")

    // Determine if using custom wallet
    const usingCustomWallet = !!params.customPrivateKey

    // Initialize Story Protocol client with custom or environment key
    const { client, account }:any = createStoryClient(params.customPrivateKey)
    console.log("Story Protocol client initialized")
    console.log("Using wallet address:", account.address)
    console.log("Using custom wallet:", usingCustomWallet)

    let imageUploadResult: { ipfsUrl: string; contentHash: string } | null = null

    // Step 1: Upload image to IPFS if provided
    if (params.imageFile) {
      console.log("Uploading image to IPFS...")
      imageUploadResult = await uploadImageToIPFS(params.imageFile)
      console.log("Image uploaded successfully:", imageUploadResult.ipfsUrl)
    }

    // Step 2: Create IP Metadata
    const ipMetadata: any = {
      title: params.title,
      description: params.description,
      image: imageUploadResult?.ipfsUrl || "",
      imageHash: imageUploadResult?.contentHash || "",
      mediaUrl: imageUploadResult?.ipfsUrl || "",
      mediaHash: imageUploadResult?.contentHash || "",
      mediaType: params.imageFile?.type || "image/png",
      creators: [
        {
          name: params.creatorName || "Anonymous Creator",
          address: params.creatorAddress || account.address,
          description: params.creatorDescription || "IP Asset Creator",
          contributionPercent: 100,
          socialMedia: params.socialMedia || [],
        },
      ],
    }

    // Step 3: Create NFT Metadata (ERC-721 standard)
    const nftMetadata = {
      name: params.nftName || params.title,
      description: params.nftDescription || `Ownership NFT for: ${params.description}`,
      image: imageUploadResult?.ipfsUrl || "",
    }

    // Step 4: Upload metadata to IPFS
    console.log("Uploading IP metadata to IPFS...")
    const ipMetadataUpload = await uploadJSONToIPFS(ipMetadata)
    console.log("IP metadata uploaded:", ipMetadataUpload.ipfsUrl)

    console.log("Uploading NFT metadata to IPFS...")
    const nftMetadataUpload = await uploadJSONToIPFS(nftMetadata)
    console.log("NFT metadata uploaded:", nftMetadataUpload.ipfsUrl)

    // Step 5: Register IP Asset using Story Protocol SDK
    console.log("Registering IP Asset on Story Protocol...")
    console.log("Using SPG NFT Contract:", SPG_NFT_CONTRACT)
    
    const response: any = await client.ipAsset.mintAndRegisterIp({
      spgNftContract: SPG_NFT_CONTRACT,
      ipMetadata: {
        ipMetadataURI: ipMetadataUpload.ipfsUrl,
        ipMetadataHash: ipMetadataUpload.contentHash,
        nftMetadataURI: nftMetadataUpload.ipfsUrl,
        nftMetadataHash: nftMetadataUpload.contentHash,
      },
    })

    console.log("IP Asset created successfully!")
    console.log("Transaction Hash:", response.txHash)
    console.log("IP Asset ID:", response.ipId)
    console.log("Token ID:", response.tokenId)

    return {
      txHash: response.txHash,
      ipId: response.ipId!,
      tokenId: response.tokenId!.toString(),
      spgNftContract: SPG_NFT_CONTRACT,
      explorerUrl: `https://aeneid.explorer.story.foundation/ipa/${response.ipId}`,
      ipMetadataUri: ipMetadataUpload.ipfsUrl,
      nftMetadataUri: nftMetadataUpload.ipfsUrl,
      walletAddress: account.address,
      usingCustomWallet,
    }
  } catch (error) {
    console.error("Failed to create IP Asset:", error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("private key")) {
        throw new Error("Invalid wallet private key. Please check your private key format.")
      }
      if (error.message.includes("PINATA_JWT")) {
        throw new Error("Invalid Pinata JWT. Please check your NEXT_PUBLIC_PINATA_JWT environment variable.")
      }
      if (error.message.includes("insufficient funds")) {
        throw new Error("Insufficient funds in wallet. Please add testnet tokens to your wallet.")
      }
      throw new Error(`IP Asset creation failed: ${error.message}`)
    }
    
    throw new Error("IP Asset creation failed: Unknown error occurred")
  }
}

// Utility function to validate environment variables
export function validateEnvironmentVariables(): { isValid: boolean; errors: string[]; hasDummyKey: boolean } {
  const errors: string[] = []

  // Check if we have either a regular private key or dummy key
  const privateKey = process.env.NEXT_PUBLIC_WALLET_PRIVATE_KEY
  const dummyKey = process.env.NEXT_PUBLIC_DUMMY_WALLET_KEY
  const hasDummyKey = !!dummyKey

  if (!privateKey && !dummyKey) {
    errors.push("Either NEXT_PUBLIC_WALLET_PRIVATE_KEY or NEXT_PUBLIC_DUMMY_WALLET_KEY is required")
  } else {
    const keyToValidate = privateKey || dummyKey
    if (keyToValidate) {
      let cleanKey = keyToValidate.trim()
      if (cleanKey.startsWith('0x')) {
        cleanKey = cleanKey.slice(2)
      }
      if (cleanKey.length !== 64) {
        errors.push("Private key must be 64 hex characters (32 bytes)")
      }
      if (!/^[0-9a-fA-F]+$/.test(cleanKey)) {
        errors.push("Private key must contain only hexadecimal characters")
      }
    }
  }

  // Check Pinata JWT
  const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT
  if (!pinataJwt) {
    errors.push("NEXT_PUBLIC_PINATA_JWT is required")
  }

  return {
    isValid: errors.length === 0,
    errors,
    hasDummyKey,
  }
}

// Get wallet address from private key (environment or custom)
export function getWalletAddress(customPrivateKey?: string): string {
  try {
    let privateKeyToUse: string

    if (customPrivateKey) {
      privateKeyToUse = customPrivateKey
    } else {
      const privateKeyEnv = process.env.NEXT_PUBLIC_WALLET_PRIVATE_KEY || process.env.NEXT_PUBLIC_DUMMY_WALLET_KEY
      if (!privateKeyEnv) return ""
      privateKeyToUse = privateKeyEnv
    }

    let cleanPrivateKey = privateKeyToUse.trim()
    if (cleanPrivateKey.startsWith('0x')) {
      cleanPrivateKey = cleanPrivateKey.slice(2)
    }

    const privateKey = `0x${cleanPrivateKey}` as Address
    const account = privateKeyToAccount(privateKey)
    return account.address
  } catch (error) {
    console.error("Failed to get wallet address:", error)
    return ""
  }
}
