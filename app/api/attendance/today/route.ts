import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/attendance/today?employee_id=...
// Returns today's attendance record for a given employee (used by Time Clock)
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get("employee_id")

  if (!employeeId) {
    return NextResponse.json({ error: "employee_id is required" }, { status: 400 })
  }

  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("date", today)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
