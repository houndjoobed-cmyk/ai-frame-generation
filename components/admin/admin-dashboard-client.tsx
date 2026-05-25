"use client"

import { StatsCards } from "@/components/admin/stats-cards"
import { useI18n } from "@/lib/i18n/i18n-context"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const PIE_COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"]

interface StatsData {
  totalUsers: number
  totalFrames: number
  totalProjects: number
  totalExports: number
  activeSubscriptions: number
  monthlyRevenue: number
  planDistribution: Record<string, number>
  signupsChart: { date: string; count: number }[]
}

export function AdminDashboardClient({ stats }: { stats: StatsData }) {
  const { t } = useI18n()

  // Prepare pie chart data
  const pieData = Object.entries(stats.planDistribution).map(([name, value]) => ({
    name,
    value,
  }))

  // Format chart dates
  const barData = stats.signupsChart.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
  }))

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.dashboardTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("admin.dashboardSubtitle")}</p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart — Signups last 7 days */}
        <div className="rounded-xl border p-6 bg-card">
          <h3 className="text-sm font-semibold mb-4">{t("admin.signupsChart")}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart — Plan Distribution */}
        <div className="rounded-xl border p-6 bg-card">
          <h3 className="text-sm font-semibold mb-4">{t("admin.planDistribution")}</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
              {t("admin.noActiveSubscriptions")}
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{entry.name}</span>
                    <span className="text-sm text-muted-foreground">({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
