import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/analytics/attendance-trends?months=6
// Returns attendance status distribution per month for the last N months
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
  const months = Math.min(Math.max(parseInt(searchParams.get("months") ?? "6"), 2), 12)

  // Calculate date range
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const startStr = startDate.toISOString().split("T")[0]
  const endStr = endDate.toISOString().split("T")[0]

  const { data: records, error } = await supabase
    .from("attendance_records")
    .select("date, status")
    .gte("date", startStr)
    .lte("date", endStr)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Group by year-month
  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]

  const monthMap = new Map<string, {
    period: string
    present: number
    absent: number
    late: number
    half_day: number
    on_leave: number
  }>()

  // Initialize buckets in order
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    monthMap.set(key, {
      period: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      present: 0,
      absent: 0,
      late: 0,
      half_day: 0,
      on_leave: 0,
    })
  }

  for (const rec of records ?? []) {
    const key = rec.date.slice(0, 7) // "YYYY-MM"
    const bucket = monthMap.get(key)
    if (!bucket) continue
    const s = rec.status as string
    if (s === "present") bucket.present++
    else if (s === "absent") bucket.absent++
    else if (s === "late") bucket.late++
    else if (s === "half_day") bucket.half_day++
    else if (s === "on_leave") bucket.on_leave++
  }

  return NextResponse.json(Array.from(monthMap.values()))
}
