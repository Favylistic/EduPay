import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TimeClock } from "@/components/attendance/time-clock"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { History, BarChart2 } from "lucide-react"

export const metadata = {
  title: "Attendance | EduPay",
  description: "Time Clock and daily attendance tracking",
}

export default async function AttendancePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/auth/login")

  // Fetch the employee record linked to this profile
  const { data: employee } = await supabase
    .from("employees")
    .select("id, employee_id")
    .eq("profile_id", user.id)
    .maybeSingle()

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Unknown"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Time Clock</h1>
        <p className="text-sm text-muted-foreground">
          Record your daily check-in and check-out times.
        </p>
      </div>

      {employee ? (
        <TimeClock employeeId={employee.id} employeeName={fullName} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No employee record is linked to your account. Please contact HR.
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Attendance History
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pb-4">
            View your full attendance log with date filters.
          </CardContent>
          <CardContent className="pt-0">
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href="/dashboard/attendance/history">View History</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" />
              Monthly Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pb-4">
            View attendance trends and monthly breakdown charts.
          </CardContent>
          <CardContent className="pt-0">
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href="/dashboard/attendance/summary">View Summary</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
