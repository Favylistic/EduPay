import dynamic from "next/dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import type { Profile } from "@/lib/types"

const AppSidebar = dynamic(
  () => import("@/components/dashboard/app-sidebar").then((mod) => mod.AppSidebar),
  { ssr: false }
)

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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // If profile query fails, construct a fallback profile from auth metadata
  // instead of redirecting to login (which causes an infinite redirect loop
  // because the middleware sees the user is authenticated and sends them back).
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
