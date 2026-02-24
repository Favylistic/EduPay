import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("employees")
    .select(
      "*, profile:profiles(id, first_name, last_name, email), department:departments(id, name), designation:designations(id, title)"
    )
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  return NextResponse.json(data)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("employees")
    .update({
      employee_id: body.employee_id,
      phone: body.phone || null,
      date_of_birth: body.date_of_birth || null,
      gender: body.gender || null,
      address: body.address || null,
      department_id: body.department_id || null,
      designation_id: body.designation_id || null,
      staff_type: body.staff_type || "non_academic",
      employment_status: body.employment_status || "active",
      date_joined: body.date_joined,
      base_salary: body.base_salary || 0,
      salary_basis: body.salary_basis || "monthly",
      bank_name: body.bank_name || null,
      bank_account_number: body.bank_account_number || null,
      tax_id: body.tax_id || null,
      emergency_contact_name: body.emergency_contact_name || null,
      emergency_contact_phone: body.emergency_contact_phone || null,
      notes: body.notes || null,
      is_active: body.is_active,
    })
    .eq("id", id)
    .select(
      "*, profile:profiles(id, first_name, last_name, email), department:departments(id, name), designation:designations(id, title)"
    )
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase.from("employees").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
