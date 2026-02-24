import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/analytics/department-distribution
// Returns employee count and total base salary per active department
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!profile || !["super_admin", "hr_manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: employees, error } = await supabase
    .from("employees")
    .select("department_id, base_salary, staff_type, department:departments(id, name)")
    .eq("is_active", true)
    .eq("employment_status", "active")

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Group by department
  const map = new Map<string, { name: string; count: number; total_salary: number; academic: number; non_academic: number }>()

  for (const emp of employees ?? []) {
    const dept = emp.department as { id: string; name: string } | null
    const key = dept?.id ?? "unassigned"
    const name = dept?.name ?? "Unassigned"
    const existing = map.get(key)
    if (existing) {
      existing.count++
      existing.total_salary += Number(emp.base_salary) || 0
      if (emp.staff_type === "academic") existing.academic++
      else existing.non_academic++
    } else {
      map.set(key, {
        name,
        count: 1,
        total_salary: Number(emp.base_salary) || 0,
        academic: emp.staff_type === "academic" ? 1 : 0,
        non_academic: emp.staff_type === "non_academic" ? 1 : 0,
      })
    }
  }

  const distribution = Array.from(map.entries())
    .map(([id, data]) => ({
      department_id: id,
      department: data.name,
      employee_count: data.count,
      total_salary: Math.round(data.total_salary * 100) / 100,
      avg_salary: data.count > 0 ? Math.round((data.total_salary / data.count) * 100) / 100 : 0,
      academic: data.academic,
      non_academic: data.non_academic,
    }))
    .sort((a, b) => b.employee_count - a.employee_count)

  return NextResponse.json(distribution)
}
