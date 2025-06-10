"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Lightbulb, Zap, Target, ArrowRight, FileText, DollarSign, Shield, Coins } from "lucide-react"

interface TutorialCardProps {
  onSuggestionClick: (suggestion: string) => void
}

export function AITutorialCard({ onSuggestionClick }: TutorialCardProps) {
  const tutorials = [
    {
      category: "Getting Started",
      icon: <BookOpen className="h-5 w-5" />,
      color: "blue",
      items: [
        {
          title: "Create your first IP asset",
          command: "create IP asset",
          description: "Register your intellectual property",
        },
        {
          title: "Explore existing assets",
          command: "show me recent IP assets",
          description: "Browse the IP ecosystem",
        },
        {
          title: "Learn about Story Protocol",
          command: "what is Story Protocol?",
          description: "Understand the platform",
        },
      ],
    },
    {
      category: "IP Management",
      icon: <Shield className="h-5 w-5" />,
      color: "purple",
      items: [
        { title: "View asset relationships", command: "show asset relationships", description: "See IP connections" },
        { title: "Check license tokens", command: "show license tokens", description: "View licensing activity" },
        { title: "Monitor transactions", command: "show latest transactions", description: "Track IP activities" },
      ],
    },
    {
      category: "Monetization",
      icon: <DollarSign className="h-5 w-5" />,
      color: "green",
      items: [
        { title: "Track royalty payments", command: "show royalty payments", description: "Monitor earnings" },
        { title: "View minting fees", command: "show minting fees", description: "See fee structure" },
        { title: "Learn about licensing", command: "benefits of IP licensing", description: "Understand monetization" },
      ],
    },
    {
      category: "Cross-Chain",
      icon: <Coins className="h-5 w-5" />,
      color: "orange",
      items: [
        { title: "Supported networks", command: "show supported chains", description: "View available chains" },
        { title: "Bridge tokens", command: "bridge tokens cross-chain", description: "Move assets between chains" },
        {
          title: "Learn about bridging",
          command: "explain cross-chain bridging",
          description: "Understand interoperability",
        },
      ],
    },
  ]

  const quickActions = [
    { label: "Create IP Asset", command: "create IP asset", icon: <FileText className="h-4 w-4" /> },
    { label: "View Assets", command: "show me recent IP assets", icon: <Shield className="h-4 w-4" /> },
    { label: "Check Royalties", command: "show royalty payments", icon: <DollarSign className="h-4 w-4" /> },
    { label: "Bridge Tokens", command: "bridge tokens", icon: <Coins className="h-4 w-4" /> },
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "border-blue-500/30 bg-blue-500/10",
      purple: "border-purple-500/30 bg-purple-500/10",
      green: "border-green-500/30 bg-green-500/10",
      orange: "border-orange-500/30 bg-orange-500/10",
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <Card className="w-full bg-black/40 border-white/20 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-400" />
          AI Assistant Guide
        </CardTitle>
        <p className="text-white/60 text-sm">
          Get started with Story Protocol and DeBridge. Click any suggestion to try it!
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Actions */}
        <div>
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-400" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => onSuggestionClick(action.command)}
                className="justify-start border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
              >
                {action.icon}
                <span className="ml-2 truncate">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Tutorial Categories */}
        <div className="space-y-4">
          {tutorials.map((category, categoryIdx) => (
            <div key={categoryIdx} className={`p-4 rounded-lg border ${getColorClasses(category.color)}`}>
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                {category.icon}
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                    onClick={() => onSuggestionClick(item.command)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.title}</p>
                      <p className="text-white/60 text-xs truncate">{item.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white/80 transition-colors flex-shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pro Tips */}
        <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-yellow-400" />
            Pro Tips
          </h3>
          <div className="space-y-2 text-sm text-white/80">
            <p>• Use specific asset IDs like "IP asset 0x123..." for detailed views</p>
            <p>• Ask about "transaction hash 0xabc..." to get transaction details</p>
            <p>• Try educational queries like "how do royalties work?"</p>
            <p>• Use natural language - I understand context and intent!</p>
          </div>
        </div>

        {/* Current Features Badge */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-green-500/50 text-green-400">
            ✓ IP Asset Creation
          </Badge>
          <Badge variant="outline" className="border-blue-500/50 text-blue-400">
            ✓ Cross-Chain Swaps
          </Badge>
          <Badge variant="outline" className="border-purple-500/50 text-purple-400">
            ✓ Royalty Tracking
          </Badge>
          <Badge variant="outline" className="border-orange-500/50 text-orange-400">
            ✓ Educational Content
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
