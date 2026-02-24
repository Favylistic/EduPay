"use client"

import { useState } from "react"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Check, X, Loader2 } from "lucide-react"
import type { LeaveRequest, LeaveStatus } from "@/lib/types"
import { LEAVE_STATUS_COLORS, LEAVE_STATUS_LABELS, getInitials } from "@/lib/types"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ApprovalsTable() {
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [reviewDialog, setReviewDialog] = useState<{ request: LeaveRequest; action: "approved" | "rejected" } | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const url = `/api/leave-requests${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`
  const { data: requests, mutate } = useSWR<LeaveRequest[]>(url, fetcher)

  const openReviewDialog = (request: LeaveRequest, action: "approved" | "rejected") => {
    setReviewNotes("")
    setReviewDialog({ request, action })
  }

  const handleReview = async () => {
    if (!reviewDialog) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/leave-requests/${reviewDialog.request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewDialog.action,
          reviewer_notes: reviewNotes.trim() || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to update request")
      toast.success(
        reviewDialog.action === "approved" ? "Leave request approved." : "Leave request rejected."
      )
      setReviewDialog(null)
      mutate()
    } catch {
      toast.error("Could not process the review.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            {(Object.keys(LEAVE_STATUS_LABELS) as LeaveStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{LEAVE_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          {(requests ?? []).length} request{(requests ?? []).length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Employee</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">Department</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Period</TableHead>
              <TableHead className="font-semibold">Days</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Reason</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!requests ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No leave requests found.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => {
                const firstName = req.employee?.profile?.first_name ?? ""
                const lastName = req.employee?.profile?.last_name ?? ""
                const isPending = req.status === "pending"
                return (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {getInitials(firstName, lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{`${firstName} ${lastName}`.trim() || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {req.employee?.department?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{req.leave_type?.name ?? "—"}</TableCell>
                    <TableCell className="text-xs font-mono whitespace-nowrap">
                      {new Date(req.start_date + "T00:00:00").toLocaleDateString([], { month: "short", day: "numeric" })}
                      {" – "}
                      {new Date(req.end_date + "T00:00:00").toLocaleDateString([], { month: "short", day: "numeric" })}
                    </TableCell>
                    <TableCell className="text-sm">{req.total_days}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", LEAVE_STATUS_COLORS[req.status])}>
                        {LEAVE_STATUS_LABELS[req.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[180px] truncate">
                      {req.reason ?? "—"}
                    </TableCell>
                    <TableCell>
                      {isPending && (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Approve"
                            onClick={() => openReviewDialog(req, "approved")}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Reject"
                            onClick={() => openReviewDialog(req, "rejected")}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Review confirmation dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={(open) => !open && setReviewDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {reviewDialog?.action === "approved" ? "Approve" : "Reject"} Leave Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {reviewDialog?.action === "approved"
                ? "This will approve the request and notify the employee."
                : "This will reject the request and notify the employee."}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="review-notes">Notes (optional)</Label>
              <Textarea
                id="review-notes"
                placeholder="Add a note for the employee..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="resize-none h-24"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReviewDialog(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleReview}
                disabled={submitting}
                variant={reviewDialog?.action === "approved" ? "default" : "destructive"}
                className="gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {reviewDialog?.action === "approved" ? "Approve" : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
