import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("employees")
    .select("*, department:departments(id, name), designation:designations(id, title)")
    .order("last_name")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("employees")
    .insert({
      employee_id: body.employee_id,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone || null,
      date_of_birth: body.date_of_birth || null,
      gender: body.gender || null,
      address: body.address || null,
      department_id: body.department_id || null,
      designation_id: body.designation_id || null,
      employment_type: body.employment_type || "full_time",
      date_of_joining: body.date_of_joining || new Date().toISOString().split("T")[0],
      basic_salary: body.basic_salary || 0,
      bank_name: body.bank_name || null,
      bank_account_number: body.bank_account_number || null,
      tax_id: body.tax_id || null,
      is_active: body.is_active ?? true,
    })
    .select("*, department:departments(id, name), designation:designations(id, title)")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data, { status: 201 })
}
