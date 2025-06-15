import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { createIPAsset, type CreateIPAssetParams } from "@/lib/create-story-asset"
import { useToast } from "@/hooks/use-toast"

interface CreateAssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssetCreated: (result: any) => void
}

export function CreateAssetDialog({ open, onOpenChange, onAssetCreated }: CreateAssetDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    creatorName: "",
    nftName: "",
    nftDescription: "",
    customPrivateKey: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the title and description.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const params: CreateIPAssetParams = {
        title: formData.title,
        description: formData.description,
        creatorName: formData.creatorName || "Anonymous Creator",
        nftName: formData.nftName || formData.title,
        nftDescription: formData.nftDescription || formData.description,
        imageFile: imageFile || undefined,
        customPrivateKey: formData.customPrivateKey || undefined,
      }

      const result = await createIPAsset(params)
      
      toast({
        title: "IP Asset Created Successfully!",
        description: `Your IP asset "${formData.title}" has been registered on Story Protocol.`,
      })

      onAssetCreated(result)
      onOpenChange(false)
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        creatorName: "",
        nftName: "",
        nftDescription: "",
        customPrivateKey: "",
      })
      setImageFile(null)
    } catch (error: any) {
      console.error("Create asset error:", error)
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create IP asset. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Create New IP Asset</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Asset Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter your IP asset title..."
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your IP asset..."
              className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Creator Name</label>
            <Input
              value={formData.creatorName}
              onChange={(e) => setFormData(prev => ({ ...prev, creatorName: e.target.value }))}
              placeholder="Your name or creator name..."
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Image (Optional)</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">NFT Name (Optional)</label>
            <Input
              value={formData.nftName}
              onChange={(e) => setFormData(prev => ({ ...prev, nftName: e.target.value }))}
              placeholder="NFT name (defaults to asset title)..."
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Custom Private Key (Optional)</label>
            <Input
              type="password"
              value={formData.customPrivateKey}
              onChange={(e) => setFormData(prev => ({ ...prev, customPrivateKey: e.target.value }))}
              placeholder="Enter your private key or leave empty to use default..."
              className="bg-gray-800 border-gray-600 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">
              If not provided, the default environment wallet will be used.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create IP Asset"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
