import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  getInitials,
  STAFF_TYPE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  SALARY_BASIS_LABELS,
  formatCurrency,
  canManageEmployees,
} from "@/lib/types"
import type { Employee, Profile } from "@/lib/types"
import { EmployeeDetailActions } from "@/components/employees/employee-detail-actions"

export const metadata: Metadata = {
  title: "Employee Profile",
}

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const [profileRes, employeeRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("employees")
      .select(
        "*, profile:profiles(id, first_name, last_name, email), department:departments(id, name), designation:designations(id, title)"
      )
      .eq("id", id)
      .single(),
  ])

  if (employeeRes.error || !employeeRes.data) {
    notFound()
  }

  const currentProfile: Profile = profileRes.data ?? {
    id: user.id,
    first_name: user.user_metadata?.first_name ?? "User",
    last_name: user.user_metadata?.last_name ?? "",
    role: user.user_metadata?.role ?? "staff",
    email: user.email ?? "",
    avatar_url: null,
    created_at: user.created_at,
    updated_at: user.created_at,
  }

  const emp = employeeRes.data as Employee
  const fullName = `${emp.profile?.first_name ?? ""} ${emp.profile?.last_name ?? ""}`.trim() || emp.employee_id
  const isAdmin = canManageEmployees(currentProfile.role)

  const statusStyles: Record<string, string> = {
    active: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400",
    inactive: "bg-muted text-muted-foreground",
    terminated: "bg-destructive/10 text-destructive border-destructive/20",
  }

  function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{value || "—"}</span>
      </div>
    )
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Employees", href: "/dashboard/employees" },
          { label: fullName },
        ]}
      />
      <div className="flex-1 space-y-6 p-6">
        {/* Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    {getInitials(emp.profile?.first_name ?? null, emp.profile?.last_name ?? null)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h1 className="text-xl font-semibold tracking-tight">{fullName}</h1>
                  <p className="text-sm text-muted-foreground">{emp.profile?.email ?? "—"}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                      {emp.employee_id}
                    </code>
                    <Badge variant="outline" className={statusStyles[emp.employment_status] ?? ""}>
                      {EMPLOYMENT_STATUS_LABELS[emp.employment_status] ?? emp.employment_status}
                    </Badge>
                    <Badge variant="secondary">
                      {STAFF_TYPE_LABELS[emp.staff_type] ?? emp.staff_type}
                    </Badge>
                  </div>
                </div>
              </div>
              {isAdmin && (
                <EmployeeDetailActions employee={emp} />
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Employment Details</CardTitle>
              <CardDescription>Role, department, and tenure information</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <DetailRow label="Department" value={emp.department?.name} />
              <DetailRow label="Designation" value={emp.designation?.title} />
              <DetailRow label="Staff Type" value={STAFF_TYPE_LABELS[emp.staff_type]} />
              <DetailRow label="Employment Status" value={EMPLOYMENT_STATUS_LABELS[emp.employment_status]} />
              <DetailRow
                label="Date Joined"
                value={emp.date_joined
                  ? new Date(emp.date_joined).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : null}
              />
              <DetailRow label="Active" value={emp.is_active ? "Yes" : "No"} />
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
              <CardDescription>Contact and personal details</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <DetailRow label="Phone" value={emp.phone} />
              <DetailRow label="Gender" value={emp.gender ? emp.gender.charAt(0).toUpperCase() + emp.gender.slice(1) : null} />
              <DetailRow
                label="Date of Birth"
                value={emp.date_of_birth
                  ? new Date(emp.date_of_birth).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : null}
              />
              <div className="col-span-2">
                <DetailRow label="Address" value={emp.address} />
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Financial Details</CardTitle>
              <CardDescription>Salary and banking information</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <DetailRow
                label="Base Salary"
                value={`${formatCurrency(emp.base_salary)} / ${SALARY_BASIS_LABELS[emp.salary_basis] ?? emp.salary_basis}`}
              />
              <DetailRow label="Tax ID" value={emp.tax_id} />
              <DetailRow label="Bank Name" value={emp.bank_name} />
              <DetailRow label="Account Number" value={emp.bank_account_number} />
            </CardContent>
          </Card>

          {/* Emergency Contact & Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Emergency Contact & Notes</CardTitle>
              <CardDescription>Emergency contact and additional information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Contact Name" value={emp.emergency_contact_name} />
                <DetailRow label="Contact Phone" value={emp.emergency_contact_phone} />
              </div>
              {emp.notes && (
                <>
                  <Separator />
                  <DetailRow label="Notes" value={emp.notes} />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
