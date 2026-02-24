"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/types"

interface DeptPoint {
  department: string
  employee_count: number
  avg_salary: number
  academic: number
  non_academic: number
}

interface DepartmentChartProps {
  data: DeptPoint[]
}

const BAR_COLORS = [
  "#0ea5e9", "#14b8a6", "#6366f1", "#f59e0b",
  "#10b981", "#f43f5e", "#8b5cf6", "#64748b",
]

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; name: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  const dept = payload[0] as { payload?: DeptPoint }
  const d = dept?.payload
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs">
      <p className="font-semibold mb-1.5 max-w-[160px] truncate">{label}</p>
      <div className="space-y-0.5">
        <div className="flex gap-2">
          <span className="text-muted-foreground">Employees:</span>
          <span className="font-medium">{p.value}</span>
        </div>
        {d && (
          <>
            <div className="flex gap-2">
              <span className="text-muted-foreground">Avg Salary:</span>
              <span className="font-medium">{formatCurrency(d.avg_salary)}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">Academic:</span>
              <span className="font-medium">{d.academic}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">Non-Academic:</span>
              <span className="font-medium">{d.non_academic}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function DepartmentChart({ data }: DepartmentChartProps) {
  const isEmpty = data.length === 0
  // Truncate long department names for display
  const chartData = data.map((d) => ({
    ...d,
    label: d.department.length > 14 ? d.department.slice(0, 13) + "…" : d.department,
  }))

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Department Distribution</CardTitle>
        <CardDescription>Employee headcount by department</CardDescription>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
            No department data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                angle={-30}
                textAnchor="end"
                interval={0}
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
              <Bar dataKey="employee_count" name="Employees" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
