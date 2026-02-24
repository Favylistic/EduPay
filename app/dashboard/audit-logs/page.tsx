import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { AuditLogTable } from "@/components/audit/audit-log-table"
import { Shield } from "lucide-react"

export const metadata: Metadata = {
  title: "Audit Logs",
  description: "Track all financial transactions and system actions for transparency and security",
}

export default async function AuditLogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "super_admin") {
    return (
      <>
        <DashboardHeader breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Audit Logs" },
        ]} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Shield className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Audit logs are restricted to Super Admins only.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Audit Logs" },
      ]} />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
            <p className="text-sm text-muted-foreground">
              Complete record of financial transactions and system actions
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Super Admin only</span>
          </div>
        </div>
        <AuditLogTable />
      </div>
    </>
  )
}
