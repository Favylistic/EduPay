import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// PUT /api/attendance/[id] — check-out or edit
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("attendance_records")
    .update({
      check_out: body.check_out ?? null,
      status: body.status,
      notes: body.notes ?? null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
    })
    .eq("id", id)
    .select("*, employee:employees(id, employee_id, profile:profiles(id, first_name, last_name))")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// DELETE /api/attendance/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase.from("attendance_records").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
