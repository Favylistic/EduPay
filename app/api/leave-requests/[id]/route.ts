import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { writeAuditLog } from "@/lib/audit"

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

// GET /api/leave-requests/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("leave_requests")
    .select(JOINS)
    .eq("id", id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

// PUT /api/leave-requests/[id] — approve / reject / cancel
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  // Get the current user's profile id for reviewed_by
  const { data: { user } } = await supabase.auth.getUser()
  const reviewerId = user?.id ?? null

  const updatePayload: Record<string, unknown> = {
    status: body.status,
    reviewer_notes: body.reviewer_notes ?? null,
  }

  if (body.status === "approved" || body.status === "rejected") {
    updatePayload.reviewed_by = reviewerId
    updatePayload.reviewed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from("leave_requests")
    .update(updatePayload)
    .eq("id", id)
    .select(JOINS)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Send notification to the employee
  if (data.employee?.profile?.id) {
    const leaveTypeName = data.leave_type?.name ?? "leave"
    const statusLabel = body.status === "approved" ? "approved" : body.status === "rejected" ? "rejected" : "updated"
    const notifType = body.status === "approved" ? "leave_approved"
      : body.status === "rejected" ? "leave_rejected"
      : "general"

    await supabase.from("notifications").insert({
      user_id: data.employee.profile.id,
      type: notifType,
      title: `Leave Request ${statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}`,
      message: `Your ${leaveTypeName} request (${data.start_date} – ${data.end_date}) has been ${statusLabel}.${body.reviewer_notes ? ` Note: ${body.reviewer_notes}` : ""}`,
      reference_id: id,
    })
  }

  // Write audit log for leave status changes
  const auditAction =
    body.status === "approved" ? "leave_approved" as const :
    body.status === "rejected" ? "leave_rejected" as const :
    "leave_cancelled" as const
  await writeAuditLog(auditAction, "leave_request", id, {
    new_status: body.status,
    employee_id: data.employee?.employee_id,
  })

  return NextResponse.json(data)
}
