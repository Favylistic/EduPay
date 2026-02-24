import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { writeAuditLog } from "@/lib/audit"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("payroll_runs")
    .select("*, runner:profiles!run_by(id, first_name, last_name)")
    .order("year", { ascending: false })
    .order("month", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data ?? [])
}

// POST: commit payroll run + all payslips atomically
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!profile || !["super_admin", "hr_manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { month, year, notes, payslips } = body

  const totalGross = payslips.reduce((s: number, p: { gross_earnings: number }) => s + p.gross_earnings, 0)
  const totalDeductions = payslips.reduce((s: number, p: { total_deductions: number }) => s + p.total_deductions, 0)
  const totalNet = payslips.reduce((s: number, p: { net_pay: number }) => s + p.net_pay, 0)

  const { data: run, error: runError } = await supabase
    .from("payroll_runs")
    .insert({
      month,
      year,
      notes: notes || null,
      status: "completed",
      total_employees: payslips.length,
      total_gross: Math.round(totalGross * 100) / 100,
      total_deductions: Math.round(totalDeductions * 100) / 100,
      total_net: Math.round(totalNet * 100) / 100,
      run_by: user.id,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (runError) return NextResponse.json({ error: runError.message }, { status: 400 })

  const payslipRows = payslips.map((p: {
    employee_id: string
    base_salary: number
    gross_earnings: number
    total_deductions: number
    net_pay: number
    working_days: number
    present_days: number
    absent_days: number
    late_days: number
    leave_days: number
    breakdown: object
  }) => ({
    payroll_run_id: run.id,
    employee_id: p.employee_id,
    base_salary: p.base_salary,
    gross_earnings: p.gross_earnings,
    total_deductions: p.total_deductions,
    net_pay: p.net_pay,
    working_days: p.working_days,
    present_days: p.present_days,
    absent_days: p.absent_days,
    late_days: p.late_days,
    leave_days: p.leave_days,
    breakdown: p.breakdown,
    status: "generated",
  }))

  const { error: slipError } = await supabase.from("payslips").insert(payslipRows)
  if (slipError) return NextResponse.json({ error: slipError.message }, { status: 400 })

  await writeAuditLog("payroll_run_created", "payroll_run", run.id, {
    month,
    year,
    total_employees: payslips.length,
    total_net: Math.round(totalNet * 100) / 100,
  })

  return NextResponse.json(run, { status: 201 })
}
