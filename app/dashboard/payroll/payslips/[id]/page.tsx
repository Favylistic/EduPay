import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Printer } from "lucide-react"
import { MONTHS, formatCurrency } from "@/lib/types"
import type { Payslip, PayslipBreakdown } from "@/lib/types"

export default async function PayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: slip, error } = await supabase
    .from("payslips")
    .select(
      "*, payroll_run:payroll_runs(id, title, month, year), employee:employees(id, employee_id, bank_name, bank_account_number, profile:profiles(id, first_name, last_name, email), department:departments(id, name), designation:designations(id, title))"
    )
    .eq("id", id)
    .single()

  if (error || !slip) notFound()

  const payslip = slip as Payslip & {
    payroll_run: { id: string; title: string; month: number; year: number }
  }
  const breakdown = payslip.breakdown as PayslipBreakdown
  const run = payslip.payroll_run
  const emp = payslip.employee

  return (
    <div className="flex flex-col gap-6 p-6">
      <DashboardHeader breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Payroll", href: "/dashboard/payroll" },
        { label: run.title, href: `/dashboard/payroll/runs/${run.id}` },
        { label: "Payslip" },
      ]} />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/payroll/runs/${run.id}`}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Run</Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => {}} className="print:hidden">
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
      </div>

      {/* Printable payslip card */}
      <Card className="max-w-2xl mx-auto w-full print:shadow-none print:border-none">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">PAYSLIP</h1>
              <p className="text-muted-foreground text-sm">{MONTHS[run.month - 1]} {run.year}</p>
              <p className="text-xs text-muted-foreground">{run.title}</p>
            </div>
            <Badge variant={payslip.status === "paid" ? "default" : "secondary"} className="text-sm px-3 py-1">
              {payslip.status === "paid" ? "Paid" : "Pending"}
            </Badge>
          </div>

          <Separator />

          {/* Employee info */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Employee Name</p>
              <p className="font-semibold">{emp?.profile?.first_name} {emp?.profile?.last_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Employee ID</p>
              <p className="font-mono font-medium">{emp?.employee_id}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Department</p>
              <p>{emp?.department?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Designation</p>
              <p>{emp?.designation?.title ?? "—"}</p>
            </div>
            {emp?.bank_name && (
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Bank</p>
                <p>{emp.bank_name}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Attendance summary */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Attendance</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Working Days", value: breakdown.working_days },
                { label: "Present Days", value: breakdown.present_days },
                { label: "Absent Days", value: breakdown.absent_days },
                { label: "Late Days", value: breakdown.late_days },
                { label: "Leave Days", value: breakdown.leave_days },
                { label: "Attendance Deduction", value: formatCurrency(breakdown.attendance_deduction) },
              ].map((item) => (
                <div key={item.label} className="rounded-md border px-3 py-2 text-center">
                  <p className="text-lg font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Earnings</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Base Salary</span>
                  <span className="font-mono">{formatCurrency(breakdown.base_salary)}</span>
                </div>
                {breakdown.earnings.map((e) => (
                  <div key={e.component_id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{e.name}</span>
                    <span className="font-mono text-green-700 dark:text-green-400">+{formatCurrency(e.computed_amount)}</span>
                  </div>
                ))}
                <Separator className="my-1" />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Gross Salary</span>
                  <span className="font-mono">{formatCurrency(breakdown.gross_salary)}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Deductions</p>
              <div className="space-y-2">
                {breakdown.attendance_deduction > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Attendance Deduction</span>
                    <span className="font-mono text-destructive">-{formatCurrency(breakdown.attendance_deduction)}</span>
                  </div>
                )}
                {breakdown.deductions.map((d) => (
                  <div key={d.component_id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-mono text-destructive">-{formatCurrency(d.computed_amount)}</span>
                  </div>
                ))}
                <Separator className="my-1" />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total Deductions</span>
                  <span className="font-mono text-destructive">-{formatCurrency(breakdown.total_deductions)}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Net Pay */}
          <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 px-5 py-4">
            <span className="text-base font-bold">NET PAY</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(payslip.net_salary)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
