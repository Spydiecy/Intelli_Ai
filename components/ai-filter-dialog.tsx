"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Sparkles, Search, X } from 'lucide-react'
import { geminiAgent, type GeminiFilterResponse } from "@/lib/gemini-agent"

interface AIFilterDialogProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilter: (filter: GeminiFilterResponse) => void
  dataType: "ip_assets" | "transactions" | "royalties" | "minting_fees"
}

export function AIFilterDialog({ isOpen, onClose, onApplyFilter, dataType }: AIFilterDialogProps) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFilter = async () => {
    if (!query.trim()) return

    try {
      setLoading(true)
      setError(null)
      const response = await geminiAgent(query)
      onApplyFilter(response)
      onClose()
    } catch (err) {
      console.error("Error filtering with AI:", err)
      setError("Failed to process your request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const placeholderText = {
    ip_assets: "Find IP assets with more than 5 children...",
    transactions: "Show me transactions related to licensing...",
    royalties: "Find royalty payments above 1000 tokens...",
    minting_fees: "Show minting fees paid in the last month...",
  }[dataType]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Filter Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-gray-300 text-sm">
            Describe what you're looking for in natural language, and our AI will create filters to find it.
          </div>

          <div className="relative">
            <Input
              placeholder={placeholderText}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 pr-10"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleFilter()
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-gray-800">
            Cancel
          </Button>
          <Button
            onClick={handleFilter}
            disabled={loading || !query.trim()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            {loading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            {loading ? "Processing..." : "Apply Filter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
