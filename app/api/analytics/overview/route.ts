import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/analytics/overview
// Returns top-level KPIs: total payroll disbursed, active employees,
// avg net pay, pending leave requests
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!profile || !["super_admin", "hr_manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [payrollRes, employeesRes, leaveRes, latestRunRes] = await Promise.all([
    // Aggregate all completed payroll runs
    supabase
      .from("payroll_runs")
      .select("total_net, total_gross, total_deductions, total_employees")
      .eq("status", "completed"),
    // Active employees
    supabase
      .from("employees")
      .select("id, staff_type")
      .eq("is_active", true)
      .eq("employment_status", "active"),
    // Pending leave requests
    supabase
      .from("leave_requests")
      .select("id")
      .eq("status", "pending"),
    // Latest payroll run
    supabase
      .from("payroll_runs")
      .select("total_net, month, year")
      .eq("status", "completed")
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(1)
      .single(),
  ])

  const runs = payrollRes.data ?? []
  const totalDisbursed = runs.reduce((s, r) => s + (Number(r.total_net) || 0), 0)
  const totalGross = runs.reduce((s, r) => s + (Number(r.total_gross) || 0), 0)
  const totalDeductions = runs.reduce((s, r) => s + (Number(r.total_deductions) || 0), 0)
  const payrollRunCount = runs.length

  const employees = employeesRes.data ?? []
  const activeEmployees = employees.length
  const academicCount = employees.filter((e) => e.staff_type === "academic").length
  const nonAcademicCount = employees.filter((e) => e.staff_type === "non_academic").length

  const avgNetPay = payrollRunCount > 0
    ? Math.round(totalDisbursed / runs.reduce((s, r) => s + (Number(r.total_employees) || 0), 0) * 100) / 100
    : 0

  const pendingLeave = leaveRes.data?.length ?? 0
  const latestRun = latestRunRes.data

  return NextResponse.json({
    total_disbursed: Math.round(totalDisbursed * 100) / 100,
    total_gross: Math.round(totalGross * 100) / 100,
    total_deductions: Math.round(totalDeductions * 100) / 100,
    payroll_run_count: payrollRunCount,
    active_employees: activeEmployees,
    academic_count: academicCount,
    non_academic_count: nonAcademicCount,
    avg_net_pay: avgNetPay,
    pending_leave_requests: pendingLeave,
    latest_run_net: latestRun?.total_net ?? null,
    latest_run_period: latestRun ? { month: latestRun.month, year: latestRun.year } : null,
  })
}
