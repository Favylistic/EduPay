import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentEmployees } from "@/components/dashboard/recent-employees"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Employee } from "@/lib/types"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [employeesRes, departmentsRes, designationsRes, recentRes, deptBreakdownRes] =
    await Promise.all([
      supabase.from("employees").select("id, is_active, base_salary"),
      supabase.from("departments").select("id").eq("is_active", true),
      supabase.from("designations").select("id").eq("is_active", true),
      supabase
        .from("employees")
        .select("*, profile:profiles(id, first_name, last_name, email)")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("departments")
        .select("id, name, is_active")
        .eq("is_active", true)
        .order("name"),
    ])

  const employees = employeesRes.data ?? []
  const totalEmployees = employees.length
  const activeEmployees = employees.filter((e) => e.is_active).length
  const totalPayroll = employees
    .filter((e) => e.is_active)
    .reduce((sum, e) => sum + (Number(e.base_salary) || 0), 0)
  const totalDepartments = departmentsRes.data?.length ?? 0
  const totalDesignations = designationsRes.data?.length ?? 0
  const recentEmployees = (recentRes.data ?? []) as Employee[]
  const departments = deptBreakdownRes.data ?? []

  return (
    <>
      <DashboardHeader breadcrumbs={[{ label: "Dashboard" }]} />
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your school payroll system
          </p>
        </div>
        <StatsCards
          totalEmployees={totalEmployees}
          activeEmployees={activeEmployees}
          totalDepartments={totalDepartments}
          totalDesignations={totalDesignations}
          totalPayroll={totalPayroll}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentEmployees employees={recentEmployees} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Departments</CardTitle>
              <CardDescription>Active departments in the organization</CardDescription>
            </CardHeader>
            <CardContent>
              {departments.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No departments created yet.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{dept.name}</span>
                      <Badge variant="secondary" className="text-xs">Active</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
