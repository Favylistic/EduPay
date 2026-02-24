"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ATTENDANCE_STATUS_LABELS } from "@/lib/types"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface SummaryData {
  chartData: Array<Record<string, number | string>>
  totals: Record<string, number>
  month: string
}

interface AttendanceSummaryViewProps {
  myEmployeeId: string | null
  isAdmin: boolean
}

const STATUS_COLORS: Record<string, string> = {
  present: "#22c55e",
  absent: "#ef4444",
  late: "#eab308",
  half_day: "#3b82f6",
  on_leave: "#a855f7",
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  present: "bg-green-500/10 text-green-700 border-green-500/20",
  absent: "bg-destructive/10 text-destructive border-destructive/20",
  late: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  half_day: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  on_leave: "bg-purple-500/10 text-purple-700 border-purple-500/20",
}

export function AttendanceSummaryView({ myEmployeeId, isAdmin }: AttendanceSummaryViewProps) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [month, setMonth] = useState(currentMonth)

  const employeeId = isAdmin ? null : myEmployeeId

  const buildUrl = () => {
    const params = new URLSearchParams({ month })
    if (employeeId) params.set("employee_id", employeeId)
    return `/api/attendance/summary?${params.toString()}`
  }

  const { data } = useSWR<SummaryData>(buildUrl(), fetcher)

  const totals = data?.totals ?? {}
  const chartData = data?.chartData ?? []
  const totalDays = Object.values(totals).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Month picker */}
      <div className="flex items-center gap-3">
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-40"
        />
        <span className="text-sm text-muted-foreground">
          {totalDays} day{totalDays !== 1 ? "s" : ""} recorded
        </span>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {(["present", "absent", "late", "half_day", "on_leave"] as const).map((status) => (
          <Card key={status} className="py-4 px-4 flex flex-col gap-1">
            <p className="text-2xl font-bold tabular-nums">{totals[status] ?? 0}</p>
            <Badge variant="outline" className={cn("text-xs self-start", STATUS_BADGE_STYLES[status])}>
              {ATTENDANCE_STATUS_LABELS[status]}
            </Badge>
          </Card>
        ))}
      </div>

      {/* Bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Weekly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              No data for this month yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="present" name="Present" fill={STATUS_COLORS.present} radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" name="Late" fill={STATUS_COLORS.late} radius={[4, 4, 0, 0]} />
                <Bar dataKey="half_day" name="Half Day" fill={STATUS_COLORS.half_day} radius={[4, 4, 0, 0]} />
                <Bar dataKey="on_leave" name="On Leave" fill={STATUS_COLORS.on_leave} radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill={STATUS_COLORS.absent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
