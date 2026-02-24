import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { PayslipBreakdown, PayslipLineItem } from "@/lib/types"

// Core payroll calculation engine — pure computation, no DB writes
// POST /api/payroll/calculate
// Body: { month: number, year: number, employee_ids?: string[] }

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
  const { month, year, employee_ids } = body as {
    month: number
    year: number
    employee_ids?: string[]
  }

  if (!month || !year) {
    return NextResponse.json({ error: "month and year are required" }, { status: 400 })
  }

  // 1. Fetch active employees
  let empQuery = supabase
    .from("employees")
    .select("id, employee_id, base_salary, staff_type, profile:profiles(id, first_name, last_name, email), department:departments(id, name), designation:designations(id, title)")
    .eq("is_active", true)
    .eq("employment_status", "active")
  if (employee_ids?.length) empQuery = empQuery.in("id", employee_ids)
  const { data: employees, error: empError } = await empQuery
  if (empError) return NextResponse.json({ error: empError.message }, { status: 400 })

  // 2. Fetch all active salary components
  const { data: allComponents } = await supabase
    .from("salary_components")
    .select("*")
    .eq("is_active", true)

  // 3. Fetch employee-specific overrides
  const empIds = (employees ?? []).map((e) => e.id)
  const { data: empOverridesRaw } = await supabase
    .from("employee_salary_components")
    .select("*, component:salary_components(*)")
    .in("employee_id", empIds)
    .eq("is_active", true)

  // 4. Attendance for month
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
  const { data: attendanceRecords } = await supabase
    .from("attendance_records")
    .select("employee_id, status")
    .in("employee_id", empIds)
    .gte("date", startDate)
    .lte("date", endDate)

  // 5. Approved leave for month
  const { data: leaveRecords } = await supabase
    .from("leave_requests")
    .select("employee_id, total_days")
    .in("employee_id", empIds)
    .eq("status", "approved")
    .gte("start_date", startDate)
    .lte("end_date", endDate)

  const workingDays = getWorkingDays(year, month)

  const results = (employees ?? []).map((emp) => {
    const baseSalary = Number(emp.base_salary) || 0
    const staffType = emp.staff_type as string

    // Attendance
    const empAtt = (attendanceRecords ?? []).filter((a) => a.employee_id === emp.id)
    const presentDays = empAtt.filter((a) => a.status === "present").length
    const lateDays = empAtt.filter((a) => a.status === "late").length
    const halfDays = empAtt.filter((a) => a.status === "half_day").length
    const onLeaveDays = empAtt.filter((a) => a.status === "on_leave").length
    const approvedLeaveDays = (leaveRecords ?? [])
      .filter((l) => l.employee_id === emp.id)
      .reduce((sum, l) => sum + (l.total_days ?? 0), 0)
    const effectivePresent = presentDays + lateDays + halfDays * 0.5 + onLeaveDays + approvedLeaveDays
    const absentDays = Math.max(0, workingDays - effectivePresent)
    const attendanceDeduction = workingDays > 0
      ? Math.round((absentDays / workingDays) * baseSalary * 100) / 100
      : 0

    // Resolve components: employee overrides take precedence
    const overrides = (empOverridesRaw ?? []).filter((o) => o.employee_id === emp.id)
    const overrideComponentIds = new Set(overrides.map((o) => o.component_id))

    const applicableDefaults = (allComponents ?? []).filter((c) => {
      if (overrideComponentIds.has(c.id)) return false
      return c.applies_to === "all" || c.applies_to === staffType
    })

    const resolvedComponents = [
      ...overrides.map((o) => ({
        id: o.component_id as string,
        name: (o.component?.name ?? "") as string,
        type: (o.component?.type ?? "deduction") as "earning" | "deduction",
        calculation_type: (o.component?.calculation_type ?? "fixed") as "fixed" | "percentage_of_base",
        base_value: Number(o.override_value ?? o.component?.value ?? 0),
      })),
      ...applicableDefaults.map((c) => ({
        id: c.id as string,
        name: c.name as string,
        type: c.type as "earning" | "deduction",
        calculation_type: c.calculation_type as "fixed" | "percentage_of_base",
        base_value: Number(c.value),
      })),
    ]

    const earnings: PayslipLineItem[] = []
    const deductions: PayslipLineItem[] = []

    for (const comp of resolvedComponents) {
      const amount = comp.calculation_type === "percentage_of_base"
        ? Math.round((comp.base_value / 100) * baseSalary * 100) / 100
        : comp.base_value

      const lineItem: PayslipLineItem = {
        component_id: comp.id,
        name: comp.name,
        type: comp.type,
        calculation_type: comp.calculation_type,
        base_value: comp.base_value,
        computed_amount: amount,
      }

      if (comp.type === "earning") earnings.push(lineItem)
      else deductions.push(lineItem)
    }

    const grossEarnings = Math.round((baseSalary + earnings.reduce((s, e) => s + e.computed_amount, 0)) * 100) / 100
    const totalDeductions = Math.round((deductions.reduce((s, d) => s + d.computed_amount, 0) + attendanceDeduction) * 100) / 100
    const netPay = Math.max(0, Math.round((grossEarnings - totalDeductions) * 100) / 100)

    const breakdown: PayslipBreakdown = {
      base_salary: baseSalary,
      attendance_deduction: attendanceDeduction,
      earnings,
      deductions,
      gross_earnings: grossEarnings,
      total_deductions: totalDeductions,
      net_pay: netPay,
    }

    return {
      employee_id: emp.id,
      employee_code: emp.employee_id,
      profile: emp.profile,
      department: emp.department,
      designation: emp.designation,
      base_salary: baseSalary,
      gross_earnings: grossEarnings,
      total_deductions: totalDeductions,
      net_pay: netPay,
      working_days: workingDays,
      present_days: presentDays,
      absent_days: absentDays,
      late_days: lateDays,
      leave_days: onLeaveDays + approvedLeaveDays,
      breakdown,
    }
  })

  return NextResponse.json({
    month,
    year,
    working_days: workingDays,
    employee_count: results.length,
    total_gross: Math.round(results.reduce((s, r) => s + r.gross_earnings, 0) * 100) / 100,
    total_deductions: Math.round(results.reduce((s, r) => s + r.total_deductions, 0) * 100) / 100,
    total_net: Math.round(results.reduce((s, r) => s + r.net_pay, 0) * 100) / 100,
    payslips: results,
  })
}

function getWorkingDays(year: number, month: number): number {
  const date = new Date(year, month - 1, 1)
  let count = 0
  while (date.getMonth() === month - 1) {
    const day = date.getDay()
    if (day !== 0 && day !== 6) count++
    date.setDate(date.getDate() + 1)
  }
  return count
}
