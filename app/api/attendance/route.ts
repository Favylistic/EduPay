import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/attendance?date=YYYY-MM-DD&employee_id=...&month=YYYY-MM&page=1&limit=50
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const date = searchParams.get("date")
  const employeeId = searchParams.get("employee_id")
  const month = searchParams.get("month") // e.g. "2025-01"
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = parseInt(searchParams.get("limit") ?? "50")
  const offset = (page - 1) * limit

  let query = supabase
    .from("attendance_records")
    .select(
      "*, employee:employees(id, employee_id, profile:profiles(id, first_name, last_name))",
      { count: "exact" }
    )
    .order("date", { ascending: false })
    .order("check_in", { ascending: false })
    .range(offset, offset + limit - 1)

  if (date) query = query.eq("date", date)
  if (employeeId) query = query.eq("employee_id", employeeId)
  if (month) {
    const [year, m] = month.split("-")
    const startDate = `${year}-${m}-01`
    const endDate = new Date(Number(year), Number(m), 0).toISOString().split("T")[0]
    query = query.gte("date", startDate).lte("date", endDate)
  }

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data, count })
}

// POST /api/attendance — check-in
export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("attendance_records")
    .insert({
      employee_id: body.employee_id,
      date: body.date,
      check_in: body.check_in,
      status: body.status ?? "present",
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      notes: body.notes ?? null,
    })
    .select("*, employee:employees(id, employee_id, profile:profiles(id, first_name, last_name))")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
