import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ApprovalsTable } from "@/components/leave/approvals-table"

export const metadata = {
  title: "Leave Approvals | EduPay",
  description: "Approve or reject employee leave requests",
}

export default async function LeaveApprovalsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  // Only admins/HR can access this page
  if (!profile || (profile.role !== "super_admin" && profile.role !== "hr_manager")) {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Leave Approvals</h1>
        <p className="text-sm text-muted-foreground">
          Review and action pending leave requests from employees.
        </p>
      </div>
      <ApprovalsTable />
    </div>
  )
}
