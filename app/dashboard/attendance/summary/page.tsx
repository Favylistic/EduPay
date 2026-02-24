import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AttendanceSummaryView } from "@/components/attendance/attendance-summary-view"

export const metadata = {
  title: "Attendance Summary | EduPay",
  description: "Monthly attendance summary and trends",
}

export default async function AttendanceSummaryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/auth/login")

  const { data: employee } = await supabase
    .from("employees")
    .select("id, employee_id")
    .eq("profile_id", user.id)
    .maybeSingle()

  const isAdmin = profile.role === "super_admin" || profile.role === "hr_manager"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Monthly Summary</h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Organisation-wide attendance trends by month."
            : "Your personal attendance breakdown by month."}
        </p>
      </div>
      <AttendanceSummaryView
        myEmployeeId={employee?.id ?? null}
        isAdmin={isAdmin}
      />
    </div>
  )
}
