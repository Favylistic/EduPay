import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { EmployeesTable } from "@/components/employees/employees-table"
import type { Profile } from "@/lib/types"

export const metadata: Metadata = {
  title: "Employees",
}

export default async function EmployeesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/auth/login")

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Employees" },
        ]}
      />
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Employee Directory</h1>
          <p className="text-muted-foreground mt-1">
            Manage all employees, their departments, designations, and personal details.
          </p>
        </div>
        <EmployeesTable profile={profile as Profile} />
      </div>
    </>
  )
}
