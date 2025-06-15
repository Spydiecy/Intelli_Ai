"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  ChevronLeft, 
  BarChart2, 
  MessageSquare, 
  ArrowLeftRight, 
  Settings, 
  Home,
  ArrowLeft,
  Coins,
  Repeat,
  Shield
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

interface DashboardSidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function DashboardSidebar({ open, setOpen }: DashboardSidebarProps) {
  const pathname = usePathname()
  useEffect(() => {
  setOpen(false)
  }, [])
  
  const routes = [
    {
      label: "Home",
      icon: Home,
      href: "/dashboard"
    },
    {
      label: "IP Assets",
      icon: Shield,
      href: "/dashboard/ip-assets"
    },
    {
      label: "AI Chat",
      icon: MessageSquare,
      href: "/dashboard/ai-chat"
    },
    {
      label: "Bridge",
      icon: Repeat,
      href: "/dashboard/bridge"
    },
   
    {
      label: "Royalties",
      icon: BarChart2,
      href: "/dashboard/royalties"
    },
       {
      label: "Transactions",
      icon: ArrowLeftRight,
      href: "/dashboard/transactions"
    },
    {
      label: "Minting Fees",
      icon: Coins,
      href: "/dashboard/minting-fees"
    }
  ]

  return (
    <div className={cn(
      "fixed h-full bg-background/50 border-r border-white/10 transition-all duration-300 z-20 backdrop-blur-sm shadow-lg",
      open ? "w-64" : "w-16"
    )}>
      <div className="flex flex-col h-full pr-2">
        <div className="flex items-center justify-between p-5 border-b border-white/10 mr-2">
          <div className={cn("flex items-center gap-2", !open && "hidden")}>
            <span className="text-xl font-bold bg-gradient-to-b from-white to-white/70 text-transparent bg-clip-text">IntelliAI</span>
            <div className="px-2 py-0.5 bg-orange-500/20 border border-orange-500/40 rounded-full text-xs text-orange-300 font-medium">
              Beta
            </div>
          </div>
          <button 
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className={cn("h-5 w-5 text-white/70 transition-transform", !open && "rotate-180")} />
          </button>
        </div>
        
        <div className="flex-1 py-6 overflow-y-auto scrollbar-hide mr-2">
          <nav className="px-3 space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center px-3 py-3.5 text-sm rounded-lg transition-colors relative group",
                  pathname === route.href
                    ? "bg-white/10 text-white" 
                    : "text-white/60 hover:text-white hover:bg-white/5",
                  !open && "justify-center"
                )}
              >
                <route.icon className={cn(
                  "h-5 w-5",
                  pathname === route.href ? "text-white" : "text-white/60"
                )} />
                {open && <span className="ml-3">{route.label}</span>}
                {pathname === route.href && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full" />
                )}
                
                {!open && (
                  <div className="absolute left-full ml-2 rounded-md px-2 py-1 bg-black/80 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {route.label}
                  </div>
                )}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-white/10 mr-2">
          <Link href="/" className={cn(
            "flex items-center px-3 py-3 text-sm text-white/60 rounded-lg transition-all duration-200 hover:bg-white/5 cursor-pointer group relative", 
            !open && "justify-center"
          )}>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center shadow-inner">
              <ArrowLeft className="h-4 w-4 text-white/90" />
            </div>
            {open && <span className="ml-3">Back to Home</span>}
            
            {!open && (
              <div className="absolute left-full ml-2 rounded-md px-2 py-1 bg-black/80 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Back to Home
              </div>
            )}
          </Link>
        </div>
      </div>
    </div>
  )
}
