import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { RunPayrollWizard } from "@/components/payroll/run-payroll-wizard"

export default async function RunPayrollPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!profile || !["super_admin", "hr_manager"].includes(profile.role)) {
    redirect("/dashboard/payroll")
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <DashboardHeader breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Payroll", href: "/dashboard/payroll" },
        { label: "Run Payroll" },
      ]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Run Payroll</h1>
        <p className="text-muted-foreground mt-1">
          Calculate and commit monthly salaries for all active employees.
        </p>
      </div>
      <RunPayrollWizard />
    </div>
  )
}
