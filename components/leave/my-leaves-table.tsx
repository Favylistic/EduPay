"use client"

import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { LeaveRequestDialog } from "./leave-request-dialog"
import type { LeaveRequest } from "@/lib/types"
import { LEAVE_STATUS_COLORS, LEAVE_STATUS_LABELS } from "@/lib/types"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface MyLeavesTableProps {
  employeeId: string
}

export function MyLeavesTable({ employeeId }: MyLeavesTableProps) {
  const { data: requests, mutate } = useSWR<LeaveRequest[]>(
    `/api/leave-requests?employee_id=${employeeId}`,
    fetcher
  )

  const handleCancel = async (id: string) => {
    try {
      const res = await fetch(`/api/leave-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })
      if (!res.ok) throw new Error("Failed to cancel request")
      toast.success("Leave request cancelled.")
      mutate()
    } catch {
      toast.error("Could not cancel request.")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">My Leave Requests</h2>
          <p className="text-sm text-muted-foreground">Submit and track your time-off requests.</p>
        </div>
        <LeaveRequestDialog employeeId={employeeId} onSuccess={() => mutate()} />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Start</TableHead>
              <TableHead className="font-semibold">End</TableHead>
              <TableHead className="font-semibold">Days</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Reviewer Notes</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!requests ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No leave requests yet. Submit one above.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium text-sm">{req.leave_type?.name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {new Date(req.start_date + "T00:00:00").toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {new Date(req.end_date + "T00:00:00").toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                  </TableCell>
                  <TableCell className="text-sm">{req.total_days}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs", LEAVE_STATUS_COLORS[req.status])}>
                      {LEAVE_STATUS_LABELS[req.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                    {req.reviewer_notes ?? "—"}
                  </TableCell>
                  <TableCell>
                    {req.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleCancel(req.id)}
                        title="Cancel request"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
