export type UserRole = "super_admin" | "hr_manager" | "teacher" | "staff"

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  name: string
  description: string | null
  head_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined fields
  head_profile?: Pick<Profile, "id" | "first_name" | "last_name" | "email"> | null
  employee_count?: number
}

export interface Designation {
  id: string
  title: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  employee_count?: number
}

export type EmploymentStatus = "active" | "inactive" | "terminated"
export type StaffType = "academic" | "non_academic"
export type SalaryBasis = "monthly" | "hourly"

export interface Employee {
  id: string
  profile_id: string | null
  employee_id: string
  department_id: string | null
  designation_id: string | null
  staff_type: StaffType
  date_of_birth: string | null
  gender: "male" | "female" | "other" | null
  phone: string | null
  address: string | null
  date_joined: string
  employment_status: EmploymentStatus
  salary_basis: SalaryBasis
  base_salary: number
  bank_name: string | null
  bank_account_number: string | null
  tax_id: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined fields from API
  profile?: Pick<Profile, "id" | "first_name" | "last_name" | "email"> | null
  department?: Pick<Department, "id" | "name"> | null
  designation?: Pick<Designation, "id" | "title"> | null
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  hr_manager: "HR Manager",
  teacher: "Teacher",
  staff: "Staff",
}

export const STAFF_TYPE_LABELS: Record<StaffType, string> = {
  academic: "Academic",
  non_academic: "Non-Academic",
}

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  terminated: "Terminated",
}

export const SALARY_BASIS_LABELS: Record<SalaryBasis, string> = {
  monthly: "Monthly",
  hourly: "Hourly",
}

export function canManageEmployees(role: UserRole): boolean {
  return role === "super_admin" || role === "hr_manager"
}

export function canDeleteRecords(role: UserRole): boolean {
  return role === "super_admin"
}

export function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.charAt(0)?.toUpperCase() ?? ""
  const l = lastName?.charAt(0)?.toUpperCase() ?? ""
  return f + l || "?"
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "---"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// ─── Phase 3: Attendance ──────────────────────────────────────────────────────

export type AttendanceStatus = "present" | "absent" | "late" | "half_day" | "on_leave"

export interface AttendanceRecord {
  id: string
  employee_id: string
  date: string
  check_in: string | null
  check_out: string | null
  status: AttendanceStatus
  latitude: number | null
  longitude: number | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  employee?: Pick<Employee, "id" | "employee_id"> & {
    profile?: Pick<Profile, "id" | "first_name" | "last_name"> | null
  }
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  half_day: "Half Day",
  on_leave: "On Leave",
}

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400",
  absent: "bg-destructive/10 text-destructive border-destructive/20",
  late: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400",
  half_day: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
  on_leave: "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400",
}

// ─── Phase 3: Leave ───────────────────────────────────────────────────────────

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled"

export interface LeaveType {
  id: string
  name: string
  description: string | null
  max_days_per_year: number
  is_active: boolean
  created_at: string
}

export interface LeaveRequest {
  id: string
  employee_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  total_days: number
  reason: string | null
  status: LeaveStatus
  reviewed_by: string | null
  reviewed_at: string | null
  reviewer_notes: string | null
  created_at: string
  updated_at: string
  // Joined
  employee?: Pick<Employee, "id" | "employee_id"> & {
    profile?: Pick<Profile, "id" | "first_name" | "last_name" | "email"> | null
    department?: Pick<Department, "id" | "name"> | null
  }
  leave_type?: Pick<LeaveType, "id" | "name"> | null
  reviewer?: Pick<Profile, "id" | "first_name" | "last_name"> | null
}

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
}

export const LEAVE_STATUS_COLORS: Record<LeaveStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400",
  approved: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground",
}

// ─── Phase 3: Notifications ──────────────────────────────────────────────────

export type NotificationType = "leave_approved" | "leave_rejected" | "leave_pending" | "leave_cancelled" | "general"

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  reference_id: string | null
  created_at: string
}
