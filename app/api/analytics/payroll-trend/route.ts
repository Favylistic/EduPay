import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/analytics/payroll-trend?months=12
// Returns monthly payroll gross/deductions/net for the last N months
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!profile || !["super_admin", "hr_manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const months = Math.min(Math.max(parseInt(searchParams.get("months") ?? "12"), 3), 24)

  const { data: runs, error } = await supabase
    .from("payroll_runs")
    .select("month, year, total_gross, total_deductions, total_net, total_employees")
    .eq("status", "completed")
    .order("year", { ascending: true })
    .order("month", { ascending: true })
    .limit(months)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]

  const trend = (runs ?? []).map((r) => ({
    period: `${MONTHS[r.month - 1]} ${r.year}`,
    month: r.month,
    year: r.year,
    gross: Number(r.total_gross) || 0,
    deductions: Number(r.total_deductions) || 0,
    net: Number(r.total_net) || 0,
    employees: Number(r.total_employees) || 0,
  }))

  return NextResponse.json(trend)
}
