import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MessagingInterface } from "@/components/messaging/messaging-interface"

export const metadata: Metadata = {
  title: "Messages",
  description: "Direct messages with HR",
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Fetch HR managers for recipient selection
  const { data: hrManagers } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .in("role", ["hr_manager", "super_admin"])

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Messages" },
        ]}
      />
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground">
            Send and receive messages from HR
          </p>
        </div>

        <MessagingInterface currentUserId={user.id} hrManagers={hrManagers ?? []} />
      </div>
    </>
  )
}
