"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Shield, 
  Users, 
  ArrowLeftRight, 
  BarChart2, 
  MessageSquare, 
  Repeat, 
  Coins,
  Sparkles,
  TrendingUp,
  Activity
} from 'lucide-react'
import Link from "next/link"

export default function DashboardHomePage() {
  const quickActions = [
    {
      title: "IP Assets",
      description: "Explore and manage your IP assets",
      icon: Shield,
      href: "/dashboard/ip-assets",
      gradient: "from-purple-600 to-blue-600"
    },
    {
      title: "Bridge Tokens",
      description: "Cross-chain token swapping",
      icon: Repeat,
      href: "/dashboard/bridge",
      gradient: "from-green-600 to-emerald-600"
    },
    {
      title: "AI Chat",
      description: "Intelligent assistance for your assets",
      icon: MessageSquare,
      href: "/dashboard/ai-chat",
      gradient: "from-blue-600 to-purple-600"
    },
    {
      title: "Transactions",
      description: "View your transaction history",
      icon: ArrowLeftRight,
      href: "/dashboard/transactions",
      gradient: "from-orange-600 to-red-600"
    }
  ]

  const stats = [
    {
      title: "Total Assets",
      value: "24",
      change: "+12%",
      icon: Shield,
      color: "text-purple-400"
    },
    {
      title: "Active Licenses",
      value: "18",
      change: "+8%",
      icon: Users,
      color: "text-blue-400"
    },
    {
      title: "Revenue",
      value: "$12.4K",
      change: "+23%",
      icon: TrendingUp,
      color: "text-green-400"
    },
    {
      title: "Activity",
      value: "156",
      change: "+5%",
      icon: Activity,
      color: "text-orange-400"
    }
  ]

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black/95 border-b border-white/10 backdrop-blur-sm text-white">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center mb-6">
              <Sparkles className="w-10 h-10 text-blue-400 mr-4" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Welcome to Astra IP
                </h1>
                <p className="text-lg text-white/70 mt-2">
                  Your intellectual property management dashboard
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {stats.map((stat, index) => (
            <Card key={stat.title} className="bg-black/50 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  <span className="text-green-400 text-sm font-medium">{stat.change}</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-white/60">{stat.title}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.5 }}
                whileHover={{ scale: 1.02 }}
              >
                <Link href={action.href}>
                  <Card className="bg-black/50 border border-white/20 hover:border-purple-500/50 transition-all duration-300 backdrop-blur-sm cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          <action.icon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                          {action.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <Card className="bg-black/50 border-white/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white/80 mb-2">No Recent Activity</h3>
                <p className="text-white/60 mb-6">Start by exploring your IP assets or creating new ones</p>
                <Link href="/dashboard/ip-assets">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white backdrop-blur-sm">
                    <Shield className="w-4 h-4 mr-2" />
                    Explore IP Assets
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
