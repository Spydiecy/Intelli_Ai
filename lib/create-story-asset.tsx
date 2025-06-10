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
}

export interface CreateIPAssetResult {
  txHash: string
  ipId: string
  tokenId: string
  spgNftContract: string
  explorerUrl: string
  ipMetadataUri: string
  nftMetadataUri: string
}

// SPG NFT Contract address (public collection for testing)
const SPG_NFT_CONTRACT = "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc" as Address

// Initialize Story Protocol Client
function createStoryClient() {
  const privateKeyEnv = process.env.NEXT_PUBLIC_WALLET_PRIVATE_KEY
  
  if (!privateKeyEnv) {
    throw new Error("NEXT_PUBLIC_WALLET_PRIVATE_KEY environment variable is required")
  }

  // Clean and validate private key
  let cleanPrivateKey = privateKeyEnv.trim()
  
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

  return StoryClient.newClient(config)
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

// Main function to create IP Asset
export async function createIPAsset(params: CreateIPAssetParams): Promise<CreateIPAssetResult> {
  try {
    console.log("Starting IP Asset creation process...")

    // Initialize Story Protocol client
    const client:any = createStoryClient()
    console.log("Story Protocol client initialized")

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
          address: params.creatorAddress || "0x0000000000000000000000000000000000000000",
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
    
    const response:any = await client.ipAsset.mintAndRegisterIp({
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
    }
  } catch (error) {
    console.error("Failed to create IP Asset:", error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("private key")) {
        throw new Error("Invalid wallet private key. Please check your NEXT_PUBLIC_WALLET_PRIVATE_KEY environment variable.")
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
export function validateEnvironmentVariables(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check private key
  const privateKey = process.env.NEXT_PUBLIC_WALLET_PRIVATE_KEY
  if (!privateKey) {
    errors.push("NEXT_PUBLIC_WALLET_PRIVATE_KEY is required")
  } else {
    let cleanKey = privateKey.trim()
    if (cleanKey.startsWith('0x')) {
      cleanKey = cleanKey.slice(2)
    }
    if (cleanKey.length !== 64) {
      errors.push("NEXT_PUBLIC_WALLET_PRIVATE_KEY must be 64 hex characters (32 bytes)")
    }
    if (!/^[0-9a-fA-F]+$/.test(cleanKey)) {
      errors.push("NEXT_PUBLIC_WALLET_PRIVATE_KEY must contain only hexadecimal characters")
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
  }
}

// Get wallet address from private key
export function getWalletAddress(): string {
  try {
    const privateKeyEnv = process.env.NEXT_PUBLIC_WALLET_PRIVATE_KEY
    if (!privateKeyEnv) return ""

    let cleanPrivateKey = privateKeyEnv.trim()
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
