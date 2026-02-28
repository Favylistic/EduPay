import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SetupWarning } from "@/components/dashboard/setup-warning"
import { AdminOverviewCards } from "@/components/dashboard/admin-overview-cards"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentEmployees } from "@/components/dashboard/recent-employees"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Employee } from "@/lib/types"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()

  // Employee dashboard (non-admin)
  if (profile?.role === "teacher" || profile?.role === "staff") {
    const { data: empData } = await supabase
      .from("employees")
      .select("id, profile_id")
      .eq("profile_id", user.id)
      .single()

    if (!empData) {
      return (
        <>
          <DashboardHeader breadcrumbs={[{ label: "Dashboard" }]} />
          <div className="flex-1 space-y-6 p-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">No employee profile found. Contact HR.</p>
            </div>
          </div>
        </>
      )
    }

    const employeeId = empData.id
    const today = new Date().toISOString().split("T")[0]

    const [todayAttendance, leaves, payslips] = await Promise.all([
      supabase
        .from("attendance_records")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("date", today)
        .single(),
      supabase
        .from("leave_requests")
        .select("id, start_date, end_date, status, leave_type:leave_types(name)")
        .eq("employee_id", employeeId)
        .in("status", ["approved", "pending"])
        .order("start_date", { ascending: false })
        .limit(5),
      supabase
        .from("payslips")
        .select("id, month, year, net_pay, payroll_run:payroll_runs(month, year)")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })
        .limit(3),
    ])

    return (
      <>
        <DashboardHeader breadcrumbs={[{ label: "Dashboard" }]} />
        <div className="flex-1 space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome Back</h1>
            <p className="text-sm text-muted-foreground">
              View your attendance, leaves, and payslips
            </p>
          </div>

          <SetupWarning />

          {/* Quick attendance status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {todayAttendance.data ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant="outline">
                      {todayAttendance.data.status?.toUpperCase() || "NOT SET"}
                    </Badge>
                  </div>
                  {todayAttendance.data.check_in_time && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Check In:</span>
                      <span className="font-mono">
                        {new Date(todayAttendance.data.check_in_time).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  {todayAttendance.data.check_out_time && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Check Out:</span>
                      <span className="font-mono">
                        {new Date(todayAttendance.data.check_out_time).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No attendance marked yet today</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Leave Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">My Leaves</CardTitle>
                <CardDescription>Active and pending leave requests</CardDescription>
              </CardHeader>
              <CardContent>
                {leaves.data && leaves.data.length > 0 ? (
                  <div className="space-y-3">
                    {leaves.data.map((leave: any) => (
                      <div key={leave.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{leave.leave_type?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {leave.start_date} to {leave.end_date}
                          </p>
                        </div>
                        <Badge variant={leave.status === "approved" ? "secondary" : "outline"}>
                          {leave.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active or pending leaves</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Payslips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Payslips</CardTitle>
                <CardDescription>Your last 3 payslips</CardDescription>
              </CardHeader>
              <CardContent>
                {payslips.data && payslips.data.length > 0 ? (
                  <div className="space-y-3">
                    {payslips.data.map((slip: any) => (
                      <div key={slip.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <p className="text-sm font-medium">
                          {slip.payroll_run?.month}/{slip.payroll_run?.year}
                        </p>
                        <p className="text-sm font-semibold">
                          ${slip.net_pay?.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No payslips available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    )
  }

  // Admin dashboard (existing code)
  // Fetch admin overview metrics in parallel
  const today = new Date().toISOString().split("T")[0]

  const [
    employeesRes,
    departmentsRes,
    designationsRes,
    recentRes,
    deptBreakdownRes,
    presentRes,
    pendingLeavesRes,
    unreadMessagesRes,
  ] = await Promise.all([
    supabase.from("employees").select("id, is_active, base_salary"),
    supabase.from("departments").select("id").eq("is_active", true),
    supabase.from("designations").select("id").eq("is_active", true),
    supabase
      .from("employees")
      .select("*, profile:profiles(id, first_name, last_name, email)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("departments")
      .select("id, name, is_active")
      .eq("is_active", true)
      .order("name"),
    // Present employees today (have check_in_time)
    supabase
      .from("attendance_records")
      .select("id", { count: "exact", head: true })
      .eq("date", today)
      .not("check_in_time", "is", null),
    // Pending leave requests
    supabase
      .from("leave_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    // Unread messages for current user
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .is("read_at", null),
  ])

  const employees = employeesRes.data ?? []
  const totalEmployees = employees.length
  const activeEmployees = employees.filter((e) => e.is_active).length
  const totalPayroll = employees
    .filter((e) => e.is_active)
    .reduce((sum, e) => sum + (Number(e.base_salary) || 0), 0)
  const totalDepartments = departmentsRes.data?.length ?? 0
  const totalDesignations = designationsRes.data?.length ?? 0
  const recentEmployees = (recentRes.data ?? []) as Employee[]
  const departments = deptBreakdownRes.data ?? []

  // Calculate admin overview metrics
  const presentEmployees = presentRes.count ?? 0
  const absentEmployees = Math.max(0, activeEmployees - presentEmployees)
  const pendingLeaves = pendingLeavesRes.count ?? 0
  const unreadMessages = unreadMessagesRes.count ?? 0

  return (
    <>
      <DashboardHeader breadcrumbs={[{ label: "Dashboard" }]} />
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your school payroll system
          </p>
        </div>

        <SetupWarning />

        {/* Admin Overview Metrics */}
        <AdminOverviewCards
          presentEmployees={presentEmployees}
          absentEmployees={absentEmployees}
          pendingLeaves={pendingLeaves}
          unreadMessages={unreadMessages}
        />

        {/* Full Stats Cards */}
        <StatsCards
          totalEmployees={totalEmployees}
          activeEmployees={activeEmployees}
          totalDepartments={totalDepartments}
          totalDesignations={totalDesignations}
          totalPayroll={totalPayroll}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentEmployees employees={recentEmployees} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Departments</CardTitle>
              <CardDescription>Active departments in the organization</CardDescription>
            </CardHeader>
            <CardContent>
              {departments.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No departments created yet.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{dept.name}</span>
                      <Badge variant="secondary" className="text-xs">Active</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
