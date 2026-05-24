"use client"

import { Users, Image, FolderOpen, Download, CreditCard, TrendingUp } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"

interface StatsData {
  totalUsers: number
  totalFrames: number
  totalProjects: number
  totalExports: number
  activeSubscriptions: number
  monthlyRevenue: number
}

export function StatsCards({ stats }: { stats: StatsData }) {
  const { t } = useI18n()

  const cards = [
    {
      label: t("admin.stats.users"),
      value: stats.totalUsers,
      icon: Users,
      gradient: "from-blue-500/10 to-blue-600/5",
      iconColor: "text-blue-500",
      borderColor: "border-blue-500/20",
    },
    {
      label: t("admin.stats.frames"),
      value: stats.totalFrames,
      icon: Image,
      gradient: "from-emerald-500/10 to-emerald-600/5",
      iconColor: "text-emerald-500",
      borderColor: "border-emerald-500/20",
    },
    {
      label: t("admin.stats.projects"),
      value: stats.totalProjects,
      icon: FolderOpen,
      gradient: "from-violet-500/10 to-violet-600/5",
      iconColor: "text-violet-500",
      borderColor: "border-violet-500/20",
    },
    {
      label: t("admin.stats.exports"),
      value: stats.totalExports,
      icon: Download,
      gradient: "from-amber-500/10 to-amber-600/5",
      iconColor: "text-amber-500",
      borderColor: "border-amber-500/20",
    },
    {
      label: t("admin.stats.activeSubs"),
      value: stats.activeSubscriptions,
      icon: CreditCard,
      gradient: "from-rose-500/10 to-rose-600/5",
      iconColor: "text-rose-500",
      borderColor: "border-rose-500/20",
    },
    {
      label: t("admin.stats.revenue"),
      value: `${stats.monthlyRevenue.toLocaleString()} XOF`,
      icon: TrendingUp,
      gradient: "from-green-500/10 to-green-600/5",
      iconColor: "text-green-500",
      borderColor: "border-green-500/20",
      isRevenue: true,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`relative overflow-hidden rounded-xl border ${card.borderColor} bg-linear-to-br ${card.gradient} p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{card.label}</p>
              <p className="text-2xl font-bold mt-1 tracking-tight">
                {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl bg-background/60 backdrop-blur flex items-center justify-center ${card.iconColor}`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
          {/* Decorative gradient orb */}
          <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-linear-to-br ${card.gradient} opacity-50 blur-2xl`} />
        </div>
      ))}
    </div>
  )
}
