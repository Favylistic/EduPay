"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AttendancePoint {
  period: string
  present: number
  absent: number
  late: number
  half_day: number
  on_leave: number
}

interface AttendanceChartProps {
  data: AttendancePoint[]
}

const STATUS_COLORS: Record<string, string> = {
  present: "#14b8a6",
  late: "#f59e0b",
  half_day: "#0ea5e9",
  on_leave: "#8b5cf6",
  absent: "#f43f5e",
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; fill: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + p.value, 0)
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-muted-foreground capitalize">{p.name.replace("_", " ")}:</span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
      <div className="mt-1 pt-1 border-t flex gap-2">
        <span className="text-muted-foreground">Total records:</span>
        <span className="font-medium">{total}</span>
      </div>
    </div>
  )
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  const isEmpty = data.length === 0
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Attendance Trends</CardTitle>
        <CardDescription>Monthly attendance status breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
            No attendance data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", radius: 4 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              {(["present", "late", "half_day", "on_leave", "absent"] as const).map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={key.replace("_", " ")}
                  stackId="a"
                  fill={STATUS_COLORS[key]}
                  radius={key === "absent" ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  maxBarSize={48}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
