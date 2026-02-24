import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { KpiCards } from "@/components/analytics/kpi-cards"
import { PayrollTrendChart } from "@/components/analytics/payroll-trend-chart"
import { DepartmentChart } from "@/components/analytics/department-chart"
import { AttendanceChart } from "@/components/analytics/attendance-chart"
import { StaffTypeChart } from "@/components/analytics/staff-type-chart"
import { AnalyticsSkeleton } from "@/components/analytics/analytics-skeleton"

export const metadata: Metadata = {
  title: "Analytics",
  description: "Financial metrics, attendance trends, and departmental distributions",
}

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

async function AnalyticsContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!profile || !["super_admin", "hr_manager"].includes(profile.role)) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          You do not have permission to view analytics.
        </p>
      </div>
    )
  }

  // ── All data fetched directly via Supabase (no internal HTTP round-trip) ──
  const now = new Date()
  const attStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const attEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [
    payrollRunsRes,
    employeesRes,
    leaveRes,
    trendRunsRes,
    deptEmpRes,
    attRecordsRes,
  ] = await Promise.all([
    supabase
      .from("payroll_runs")
      .select("total_net, total_gross, total_deductions, total_employees, month, year")
      .eq("status", "completed")
      .order("year", { ascending: false })
      .order("month", { ascending: false }),
    supabase
      .from("employees")
      .select("id, staff_type, department_id, base_salary, department:departments(id, name)")
      .eq("is_active", true)
      .eq("employment_status", "active"),
    supabase
      .from("leave_requests")
      .select("id")
      .eq("status", "pending"),
    supabase
      .from("payroll_runs")
      .select("month, year, total_gross, total_deductions, total_net, total_employees")
      .eq("status", "completed")
      .order("year", { ascending: true })
      .order("month", { ascending: true })
      .limit(12),
    supabase
      .from("employees")
      .select("department_id, base_salary, staff_type, department:departments(id, name)")
      .eq("is_active", true)
      .eq("employment_status", "active"),
    supabase
      .from("attendance_records")
      .select("date, status")
      .gte("date", attStart.toISOString().split("T")[0])
      .lte("date", attEnd.toISOString().split("T")[0]),
  ])

  // ── Build overview KPIs ──
  const runs = payrollRunsRes.data ?? []
  const totalDisbursed = runs.reduce((s, r) => s + (Number(r.total_net) || 0), 0)
  const totalGross = runs.reduce((s, r) => s + (Number(r.total_gross) || 0), 0)
  const totalDeductions = runs.reduce((s, r) => s + (Number(r.total_deductions) || 0), 0)
  const payrollRunCount = runs.length
  const totalEmpRuns = runs.reduce((s, r) => s + (Number(r.total_employees) || 0), 0)
  const avgNetPay = totalEmpRuns > 0 ? Math.round((totalDisbursed / totalEmpRuns) * 100) / 100 : 0
  const latestRun = runs[0] ?? null

  const employees = employeesRes.data ?? []
  const academicCount = employees.filter((e) => e.staff_type === "academic").length
  const nonAcademicCount = employees.filter((e) => e.staff_type === "non_academic").length

  const overview = {
    total_disbursed: Math.round(totalDisbursed * 100) / 100,
    total_gross: Math.round(totalGross * 100) / 100,
    total_deductions: Math.round(totalDeductions * 100) / 100,
    payroll_run_count: payrollRunCount,
    active_employees: employees.length,
    academic_count: academicCount,
    non_academic_count: nonAcademicCount,
    avg_net_pay: avgNetPay,
    pending_leave_requests: leaveRes.data?.length ?? 0,
    latest_run_net: latestRun ? Number(latestRun.total_net) : null,
    latest_run_period: latestRun ? { month: latestRun.month, year: latestRun.year } : null,
  }

  // ── Build payroll trend ──
  const trend = (trendRunsRes.data ?? []).map((r) => ({
    period: `${MONTHS_SHORT[r.month - 1]} ${r.year}`,
    month: r.month,
    year: r.year,
    gross: Number(r.total_gross) || 0,
    deductions: Number(r.total_deductions) || 0,
    net: Number(r.total_net) || 0,
    employees: Number(r.total_employees) || 0,
  }))

  // ── Build department distribution ──
  const deptMap = new Map<string, { name: string; count: number; total_salary: number; academic: number; non_academic: number }>()
  for (const emp of deptEmpRes.data ?? []) {
    const dept = emp.department as { id: string; name: string } | null
    const key = dept?.id ?? "unassigned"
    const name = dept?.name ?? "Unassigned"
    const existing = deptMap.get(key)
    if (existing) {
      existing.count++
      existing.total_salary += Number(emp.base_salary) || 0
      if (emp.staff_type === "academic") existing.academic++
      else existing.non_academic++
    } else {
      deptMap.set(key, { name, count: 1, total_salary: Number(emp.base_salary) || 0, academic: emp.staff_type === "academic" ? 1 : 0, non_academic: emp.staff_type === "non_academic" ? 1 : 0 })
    }
  }
  const dept = Array.from(deptMap.entries())
    .map(([id, d]) => ({
      department_id: id,
      department: d.name,
      employee_count: d.count,
      total_salary: Math.round(d.total_salary * 100) / 100,
      avg_salary: d.count > 0 ? Math.round((d.total_salary / d.count) * 100) / 100 : 0,
      academic: d.academic,
      non_academic: d.non_academic,
    }))
    .sort((a, b) => b.employee_count - a.employee_count)

  // ── Build attendance trends (6 months) ──
  const monthMap = new Map<string, { period: string; present: number; absent: number; late: number; half_day: number; on_leave: number }>()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    monthMap.set(key, { period: `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`, present: 0, absent: 0, late: 0, half_day: 0, on_leave: 0 })
  }
  for (const rec of attRecordsRes.data ?? []) {
    const key = rec.date.slice(0, 7)
    const bucket = monthMap.get(key)
    if (!bucket) continue
    const s = rec.status as string
    if (s === "present") bucket.present++
    else if (s === "absent") bucket.absent++
    else if (s === "late") bucket.late++
    else if (s === "half_day") bucket.half_day++
    else if (s === "on_leave") bucket.on_leave++
  }
  const att = Array.from(monthMap.values())

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Financial overview, payroll trends, and workforce insights
        </p>
      </div>

      {/* KPI Cards */}
      <KpiCards data={overview} />

      {/* Main charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PayrollTrendChart data={trend} />
        <AttendanceChart data={att} />
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DepartmentChart data={dept} />
        </div>
        <StaffTypeChart
          academic={overview.academic_count}
          nonAcademic={overview.non_academic_count}
        />
      </div>
    </div>
  )
}

export default async function AnalyticsPage() {
  return (
    <>
      <DashboardHeader breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Analytics" },
      ]} />
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsContent />
      </Suspense>
    </>
  )
}
