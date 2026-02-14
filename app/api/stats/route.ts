import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [employees, departments, designations] = await Promise.all([
    supabase.from("employees").select("id, is_active, basic_salary, employment_type", { count: "exact" }),
    supabase.from("departments").select("id", { count: "exact" }),
    supabase.from("designations").select("id", { count: "exact" }),
  ])

  const employeeList = employees.data ?? []
  const activeEmployees = employeeList.filter((e) => e.is_active).length
  const totalPayroll = employeeList
    .filter((e) => e.is_active)
    .reduce((sum, e) => sum + (Number(e.basic_salary) || 0), 0)

  return NextResponse.json({
    totalEmployees: employees.count ?? 0,
    activeEmployees,
    totalDepartments: departments.count ?? 0,
    totalDesignations: designations.count ?? 0,
    totalPayroll,
  })
}
