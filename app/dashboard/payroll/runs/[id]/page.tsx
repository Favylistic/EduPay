import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Eye, ArrowLeft } from "lucide-react"
import {
  PAYROLL_STATUS_LABELS, PAYROLL_STATUS_COLORS, MONTHS, formatCurrency, getInitials,
} from "@/lib/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Payslip } from "@/lib/types"

export default async function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!profile || !["super_admin", "hr_manager"].includes(profile.role)) redirect("/dashboard")

  const { data: run } = await supabase
    .from("payroll_runs")
    .select("*, processor:profiles!processed_by(id, first_name, last_name)")
    .eq("id", id)
    .single()
  if (!run) notFound()

  const { data: payslips } = await supabase
    .from("payslips")
    .select("*, employee:employees(id, employee_id, profile:profiles(id, first_name, last_name, email), department:departments(id, name), designation:designations(id, title))")
    .eq("payroll_run_id", id)
    .order("created_at", { ascending: true })

  const slips: Payslip[] = payslips ?? []

  return (
    <div className="flex flex-col gap-6 p-6">
      <DashboardHeader breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Payroll", href: "/dashboard/payroll" },
        { label: `${MONTHS[run.month - 1]} ${run.year}` },
      ]} />

      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/payroll"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{run.title}</h1>
            <Badge variant="outline" className={PAYROLL_STATUS_COLORS[run.status as keyof typeof PAYROLL_STATUS_COLORS]}>
              {PAYROLL_STATUS_LABELS[run.status as keyof typeof PAYROLL_STATUS_LABELS]}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {MONTHS[run.month - 1]} {run.year} &middot; Processed by{" "}
            {run.processor ? `${run.processor.first_name} ${run.processor.last_name}` : "System"}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Employees", value: run.total_employees },
          { label: "Total Gross", value: formatCurrency(run.total_gross) },
          { label: "Total Deductions", value: formatCurrency(run.total_deductions) },
          { label: "Net Disbursed", value: formatCurrency(run.total_net) },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground font-medium">{s.label}</CardTitle></CardHeader>
            <CardContent><p className="text-xl font-bold">{s.value}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* Payslips table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Payslips ({slips.length})</h2>
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Employee</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Department</TableHead>
                <TableHead className="font-semibold">Base</TableHead>
                <TableHead className="font-semibold hidden sm:table-cell">Gross</TableHead>
                <TableHead className="font-semibold hidden sm:table-cell">Deductions</TableHead>
                <TableHead className="font-semibold">Net Pay</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {slips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-20 text-center text-muted-foreground">No payslips found.</TableCell>
                </TableRow>
              ) : slips.map((slip) => (
                <TableRow key={slip.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(slip.employee?.profile?.first_name ?? null, slip.employee?.profile?.last_name ?? null)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{slip.employee?.profile?.first_name} {slip.employee?.profile?.last_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{slip.employee?.employee_id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{slip.employee?.department?.name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{formatCurrency(slip.base_salary)}</TableCell>
                  <TableCell className="hidden sm:table-cell font-mono text-sm">{formatCurrency(slip.gross_salary)}</TableCell>
                  <TableCell className="hidden sm:table-cell font-mono text-sm text-destructive">-{formatCurrency(slip.total_deductions)}</TableCell>
                  <TableCell className="font-mono font-semibold">{formatCurrency(slip.net_salary)}</TableCell>
                  <TableCell>
                    <Badge variant={slip.status === "paid" ? "default" : "secondary"} className="text-xs">
                      {slip.status === "paid" ? "Paid" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/dashboard/payroll/payslips/${slip.id}`}><Eye className="h-4 w-4" /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
