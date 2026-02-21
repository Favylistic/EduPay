import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("employees")
    .select("*, profile:profiles(id, first_name, last_name, email), department:departments(id, name), designation:designations(id, title)")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Flatten profile data into each employee for the frontend
  const employees = (data ?? []).map((emp) => ({
    ...emp,
    first_name: emp.profile?.first_name ?? "",
    last_name: emp.profile?.last_name ?? "",
    email: emp.profile?.email ?? emp.employee_id,
  }))

  return NextResponse.json(employees)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("employees")
    .insert({
      employee_id: body.employee_id,
      profile_id: body.profile_id || null,
      phone: body.phone || null,
      date_of_birth: body.date_of_birth || null,
      gender: body.gender || null,
      address: body.address || null,
      department_id: body.department_id || null,
      designation_id: body.designation_id || null,
      staff_type: body.staff_type || "non_academic",
      employment_status: body.employment_status || "active",
      date_joined: body.date_joined || new Date().toISOString().split("T")[0],
      base_salary: body.base_salary || 0,
      salary_basis: body.salary_basis || "monthly",
      bank_name: body.bank_name || null,
      bank_account_number: body.bank_account_number || null,
      tax_id: body.tax_id || null,
      is_active: body.is_active ?? true,
    })
    .select("*, profile:profiles(id, first_name, last_name, email), department:departments(id, name), designation:designations(id, title)")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data, { status: 201 })
}
