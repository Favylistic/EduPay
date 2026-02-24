"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Pencil, Trash2, Search, UserPlus } from "lucide-react"
import { toast } from "sonner"
import type { Employee, Profile } from "@/lib/types"
import { STAFF_TYPE_LABELS, EMPLOYMENT_STATUS_LABELS, formatCurrency, getInitials } from "@/lib/types"
import { EmployeeDialog } from "./employee-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    const json = await r.json()
    if (!r.ok) throw new Error(json.error || "Failed to fetch")
    return json
  })

export function EmployeesTable({ profile }: { profile: Profile }) {
  const { data: employees, error: fetchError, mutate } = useSWR<Employee[]>("/api/employees", fetcher)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [staffTypeFilter, setStaffTypeFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const isAdmin = profile.role === "super_admin" || profile.role === "hr_manager"

  const safeEmployees = Array.isArray(employees) ? employees : []
  const filtered = safeEmployees.filter((emp) => {
    const fullName = `${emp.profile?.first_name ?? ""} ${emp.profile?.last_name ?? ""}`.toLowerCase()
    const matchesSearch =
      !search ||
      fullName.includes(search.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      (emp.profile?.email ?? "").toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || emp.employment_status === statusFilter
    const matchesType = staffTypeFilter === "all" || emp.staff_type === staffTypeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  async function handleDelete() {
    if (!deleteId) return
    const res = await fetch(`/api/employees/${deleteId}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Employee deleted successfully")
      mutate()
    } else {
      toast.error("Failed to delete employee")
    }
    setDeleteId(null)
  }

  function getStaffTypeBadge(type: string) {
    return (
      <Badge variant="outline" className={type === "academic" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground"}>
        {STAFF_TYPE_LABELS[type as keyof typeof STAFF_TYPE_LABELS] ?? type}
      </Badge>
    )
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      active: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400",
      inactive: "bg-muted text-muted-foreground",
      terminated: "bg-destructive/10 text-destructive border-destructive/20",
    }
    return (
      <Badge variant="outline" className={styles[status] ?? ""}>
        {EMPLOYMENT_STATUS_LABELS[status as keyof typeof EMPLOYMENT_STATUS_LABELS] ?? status}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
          <Select value={staffTypeFilter} onValueChange={setStaffTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Staff Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="non_academic">Non-Academic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              setEditingEmployee(null)
              setDialogOpen(true)
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Employee</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Department</TableHead>
              <TableHead className="font-semibold hidden lg:table-cell">Designation</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">Staff Type</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold hidden lg:table-cell">Base Salary</TableHead>
              {isAdmin && <TableHead className="font-semibold w-[50px]"><span className="sr-only">Actions</span></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!employees ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="h-24 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="h-24 text-center text-muted-foreground">
                  No employees found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/employees/${emp.id}`}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(emp.profile?.first_name ?? null, emp.profile?.last_name ?? null)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {emp.profile?.first_name ?? ""} {emp.profile?.last_name ?? ""}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">{emp.employee_id}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {emp.department?.name ?? "-"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {emp.designation?.title ?? "-"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{getStaffTypeBadge(emp.staff_type)}</TableCell>
                  <TableCell>{getStatusBadge(emp.employment_status)}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {formatCurrency(emp.base_salary)}
                    <span className="text-xs text-muted-foreground ml-1">/{emp.salary_basis}</span>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingEmployee(emp)
                              setDialogOpen(true)
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {profile.role === "super_admin" && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(emp.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Employee Dialog */}
      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={editingEmployee}
        onSuccess={() => {
          mutate()
          setDialogOpen(false)
          setEditingEmployee(null)
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this employee? This action cannot be undone and will
              permanently remove their record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
