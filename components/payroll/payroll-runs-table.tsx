"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Eye } from "lucide-react"
import type { PayrollRun } from "@/lib/types"
import { PAYROLL_STATUS_LABELS, PAYROLL_STATUS_COLORS, MONTHS, formatCurrency } from "@/lib/types"

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => Array.isArray(d) ? d : [])

export function PayrollRunsTable() {
  const { data: runs } = useSWR<PayrollRun[]>("/api/payroll/runs", fetcher)
  const [yearFilter, setYearFilter] = useState<string>("all")

  const safeRuns = Array.isArray(runs) ? runs : []
  const years = [...new Set(safeRuns.map((r) => r.year))].sort((a, b) => b - a)
  const filtered = yearFilter === "all" ? safeRuns : safeRuns.filter((r) => r.year === Number(yearFilter))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">Filter by year:</span>
        <div className="flex gap-2 flex-wrap">
          <Button variant={yearFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setYearFilter("all")}>All</Button>
          {years.map((y) => (
            <Button key={y} variant={yearFilter === String(y) ? "default" : "outline"} size="sm" onClick={() => setYearFilter(String(y))}>
              {y}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Period</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">Employees</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Gross</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Deductions</TableHead>
              <TableHead className="font-semibold">Net Pay</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!runs ? (
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No payroll runs found.</TableCell></TableRow>
            ) : filtered.map((run) => (
              <TableRow key={run.id}>
                <TableCell>
                  <span className="font-medium text-sm">{MONTHS[run.month - 1]} {run.year}</span>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm">{run.total_employees ?? 0}</TableCell>
                <TableCell className="hidden md:table-cell font-mono text-sm">{formatCurrency(run.total_gross ?? 0)}</TableCell>
                <TableCell className="hidden md:table-cell font-mono text-sm text-destructive">-{formatCurrency(run.total_deductions ?? 0)}</TableCell>
                <TableCell className="font-mono font-semibold text-sm">{formatCurrency(run.total_net ?? 0)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={PAYROLL_STATUS_COLORS[run.status]}>
                    {PAYROLL_STATUS_LABELS[run.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/dashboard/payroll/runs/${run.id}`}><Eye className="h-4 w-4" /></Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
