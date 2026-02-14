import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentEmployees } from "@/components/dashboard/recent-employees"
import type { Employee } from "@/lib/types"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [employeesRes, departmentsRes, designationsRes, recentRes] =
    await Promise.all([
      supabase.from("employees").select("id, is_active"),
      supabase.from("departments").select("id").eq("is_active", true),
      supabase.from("designations").select("id").eq("is_active", true),
      supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  const employees = employeesRes.data ?? []
  const totalEmployees = employees.length
  const activeEmployees = employees.filter((e) => e.is_active).length
  const totalDepartments = departmentsRes.data?.length ?? 0
  const totalDesignations = designationsRes.data?.length ?? 0
  const recentEmployees = (recentRes.data ?? []) as Employee[]

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
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentEmployees employees={recentEmployees} />
        </div>
      </div>
    </>
  )
}
