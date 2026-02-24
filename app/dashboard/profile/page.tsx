import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProfileEditForm } from "@/components/profile/profile-edit-form"

export const metadata: Metadata = {
  title: "My Profile",
  description: "Edit your personal profile information",
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error || !profile) redirect("/dashboard")

  const { data: employee } = await supabase
    .from("employees")
    .select("*, department:departments(name), designation:designations(title)")
    .eq("profile_id", user.id)
    .single()

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Profile" },
        ]}
      />
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Profile</h1>
          <p className="text-sm text-muted-foreground">
            View and edit your personal information
          </p>
        </div>

        <ProfileEditForm profile={profile} employee={employee} />
      </div>
    </>
  )
}
