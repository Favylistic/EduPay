"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight, Shield } from "lucide-react"

interface AuditLog {
  id: string
  actor_id: string | null
  action: string
  entity_type: string
  entity_id: string
  meta: Record<string, unknown>
  created_at: string
  actor: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  } | null
}

interface AuditLogsResponse {
  logs: AuditLog[]
  total: number
  page: number
  limit: number
  total_pages: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const ACTION_COLORS: Record<string, string> = {
  payroll_run_created: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400",
  payslip_status_updated: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
  payslip_pdf_downloaded: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-400",
  leave_approved: "bg-teal-500/10 text-teal-700 border-teal-500/20 dark:text-teal-400",
  leave_rejected: "bg-destructive/10 text-destructive border-destructive/20",
  leave_cancelled: "bg-muted text-muted-foreground",
  employee_created: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400",
  employee_updated: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
  employee_deleted: "bg-destructive/10 text-destructive border-destructive/20",
  salary_component_created: "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400",
  salary_component_updated: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
  salary_component_deleted: "bg-destructive/10 text-destructive border-destructive/20",
}

const ACTION_LABELS: Record<string, string> = {
  payroll_run_created: "Payroll Run Created",
  payslip_status_updated: "Payslip Updated",
  payslip_pdf_downloaded: "Payslip Downloaded",
  leave_approved: "Leave Approved",
  leave_rejected: "Leave Rejected",
  leave_cancelled: "Leave Cancelled",
  employee_created: "Employee Created",
  employee_updated: "Employee Updated",
  employee_deleted: "Employee Deleted",
  salary_component_created: "Component Created",
  salary_component_updated: "Component Updated",
  salary_component_deleted: "Component Deleted",
}

const ALL_ACTIONS = Object.keys(ACTION_LABELS)

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-36 rounded-full" /></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20 font-mono" /></TableCell>
          <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-48" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

export function AuditLogTable() {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState("all")

  const params = new URLSearchParams({
    page: String(page),
    limit: "50",
  })
  if (actionFilter && actionFilter !== "all") params.set("action", actionFilter)

  const { data, isLoading } = useSWR<AuditLogsResponse>(
    `/api/audit-logs?${params.toString()}`,
    fetcher,
    { keepPreviousData: true }
  )

  function handleActionChange(val: string) {
    setActionFilter(val)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={actionFilter} onValueChange={handleActionChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {ALL_ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>{ACTION_LABELS[a] ?? a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {data && (
          <p className="text-sm text-muted-foreground">
            {data.total.toLocaleString()} record{data.total !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[160px]">Timestamp</TableHead>
                <TableHead className="hidden sm:table-cell">Action</TableHead>
                <TableHead className="hidden md:table-cell">Actor</TableHead>
                <TableHead className="hidden lg:table-cell">Entity</TableHead>
                <TableHead className="hidden xl:table-cell">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : !data?.logs.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Shield className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No audit log entries found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.logs.map((log) => (
                  <TableRow key={log.id} className="align-top">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-3">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${ACTION_COLORS[log.action] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {ACTION_LABELS[log.action] ?? log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm py-3">
                      {log.actor
                        ? `${log.actor.first_name ?? ""} ${log.actor.last_name ?? ""}`.trim() || log.actor.email
                        : <span className="text-muted-foreground italic">System</span>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs font-mono text-muted-foreground py-3">
                      <span className="capitalize">{log.entity_type.replace("_", " ")}</span>
                      <br />
                      <span className="truncate block max-w-[120px]">{log.entity_id}</span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-xs text-muted-foreground py-3 max-w-[260px]">
                      {log.meta && Object.keys(log.meta).length > 0 ? (
                        <div className="space-y-0.5">
                          {Object.entries(log.meta).slice(0, 4).map(([k, v]) => (
                            <div key={k} className="flex gap-1.5">
                              <span className="shrink-0 capitalize">{k.replace(/_/g, " ")}:</span>
                              <span className="truncate font-medium">{String(v ?? "—")}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="italic">No details</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.total_pages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.total_pages || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
