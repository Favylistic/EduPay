import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import type { Profile } from "@/lib/types"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

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

  return (
    <SidebarProvider>
      <AppSidebar profile={resolvedProfile} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
