"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Plus, Loader2 } from "lucide-react"
import useSWR from "swr"
import type { LeaveType } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const schema = z
  .object({
    leave_type_id: z.string().min(1, "Select a leave type"),
    start_date: z.string().min(1, "Start date required"),
    end_date: z.string().min(1, "End date required"),
    reason: z.string().optional(),
  })
  .refine((d) => new Date(d.end_date) >= new Date(d.start_date), {
    message: "End date must be on or after start date",
    path: ["end_date"],
  })

type FormValues = z.infer<typeof schema>

interface LeaveRequestDialogProps {
  employeeId: string
  onSuccess: () => void
}

export function LeaveRequestDialog({ employeeId, onSuccess }: LeaveRequestDialogProps) {
  const [open, setOpen] = useState(false)
  const { data: leaveTypes } = useSWR<LeaveType[]>("/api/leave-types", fetcher)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { leave_type_id: "", start_date: "", end_date: "", reason: "" },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await fetch("/api/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, employee_id: employeeId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to submit request")
      }
      toast.success("Leave request submitted successfully.")
      form.reset()
      setOpen(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed")
    }
  }

  // Calculate days preview
  const start = form.watch("start_date")
  const end = form.watch("end_date")
  const days =
    start && end && new Date(end) >= new Date(start)
      ? Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1
      : null

  const today = new Date().toISOString().split("T")[0]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Request Leave
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Leave Request</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="leave_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(leaveTypes ?? []).map((lt) => (
                        <SelectItem key={lt.id} value={lt.id}>
                          {lt.name}
                          {lt.max_days_per_year > 0 && (
                            <span className="text-muted-foreground ml-1">
                              (max {lt.max_days_per_year}d/yr)
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" min={today} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" min={start || today} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {days !== null && (
              <p className="text-sm text-muted-foreground">
                Duration: <span className="font-semibold text-foreground">{days} day{days !== 1 ? "s" : ""}</span>
              </p>
            )}

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief reason for leave..." className="resize-none h-20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="gap-2">
                {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
