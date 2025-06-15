"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Upload,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Wallet,
  Key,
  Eye,
  EyeOff,
  Info,
  Shield,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/contexts/WalletContext"

import {
  createIPAsset,
  validateEnvironmentVariables,
  getWalletAddress,
  validatePrivateKey,
  type CreateIPAssetParams,
  type CreateIPAssetResult,
} from "@/lib/create-story-asset"

interface CreateIPAssetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateIPAssetModal({ isOpen, onClose, onSuccess }: CreateIPAssetModalProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [createdAsset, setCreatedAsset] = useState<CreateIPAssetResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [envValidation, setEnvValidation] = useState<{ isValid: boolean; errors: string[]; hasDummyKey: boolean }>({
    isValid: true,
    errors: [],
    hasDummyKey: false,
  })
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [customPrivateKey, setCustomPrivateKey] = useState<string>("")
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [usingCustomWallet, setUsingCustomWallet] = useState(false)

  // Get wallet context
  const { connected, publicKey, openConnectModal } = useWallet()

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    nftName: "",
    nftDescription: "",
    creatorName: "",
    creatorAddress: "",
    creatorDescription: "",
    twitterUrl: "",
    websiteUrl: "",
  })

  // Validate environment variables on mount
  useEffect(() => {
    const validation = validateEnvironmentVariables()
    setEnvValidation(validation)

    if (validation.isValid || validation.hasDummyKey) {
      const address = getWalletAddress()
      setWalletAddress(address)
      // Auto-fill creator address if available
      if (address && !formData.creatorAddress) {
        setFormData((prev) => ({ ...prev, creatorAddress: address }))
      }
    }
  }, [])

  // Update form when Tomo wallet connects/disconnects
  useEffect(() => {
    if (connected && publicKey) {
      setFormData((prev) => ({ ...prev, creatorAddress: publicKey }))
      setWalletAddress(publicKey)
      setUsingCustomWallet(false) // Prefer Tomo wallet over custom
    } else if (!connected && !customPrivateKey) {
      // Reset to default wallet if no Tomo wallet and no custom key
      const address = getWalletAddress()
      setWalletAddress(address)
      setFormData((prev) => ({ ...prev, creatorAddress: address }))
    }
  }, [connected, publicKey, customPrivateKey])

  // Update wallet address when custom private key changes
  useEffect(() => {
    if (customPrivateKey && validatePrivateKey(customPrivateKey)) {
      const address = getWalletAddress(customPrivateKey)
      setWalletAddress(address)
      setUsingCustomWallet(true)
      setFormData((prev) => ({ ...prev, creatorAddress: address }))
    } else if (!customPrivateKey && !connected) {
      const address = getWalletAddress()
      setWalletAddress(address)
      setUsingCustomWallet(false)
      setFormData((prev) => ({ ...prev, creatorAddress: address }))
    }
  }, [customPrivateKey, connected])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File too large. Please select an image smaller than 10MB")
     
        return
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Invalid file type. Please select an image file")
   
        return
      }

      setImageFile(file)
      setError(null)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview("")
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePrivateKeyChange = (value: string) => {
    setCustomPrivateKey(value)
    if (value && !validatePrivateKey(value)) {
      setError("Invalid private key format. Must be 64 hexadecimal characters.")
    } else {
      setError(null)
    }
  }

  const createIPAssetReal = async () => {
    setLoading(true)
    setError(null)

    try {
      // Validate wallet connection - prioritize Tomo wallet
      if (!connected && !customPrivateKey && !envValidation.isValid && !envValidation.hasDummyKey) {
        throw new Error("Please connect your Tomo wallet, enter a private key, or ensure environment variables are set up correctly.")
      }

      // If Tomo wallet is connected, use it
      let effectiveCreatorAddress = formData.creatorAddress
      let effectivePrivateKey: string | undefined = customPrivateKey
      let walletSource = "Environment"

      if (connected && publicKey) {
        effectiveCreatorAddress = publicKey
        effectivePrivateKey = undefined // Don't use custom key when Tomo is connected
        walletSource = "Tomo Wallet"
      } else if (customPrivateKey && validatePrivateKey(customPrivateKey)) {
        walletSource = "Custom Key"
      } else {
        throw new Error("Invalid private key format. Must be 64 hexadecimal characters.")
      }

      // Validate Pinata JWT
      if (!process.env.NEXT_PUBLIC_PINATA_JWT) {
        throw new Error("PINATA_JWT environment variable is required. Please add it to your .env.local file.")
      }

      // Prepare social media links
      const socialMedia = []
      if (formData.twitterUrl) {
        socialMedia.push({ platform: "Twitter", url: formData.twitterUrl })
      }
      if (formData.websiteUrl) {
        socialMedia.push({ platform: "Website", url: formData.websiteUrl })
      }

      // Prepare creation parameters
      const params: CreateIPAssetParams = {
        title: formData.title,
        description: formData.description,
        imageFile: imageFile || undefined,
        nftName: formData.nftName || formData.title,
        nftDescription: formData.nftDescription || formData.description,
        creatorName: formData.creatorName || "Anonymous Creator",
        creatorAddress: effectiveCreatorAddress,
        creatorDescription: formData.creatorDescription,
        socialMedia: socialMedia.length > 0 ? socialMedia : undefined,
        customPrivateKey: effectivePrivateKey || undefined, // Pass custom key only if no Tomo wallet
      }

      console.log("Creating IP Asset with params:", {
        ...params,
        customPrivateKey: effectivePrivateKey ? "[REDACTED]" : undefined, // Don't log private key
        walletSource,
        effectiveAddress: effectiveCreatorAddress
      })
      
      const result = await createIPAsset(params)
      
      // Ensure the result shows the correct wallet address used
      const enhancedResult = {
        ...result,
        walletAddress: effectiveCreatorAddress, // Use the actual connected/effective address
        walletSource
      }
      
      setCreatedAsset(enhancedResult)
      setStep(3) // Success step

    } catch (error) {
      console.error("Failed to create IP Asset:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)

  }

  const handleClose = () => {
    setStep(1)
    setFormData({
      title: "",
      description: "",
      nftName: "",
      nftDescription: "",
      creatorName: "",
      creatorAddress: walletAddress, // Keep wallet address
      creatorDescription: "",
      twitterUrl: "",
      websiteUrl: "",
    })
    setImageFile(null)
    setImagePreview("")
    setCreatedAsset(null)
    setError(null)
    setCustomPrivateKey("")
    setShowPrivateKey(false)
    onClose()
  }

  const handleSuccess = () => {
    handleClose()
    onSuccess()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black/95 border-white/20 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {step === 1 && "Create IP Asset - Basic Information"}
            {step === 2 && "Create IP Asset - Review & Create"}
            {step === 3 && "IP Asset Created Successfully!"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            {/* Custom Wallet Private Key Input */}
            <div className="bg-black/50 border border-white/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <Key className="h-5 w-5 text-white/60" />
                <h3 className="text-white font-medium">Wallet Configuration</h3>
              </div>

              <div className="space-y-3">
                {/* Tomo Wallet Status */}
                {connected && publicKey ? (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium text-green-400">Tomo Wallet Connected</span>
                      <Badge className="bg-green-600/20 text-green-300 border-green-500/30">Primary</Badge>
                    </div>
                    <p className="text-xs text-green-300">Address: {publicKey}</p>
                    <p className="text-xs text-green-300/80 mt-1">This address will be used for asset creation.</p>
                  </div>
                ) : (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm font-medium text-yellow-400">Tomo Wallet Not Connected</span>
                      </div>
                      <Button
                        onClick={openConnectModal}
                        size="sm"
                        className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border border-yellow-500/30"
                      >
                        <Wallet className="h-4 w-4 mr-2" />
                        Connect Wallet
                      </Button>
                    </div>
                    <p className="text-xs text-yellow-300/80 mt-2">
                      Connect your Tomo wallet for secure asset creation, or use a custom private key below.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-white">Custom Private Key (Optional)</Label>
                  <div className="relative">
                    <Input
                      type={showPrivateKey ? "text" : "password"}
                      value={customPrivateKey}
                      onChange={(e) => handlePrivateKeyChange(e.target.value)}
                      placeholder="Enter your wallet private key (64 hex characters)"
                      className="bg-black/50 border-white/20 text-white pr-10 placeholder:text-white/40"
                      disabled={Boolean(connected && publicKey)} // Disable if Tomo wallet is connected
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      disabled={Boolean(connected && publicKey)}
                    >
                      {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-white/60">
                    {connected && publicKey 
                      ? "Tomo wallet takes precedence over custom key"
                      : `Leave blank to use ${envValidation.hasDummyKey ? "dummy wallet" : "environment wallet"}`
                    }
                  </p>
                </div>

                {/* Custom Wallet Status */}
                {!connected && customPrivateKey && walletAddress && (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-400">Using Custom Wallet</span>
                    </div>
                    <p className="text-xs text-blue-300">Address: {walletAddress}</p>
                  </div>
                )}

                {/* Default Wallet Status */}
                {!connected && !customPrivateKey && walletAddress && (
                  <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-4 w-4 text-white/60" />
                      <span className="text-sm font-medium text-white/80">
                        {envValidation.hasDummyKey ? "Using Dummy Wallet" : "Using Environment Wallet"}
                      </span>
                    </div>
                    <p className="text-xs text-white/60">Address: {walletAddress}</p>
                    {envValidation.hasDummyKey && (
                      <p className="text-xs text-white/50 mt-1">This is a test wallet for demonstration purposes.</p>
                    )}
                  </div>
                )}

                {/* Environment Validation Warning */}
                {!envValidation.isValid && !envValidation.hasDummyKey && !customPrivateKey && !connected && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                      <div>
                        <h4 className="text-red-400 font-medium text-sm">Wallet Setup Required</h4>
                        <p className="text-red-300 text-xs mt-1">
                          Please connect your Tomo wallet, enter a custom private key, or set up environment variables.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-white">Asset Image</Label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center backdrop-blur-sm">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="max-w-full h-48 object-cover mx-auto rounded-lg"
                    />
                    <Button variant="destructive" size="sm" className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 backdrop-blur-sm" onClick={removeImage}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60 mb-2">Upload your IP asset image (Max 10MB)</p>
                    <Input
                      type="file"
                      
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label
                      htmlFor="image-upload"
                      className="cursor-pointer bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg inline-block border border-white/20 backdrop-blur-sm transition-colors"
                    >
                      Choose Image
                    </Label>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">IP Asset Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter asset title"
                  className="bg-black/50 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">NFT Name</Label>
                <Input
                  value={formData.nftName}
                  onChange={(e) => handleInputChange("nftName", e.target.value)}
                  placeholder="NFT ownership name"
                  className="bg-black/50 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e: any) => handleInputChange("description", e.target.value)}
                placeholder="Describe your IP asset"
                className="bg-black/50 border-white/20 text-white placeholder:text-white/40 min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">NFT Description</Label>
              <Textarea
                value={formData.nftDescription}
                onChange={(e: any) => handleInputChange("nftDescription", e.target.value)}
                placeholder="Description for the ownership NFT"
                className="bg-black/50 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            {/* Creator Information */}
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Creator Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Creator Name</Label>
                  <Input
                    value={formData.creatorName}
                    onChange={(e) => handleInputChange("creatorName", e.target.value)}
                    placeholder="Your name or organization"
                    className="bg-black/50 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Creator Address</Label>
                  <Input
                    value={formData.creatorAddress}
                    onChange={(e) => handleInputChange("creatorAddress", e.target.value)}
                    placeholder="0x..."
                    className="bg-black/50 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label className="text-white">Creator Description</Label>
                <Input
                  value={formData.creatorDescription}
                  onChange={(e) => handleInputChange("creatorDescription", e.target.value)}
                  placeholder="Brief description about the creator"
                  className="bg-black/50 border-white/20 text-white placeholder:text-white/40"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-white">Twitter URL</Label>
                  <Input
                    value={formData.twitterUrl}
                    onChange={(e) => handleInputChange("twitterUrl", e.target.value)}
                    placeholder="https://twitter.com/username"
                    className="bg-black/50 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Website URL</Label>
                  <Input
                    value={formData.websiteUrl}
                    onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="bg-black/50 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div>
                    <h4 className="text-red-400 font-medium">Error</h4>
                    <p className="text-red-300 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose} className="border-white/20 text-white/80 hover:bg-white/10">
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={Boolean(
                  !formData.title ||
                  !formData.description ||
                  (!connected && !customPrivateKey && !envValidation.isValid && !envValidation.hasDummyKey) ||
                  (customPrivateKey && !validatePrivateKey(customPrivateKey))
                )}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(!connected && !customPrivateKey && !envValidation.isValid && !envValidation.hasDummyKey) 
                  ? "Connect Wallet to Continue" 
                  : "Next: Review"
                }
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Card className="bg-black/50 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Review Your IP Asset</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {imagePreview && (
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Asset preview"
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <div className="space-y-2">
                      <div>
                        <span className="text-white/60">Title: </span>
                        <span className="text-white">{formData.title}</span>
                      </div>
                      <div>
                        <span className="text-white/60">NFT Name: </span>
                        <span className="text-white">{formData.nftName || formData.title}</span>
                      </div>
                      <div>
                        <span className="text-white/60">Creator: </span>
                        <span className="text-white">{formData.creatorName || "Anonymous"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-white font-medium mb-2">Description</h4>
                      <p className="text-white/70 text-sm">{formData.description}</p>
                    </div>

                    {formData.creatorDescription && (
                      <div>
                        <h4 className="text-white font-medium mb-2">Creator Info</h4>
                        <p className="text-white/70 text-sm">{formData.creatorDescription}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {formData.twitterUrl && (
                        <Badge variant="outline" className="border-white/30 text-white/80">
                          Twitter
                        </Badge>
                      )}
                      {formData.websiteUrl && (
                        <Badge variant="outline" className="border-white/30 text-white/80">
                          Website
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Mode Indicator */}
            <div
              className={`${usingCustomWallet ? "bg-green-900/20 border-green-800" : "bg-blue-900/20 border-blue-800"} border rounded-lg p-4`}
            >
              <div className="flex items-start gap-2">
                <Key className={`h-5 w-5 ${usingCustomWallet ? "text-green-400" : "text-blue-400"} mt-0.5`} />
                <div>
                  <h4 className={`${usingCustomWallet ? "text-green-400" : "text-blue-400"} font-medium`}>
                    {usingCustomWallet
                      ? "Using Custom Wallet"
                      : envValidation.hasDummyKey
                        ? "Using Dummy Wallet"
                        : "Using Environment Wallet"}
                  </h4>
                  <p className={`${usingCustomWallet ? "text-green-300" : "text-blue-300"} text-sm mt-1`}>
                    {usingCustomWallet
                      ? "Your IP asset will be created with your provided wallet. Real transaction fees will apply."
                      : envValidation.hasDummyKey
                        ? "Your IP asset will be created with a test wallet for demonstration purposes."
                        : "Your IP asset will be created with the environment wallet."}
                  </p>
                  <p className={`${usingCustomWallet ? "text-green-300" : "text-blue-300"} text-xs mt-1`}>
                    Wallet: {walletAddress}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div>
                    <h4 className="text-red-400 font-medium">Error</h4>
                    <p className="text-red-300 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="text-yellow-400 font-medium">Important Notes</h4>
                  <ul className="text-yellow-300 text-sm mt-2 space-y-1">
                    <li>• This will create a real NFT and register it as an IP Asset on Story Protocol</li>
                    <li>• Your image and metadata will be uploaded to IPFS</li>
                    {usingCustomWallet && <li>• Real blockchain transaction fees will apply</li>}
                    {usingCustomWallet && <li>• Make sure you have sufficient testnet funds in your wallet</li>}
                    <li>• Once created, the IP Asset cannot be deleted</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="border-white/20 text-white/80 hover:bg-white/10">
                Back
              </Button>
              <Button
                onClick={createIPAssetReal}
                disabled={loading || (!connected && !customPrivateKey && !envValidation.isValid && !envValidation.hasDummyKey)}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating IP Asset...
                  </>
                ) : (!connected && !customPrivateKey && !envValidation.isValid && !envValidation.hasDummyKey) ? (
                  "Connect Wallet to Create"
                ) : (
                  "Create IP Asset"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && createdAsset && (
          <div className="space-y-6">
            {/* Success Header */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">IP Asset Created Successfully!</h3>
              <p className="text-white/60">Your IP has been registered on Story Protocol</p>
              <Badge
                className={`mt-3 ${
                  createdAsset.walletSource === "Tomo Wallet" 
                    ? "bg-green-600/20 text-green-300 border-green-500/30"
                    : createdAsset.walletSource === "Custom Key"
                    ? "bg-blue-600/20 text-blue-300 border-blue-500/30"
                    : "bg-white/20 text-white/80 border-white/20"
                }`}
              >
                <Info className="w-3 h-3 mr-1" />
                Created with {createdAsset.walletSource === "Tomo Wallet" ? "Tomo Wallet" : 
                             createdAsset.walletSource === "Custom Key" ? "Custom Wallet" : "Environment Wallet"}
              </Badge>
            </div>

            {/* Asset Information Card */}
            <Card className="bg-black/50 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Asset Details
                </h4>
                <div className="space-y-4">
                  {/* IP Asset ID */}
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-white/60">IP Asset ID</span>
                    <div className="flex items-center gap-2 bg-black/30 p-3 rounded-lg border border-white/10">
                      <span className="text-white font-mono text-sm flex-1 break-all">{createdAsset.ipId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(createdAsset.ipId, "IP Asset ID")}
                        className="text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Transaction Hash */}
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-white/60">Transaction Hash</span>
                    <div className="flex items-center gap-2 bg-black/30 p-3 rounded-lg border border-white/10">
                      <span className="text-white font-mono text-sm flex-1 break-all">{createdAsset.txHash}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(createdAsset.txHash, "Transaction Hash")}
                        className="text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-white/60">Token ID</span>
                      <span className="text-white font-semibold">{createdAsset.tokenId}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-white/60">Wallet Used</span>
                      <div className="flex items-center gap-2 bg-black/30 p-3 rounded-lg border border-white/10">
                        <span className="text-white font-mono text-sm flex-1 break-all">{createdAsset.walletAddress}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(createdAsset.walletAddress, "Wallet Address")}
                          className="text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* NFT Contract */}
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-white/60">NFT Contract Address</span>
                    <div className="bg-black/30 p-3 rounded-lg border border-white/10">
                      <span className="text-white font-mono text-sm break-all">{createdAsset.spgNftContract}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.open(createdAsset.explorerUrl, "_blank")}
                className="border-white/20 text-white/80 hover:bg-white/10 backdrop-blur-sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </Button>
              <Button 
                onClick={handleSuccess} 
                className="bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
