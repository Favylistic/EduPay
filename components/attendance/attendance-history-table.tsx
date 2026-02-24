"use client"

import { useState } from "react"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import type { AttendanceRecord, AttendanceStatus } from "@/lib/types"
import { ATTENDANCE_STATUS_COLORS, ATTENDANCE_STATUS_LABELS } from "@/lib/types"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface AttendanceHistoryTableProps {
  myEmployeeId: string | null
  isAdmin: boolean
}

function buildUrl(employeeId: string | null, month: string, status: string) {
  const params = new URLSearchParams({ limit: "100" })
  if (employeeId) params.set("employee_id", employeeId)
  if (month) params.set("month", month)
  if (status && status !== "all") params.set("status", status)
  return `/api/attendance?${params.toString()}`
}

export function AttendanceHistoryTable({ myEmployeeId, isAdmin }: AttendanceHistoryTableProps) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [month, setMonth] = useState(currentMonth)
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const PER_PAGE = 15

  // Admins see all; non-admins scoped to themselves
  const employeeId = isAdmin ? null : myEmployeeId

  const { data: result } = useSWR<{ data: AttendanceRecord[]; count: number }>(
    buildUrl(employeeId, month, statusFilter),
    fetcher
  )

  const records = result?.data ?? []
  const totalPages = Math.ceil(records.length / PER_PAGE)
  const paged = records.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function formatTime(iso: string | null) {
    if (!iso) return "--:--"
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  function calcDuration(checkIn: string | null, checkOut: string | null) {
    if (!checkIn || !checkOut) return "—"
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}h ${m}m`
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          type="month"
          value={month}
          onChange={(e) => { setMonth(e.target.value); setPage(1) }}
          className="w-40"
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.keys(ATTENDANCE_STATUS_LABELS) as AttendanceStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{ATTENDANCE_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          {records.length} record{records.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Date</TableHead>
              {isAdmin && <TableHead className="font-semibold">Employee</TableHead>}
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Check In</TableHead>
              <TableHead className="font-semibold">Check Out</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">Duration</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Notes</TableHead>
              <TableHead className="font-semibold w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} className="h-24 text-center text-muted-foreground">
                  No attendance records found.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell className="font-mono text-sm">
                    {new Date(rec.date + "T00:00:00").toLocaleDateString([], {
                      weekday: "short", month: "short", day: "numeric",
                    })}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-sm">
                      {rec.employee?.profile
                        ? `${rec.employee.profile.first_name ?? ""} ${rec.employee.profile.last_name ?? ""}`.trim()
                        : rec.employee?.employee_id ?? "—"}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", ATTENDANCE_STATUS_COLORS[rec.status])}
                    >
                      {ATTENDANCE_STATUS_LABELS[rec.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{formatTime(rec.check_in)}</TableCell>
                  <TableCell className="font-mono text-sm">{formatTime(rec.check_out)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {calcDuration(rec.check_in, rec.check_out)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                    {rec.notes ?? "—"}
                  </TableCell>
                  <TableCell>
                    {(rec.latitude !== null && rec.longitude !== null) && (
                      <a
                        href={`https://maps.google.com/?q=${rec.latitude},${rec.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View location"
                      >
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline" size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
