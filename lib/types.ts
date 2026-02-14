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
  head_of_department: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined fields
  head_profile?: Profile | null
  employee_count?: number
}

export interface Designation {
  id: string
  title: string
  description: string | null
  base_salary_min: number | null
  base_salary_max: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  employee_count?: number
}

export interface Employee {
  id: string
  profile_id: string | null
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  date_of_birth: string | null
  gender: "male" | "female" | "other" | null
  address: string | null
  department_id: string | null
  designation_id: string | null
  employment_type: "full_time" | "part_time" | "contract"
  date_of_joining: string
  basic_salary: number
  bank_name: string | null
  bank_account_number: string | null
  tax_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined fields
  department?: Department | null
  designation?: Designation | null
  profile?: Profile | null
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  hr_manager: "HR Manager",
  teacher: "Teacher",
  staff: "Staff",
}

export const EMPLOYMENT_TYPE_LABELS: Record<Employee["employment_type"], string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
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
