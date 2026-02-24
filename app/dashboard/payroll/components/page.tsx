import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SalaryComponentsTable } from "@/components/payroll/salary-components-table"

export default async function SalaryComponentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !["super_admin", "hr_manager"].includes(profile.role)) {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <DashboardHeader breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Payroll", href: "/dashboard/payroll" },
        { label: "Salary Components" },
      ]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Salary Components</h1>
        <p className="text-muted-foreground mt-1">
          Configure earnings and deductions applied during payroll processing.
        </p>
      </div>
      <SalaryComponentsTable role={profile.role} />
    </div>
  )
}
