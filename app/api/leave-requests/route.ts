import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const JOINS = `
  *,
  employee:employees(
    id, employee_id,
    profile:profiles(id, first_name, last_name, email),
    department:departments(id, name)
  ),
  leave_type:leave_types(id, name),
  reviewer:profiles!leave_requests_reviewed_by_fkey(id, first_name, last_name)
`.trim()

// GET /api/leave-requests?status=pending&employee_id=...
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const employeeId = searchParams.get("employee_id")

  let query = supabase
    .from("leave_requests")
    .select(JOINS)
    .order("created_at", { ascending: false })

  if (status) query = query.eq("status", status)
  if (employeeId) query = query.eq("employee_id", employeeId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// POST /api/leave-requests — submit new leave request
export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  // Calculate total days (inclusive, weekdays only approximation)
  const start = new Date(body.start_date)
  const end = new Date(body.end_date)
  const diffTime = end.getTime() - start.getTime()
  const totalDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1)

  const { data, error } = await supabase
    .from("leave_requests")
    .insert({
      employee_id: body.employee_id,
      leave_type_id: body.leave_type_id,
      start_date: body.start_date,
      end_date: body.end_date,
      total_days: totalDays,
      reason: body.reason ?? null,
      status: "pending",
    })
    .select(JOINS)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Notify HR managers about the new leave request
  const { data: hrManagers } = await supabase
    .from("profiles")
    .select("id")
    .in("role", ["super_admin", "hr_manager"])

  if (hrManagers && hrManagers.length > 0) {
    const employeeName = `${data.employee?.profile?.first_name ?? ""} ${data.employee?.profile?.last_name ?? ""}`.trim()
    await supabase.from("notifications").insert(
      hrManagers.map((mgr) => ({
        user_id: mgr.id,
        type: "leave_pending",
        title: "New Leave Request",
        message: `${employeeName} submitted a ${data.leave_type?.name ?? "leave"} request for ${totalDays} day(s).`,
        reference_id: data.id,
      }))
    )
  }

  return NextResponse.json(data, { status: 201 })
}
