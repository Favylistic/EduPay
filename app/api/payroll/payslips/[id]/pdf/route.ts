import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { writeAuditLog } from "@/lib/audit"
import { MONTHS } from "@/lib/types"
import type { PayslipBreakdown } from "@/lib/types"

function fmt(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)
}

function buildHtml(slip: {
  id: string
  net_pay: number
  gross_earnings: number
  total_deductions: number
  base_salary: number
  working_days: number
  present_days: number
  absent_days: number
  late_days: number
  leave_days: number
  status: string
  breakdown: PayslipBreakdown
  payroll_run: { month: number; year: number } | null
  employee: {
    employee_id: string
    bank_name: string | null
    profile: { first_name: string | null; last_name: string | null; email: string | null } | null
    department: { name: string } | null
    designation: { title: string } | null
  } | null
}): string {
  const bd = slip.breakdown
  const run = slip.payroll_run
  const emp = slip.employee
  const period = run ? `${MONTHS[run.month - 1]} ${run.year}` : "—"
  const name = emp?.profile ? `${emp.profile.first_name ?? ""} ${emp.profile.last_name ?? ""}`.trim() : "—"

  const earningsRows = bd.earnings
    .map(
      (e) =>
        `<tr><td style="padding:6px 0;color:#6b7280">${e.name}</td><td style="padding:6px 0;text-align:right;color:#16a34a">+${fmt(e.computed_amount)}</td></tr>`
    )
    .join("")

  const deductionsRows = [
    bd.attendance_deduction > 0
      ? `<tr><td style="padding:6px 0;color:#6b7280">Attendance Deduction</td><td style="padding:6px 0;text-align:right;color:#dc2626">-${fmt(bd.attendance_deduction)}</td></tr>`
      : "",
    ...bd.deductions.map(
      (d) =>
        `<tr><td style="padding:6px 0;color:#6b7280">${d.name}</td><td style="padding:6px 0;text-align:right;color:#dc2626">-${fmt(d.computed_amount)}</td></tr>`
    ),
  ].join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Payslip – ${period}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#111827;background:#fff;padding:48px}
    h1{font-size:22px;font-weight:700;letter-spacing:-0.5px}
    .subtitle{color:#6b7280;font-size:12px;margin-top:4px}
    .badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:${slip.status === "paid" ? "#dcfce7" : "#f3f4f6"};color:${slip.status === "paid" ? "#166534" : "#374151"}}
    hr{border:none;border-top:1px solid #e5e7eb;margin:20px 0}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px 32px;margin:16px 0}
    .label{font-size:11px;color:#9ca3af;margin-bottom:2px}
    .value{font-weight:600}
    .att-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}
    .att-box{border:1px solid #e5e7eb;border-radius:8px;padding:10px;text-align:center}
    .att-num{font-size:18px;font-weight:700}
    .att-lbl{font-size:10px;color:#9ca3af;margin-top:2px}
    table{width:100%;border-collapse:collapse}
    td{vertical-align:top}
    .section-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:8px}
    .total-row td{font-weight:700;border-top:1px solid #e5e7eb;padding-top:8px}
    .net-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px 24px;display:flex;justify-content:space-between;align-items:center;margin-top:20px}
    .net-label{font-size:15px;font-weight:700}
    .net-amount{font-size:24px;font-weight:800;color:#15803d}
    .footer{margin-top:32px;font-size:10px;color:#9ca3af;text-align:center}
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <h1>PAYSLIP</h1>
      <p class="subtitle">${period}</p>
    </div>
    <span class="badge">${slip.status === "paid" ? "Paid" : "Generated"}</span>
  </div>
  <hr/>
  <div class="grid2">
    <div><p class="label">Employee Name</p><p class="value">${name}</p></div>
    <div><p class="label">Employee ID</p><p class="value" style="font-family:monospace">${emp?.employee_id ?? "—"}</p></div>
    <div><p class="label">Department</p><p class="value">${emp?.department?.name ?? "—"}</p></div>
    <div><p class="label">Designation</p><p class="value">${emp?.designation?.title ?? "—"}</p></div>
    ${emp?.bank_name ? `<div><p class="label">Bank</p><p class="value">${emp.bank_name}</p></div>` : ""}
    ${emp?.profile?.email ? `<div><p class="label">Email</p><p class="value">${emp.profile.email}</p></div>` : ""}
  </div>
  <hr/>
  <p class="section-label">Attendance</p>
  <div class="att-grid">
    <div class="att-box"><div class="att-num">${slip.working_days}</div><div class="att-lbl">Working Days</div></div>
    <div class="att-box"><div class="att-num">${slip.present_days}</div><div class="att-lbl">Present</div></div>
    <div class="att-box"><div class="att-num">${slip.absent_days}</div><div class="att-lbl">Absent</div></div>
    <div class="att-box"><div class="att-num">${slip.late_days}</div><div class="att-lbl">Late</div></div>
    <div class="att-box"><div class="att-num">${slip.leave_days}</div><div class="att-lbl">Leave</div></div>
    <div class="att-box"><div class="att-num" style="font-size:14px">${fmt(bd.attendance_deduction)}</div><div class="att-lbl">Att. Deduction</div></div>
  </div>
  <hr/>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
    <div>
      <p class="section-label">Earnings</p>
      <table>
        <tr><td style="padding:6px 0;color:#6b7280">Base Salary</td><td style="padding:6px 0;text-align:right">${fmt(bd.base_salary)}</td></tr>
        ${earningsRows}
        <tr class="total-row"><td style="padding-top:8px">Gross Earnings</td><td style="padding-top:8px;text-align:right">${fmt(bd.gross_earnings)}</td></tr>
      </table>
    </div>
    <div>
      <p class="section-label">Deductions</p>
      <table>
        ${deductionsRows}
        <tr class="total-row"><td style="color:#dc2626">Total Deductions</td><td style="text-align:right;color:#dc2626">-${fmt(bd.total_deductions)}</td></tr>
      </table>
    </div>
  </div>
  <div class="net-box">
    <span class="net-label">NET PAY</span>
    <span class="net-amount">${fmt(slip.net_pay)}</span>
  </div>
  <p class="footer">Generated by EduPay Payroll Management System &bull; ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}</p>
</body>
</html>`
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: slip, error } = await supabase
    .from("payslips")
    .select(
      "*, payroll_run:payroll_runs(id, month, year), employee:employees(id, employee_id, bank_name, profile:profiles(id, first_name, last_name, email), department:departments(id, name), designation:designations(id, title))"
    )
    .eq("id", id)
    .single()

  if (error || !slip) {
    return NextResponse.json({ error: "Payslip not found" }, { status: 404 })
  }

  const html = buildHtml({
    ...slip,
    breakdown: slip.breakdown as PayslipBreakdown,
    payroll_run: slip.payroll_run as { month: number; year: number } | null,
    employee: slip.employee as {
      employee_id: string
      bank_name: string | null
      profile: { first_name: string | null; last_name: string | null; email: string | null } | null
      department: { name: string } | null
      designation: { title: string } | null
    } | null,
  })

  const run = slip.payroll_run as { month: number; year: number } | null
  const period = run ? `${MONTHS[run.month - 1]}_${run.year}` : "payslip"
  const emp = slip.employee as { employee_id: string } | null
  const filename = `Payslip_${emp?.employee_id ?? id}_${period}.html`

  // Write audit log
  await writeAuditLog("payslip_pdf_downloaded", "payslip", id, {
    employee_id: emp?.employee_id,
    period,
  })

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
