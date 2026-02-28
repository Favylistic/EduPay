import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { UsersTable } from "@/components/users/users-table"
import { CreateEmployeeDialog } from "@/components/users/create-employee-dialog"
import type { Profile } from "@/lib/types"

export const metadata: Metadata = {
  title: "User Management",
}

export default async function UsersPage() {
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

  const resolvedProfile: Profile = profile ?? {
    id: user.id,
    first_name: user.user_metadata?.first_name ?? "User",
    last_name: user.user_metadata?.last_name ?? "",
    role: user.user_metadata?.role ?? "staff",
    email: user.email ?? "",
    avatar_url: null,
    created_at: user.created_at,
    updated_at: user.created_at,
  }

  // Only super_admin and hr_manager can access this page
  if (!["super_admin", "hr_manager"].includes(resolvedProfile.role)) {
    redirect("/dashboard")
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "User Management" },
        ]}
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              User Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View all system users and manage their roles.
              {resolvedProfile.role !== "super_admin" && " Only Super Admins can change roles."}
            </p>
          </div>
          {resolvedProfile.role === "super_admin" && (
            <CreateEmployeeDialog />
          )}
        </div>
        <UsersTable
          currentUserId={resolvedProfile.id}
          isSuperAdmin={resolvedProfile.role === "super_admin"}
        />
      </div>
    </>
  )
}
