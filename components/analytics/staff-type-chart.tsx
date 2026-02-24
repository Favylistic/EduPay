"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface StaffTypeChartProps {
  academic: number
  nonAcademic: number
}

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { percent: number } }>
}) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs">
      <p className="font-semibold">{p.name}</p>
      <p className="text-muted-foreground">
        {p.value} employee{p.value !== 1 ? "s" : ""}
        {" "}({(p.payload.percent * 100).toFixed(1)}%)
      </p>
    </div>
  )
}

export function StaffTypeChart({ academic, nonAcademic }: StaffTypeChartProps) {
  const total = academic + nonAcademic
  const isEmpty = total === 0

  const data = [
    { name: "Academic", value: academic, color: "#0ea5e9" },
    { name: "Non-Academic", value: nonAcademic, color: "#14b8a6" },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Staff Composition</CardTitle>
        <CardDescription>Active employees by staff type</CardDescription>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
            No employee data available.
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-6 mt-1 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold">{academic}</p>
                <p className="text-xs text-muted-foreground">Academic</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{nonAcademic}</p>
                <p className="text-xs text-muted-foreground">Non-Academic</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
