import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/attendance/summary?month=YYYY-MM&employee_id=...
// Returns per-day counts grouped by week for the monthly chart
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7)
  const employeeId = searchParams.get("employee_id")

  const [year, m] = month.split("-")
  const startDate = `${year}-${m}-01`
  const lastDay = new Date(Number(year), Number(m), 0).getDate()
  const endDate = `${year}-${m}-${String(lastDay).padStart(2, "0")}`

  let query = supabase
    .from("attendance_records")
    .select("date, status")
    .gte("date", startDate)
    .lte("date", endDate)

  if (employeeId) query = query.eq("employee_id", employeeId)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Group by week number within the month
  const weeks: Record<string, Record<string, number>> = {}
  for (const record of data ?? []) {
    const day = parseInt(record.date.split("-")[2])
    const weekNum = Math.ceil(day / 7)
    const weekKey = `Week ${weekNum}`
    if (!weeks[weekKey]) {
      weeks[weekKey] = { present: 0, absent: 0, late: 0, half_day: 0, on_leave: 0 }
    }
    weeks[weekKey][record.status] = (weeks[weekKey][record.status] ?? 0) + 1
  }

  // Also return overall totals
  const totals: Record<string, number> = { present: 0, absent: 0, late: 0, half_day: 0, on_leave: 0 }
  for (const record of data ?? []) {
    totals[record.status] = (totals[record.status] ?? 0) + 1
  }

  const chartData = Object.entries(weeks).map(([week, counts]) => ({
    week,
    ...counts,
  }))

  return NextResponse.json({ chartData, totals, month })
}
