import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PayrollRunsTable } from "@/components/payroll/payroll-runs-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Settings2, DollarSign, Users, TrendingDown, CheckCircle2 } from "lucide-react"
import { formatCurrency } from "@/lib/types"

export default async function PayrollPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!profile || !["super_admin", "hr_manager"].includes(profile.role)) {
    redirect("/dashboard")
  }

  const { data: runs } = await supabase
    .from("payroll_runs")
    .select("total_employees, total_gross, total_deductions, total_net, status")
    .eq("status", "completed")

  const totalRuns = runs?.length ?? 0
  const totalNet = (runs ?? []).reduce((s, r) => s + Number(r.total_net ?? 0), 0)
  const totalGross = (runs ?? []).reduce((s, r) => s + Number(r.total_gross ?? 0), 0)

  const { data: activeEmployees } = await supabase
    .from("employees")
    .select("id", { count: "exact" })
    .eq("is_active", true)
    .eq("employment_status", "active")

  const stats = [
    { title: "Completed Runs", value: String(totalRuns), icon: CheckCircle2, desc: "All-time payroll runs" },
    { title: "Active Employees", value: String(activeEmployees?.length ?? 0), icon: Users, desc: "Currently on payroll" },
    { title: "Total Gross Paid", value: formatCurrency(totalGross), icon: DollarSign, desc: "All-time gross" },
    { title: "Total Net Disbursed", value: formatCurrency(totalNet), icon: TrendingDown, desc: "After all deductions" },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      <DashboardHeader breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Payroll" },
      ]} />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground mt-1">Manage salary runs, payslips, and salary components.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/payroll/components">
              <Settings2 className="h-4 w-4 mr-2" /> Components
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/payroll/run">
              <Play className="h-4 w-4 mr-2" /> Run Payroll
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Runs</h2>
        <PayrollRunsTable />
      </div>
    </div>
  )
}
