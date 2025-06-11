"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, X, Database, Check } from "lucide-react"
import { useState } from "react"

interface ApiResponseModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  data: any
}

export function ApiResponseModal({ isOpen, onClose, title, data }: ApiResponseModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-4xl max-h-[85vh] bg-black/90 border-white/20 backdrop-blur-sm [&>button]:hidden">
        <DialogHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-white/60" />
              <DialogTitle className="text-white text-lg">{title}</DialogTitle>
              <Badge className="bg-white/10 text-white border-white/20 text-xs">
                JSON Response
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy JSON
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose} 
                className="text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          <ScrollArea className="h-[65vh] w-full">
            <div className="bg-black/50 border border-white/20 rounded-lg p-4 backdrop-blur-sm">
              <pre className="text-sm text-white/80 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-words">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
