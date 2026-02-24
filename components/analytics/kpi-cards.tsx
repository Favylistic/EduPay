"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/types"
import {
  TrendingUp,
  Users,
  DollarSign,
  ClipboardList,
  BarChart3,
  Minus,
} from "lucide-react"

interface KpiData {
  total_disbursed: number
  total_gross: number
  total_deductions: number
  payroll_run_count: number
  active_employees: number
  academic_count: number
  non_academic_count: number
  avg_net_pay: number
  pending_leave_requests: number
  latest_run_net: number | null
  latest_run_period: { month: number; year: number } | null
}

interface KpiCardsProps {
  data: KpiData
}

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
              {title}
            </p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight truncate">{value}</p>
            {sub && (
              <p className="mt-1 text-xs text-muted-foreground truncate">{sub}</p>
            )}
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function KpiCards({ data }: KpiCardsProps) {
  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]

  const latestPeriod = data.latest_run_period
    ? `${MONTHS[data.latest_run_period.month - 1]} ${data.latest_run_period.year}`
    : null

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Total Disbursed"
        value={formatCurrency(data.total_disbursed)}
        sub={`Across ${data.payroll_run_count} payroll run${data.payroll_run_count !== 1 ? "s" : ""}`}
        icon={DollarSign}
        accent="bg-teal-500/10 text-teal-600 dark:text-teal-400"
      />
      <KpiCard
        title="Active Employees"
        value={data.active_employees}
        sub={`${data.academic_count} academic · ${data.non_academic_count} non-academic`}
        icon={Users}
        accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      />
      <KpiCard
        title="Avg. Net Pay"
        value={formatCurrency(data.avg_net_pay)}
        sub="Per employee per run"
        icon={BarChart3}
        accent="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
      />
      <KpiCard
        title="Latest Run Net"
        value={data.latest_run_net !== null ? formatCurrency(data.latest_run_net) : "—"}
        sub={latestPeriod ?? "No runs yet"}
        icon={data.latest_run_net !== null ? TrendingUp : Minus}
        accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />
      <KpiCard
        title="Total Gross Earnings"
        value={formatCurrency(data.total_gross)}
        sub="Before deductions"
        icon={TrendingUp}
        accent="bg-green-500/10 text-green-600 dark:text-green-400"
      />
      <KpiCard
        title="Total Deductions"
        value={formatCurrency(data.total_deductions)}
        sub="Across all runs"
        icon={Minus}
        accent="bg-red-500/10 text-red-600 dark:text-red-400"
      />
      <KpiCard
        title="Pending Leave"
        value={data.pending_leave_requests}
        sub={data.pending_leave_requests === 1 ? "Request awaiting review" : "Requests awaiting review"}
        icon={ClipboardList}
        accent="bg-orange-500/10 text-orange-600 dark:text-orange-400"
      />
      <KpiCard
        title="Payroll Runs"
        value={data.payroll_run_count}
        sub="Completed payroll cycles"
        icon={BarChart3}
        accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
      />
    </div>
  )
}
