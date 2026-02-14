import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DesignationsTable } from "@/components/designations/designations-table"
import { canManageEmployees, canDeleteRecords } from "@/lib/types"
import type { Profile } from "@/lib/types"

export const metadata: Metadata = {
  title: "Designations",
}

export default async function DesignationsPage() {
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

  const typedProfile = profile as Profile

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Designations" },
        ]}
      />
      <div className="flex-1 space-y-6 p-6">
        <DesignationsTable
          canManage={canManageEmployees(typedProfile.role)}
          canDelete={canDeleteRecords(typedProfile.role)}
        />
      </div>
    </>
  )
}
