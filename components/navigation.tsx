"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Shield, Activity, DollarSign, CreditCard, Home, Sparkles } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useState } from "react"
import { AIFilterDialog } from "@/components/ai-filter-dialog"
import { type GeminiFilterResponse } from "@/lib/gemini-agent"

interface NavigationProps {
  onApplyAIFilter?: (filter: GeminiFilterResponse) => void
}

export function Navigation({ onApplyAIFilter }: NavigationProps) {
  const pathname = usePathname()
  const [showAIFilter, setShowAIFilter] = useState(false)

  const navItems = [
    { href: "/", label: "IP Assets", icon: Shield },
    { href: "/transactions", label: "Transactions", icon: Activity },
    { href: "/royalties", label: "Royalties", icon: DollarSign },
    { href: "/minting-fees", label: "Minting Fees", icon: CreditCard },
  ]

  const currentDataType = pathname === "/" 
    ? "ip_assets" 
    : pathname === "/transactions" 
      ? "transactions" 
      : pathname === "/royalties" 
        ? "royalties" 
        : "minting_fees"

  const handleApplyFilter = (filter: GeminiFilterResponse) => {
    if (onApplyAIFilter) {
      onApplyAIFilter(filter)
    }
  }

  return (
    <>
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-purple-400" />
              <span className="text-xl font-bold gradient-text">Story Protocol</span>
            </Link>

            <div className="flex items-center space-x-2">
              <div className="hidden md:flex space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={cn(
                          "flex items-center space-x-2",
                          isActive
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                            : "text-gray-400 hover:text-gray-200 hover:bg-gray-800",
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Button>
                    </Link>
                  )
                })}
              </div>

              {onApplyAIFilter && (
                <Button
                  onClick={() => setShowAIFilter(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Filter
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AIFilterDialog
        isOpen={showAIFilter}
        onClose={() => setShowAIFilter(false)}
        onApplyFilter={handleApplyFilter}
        dataType={currentDataType as any}
      />
    </>
  )
}
