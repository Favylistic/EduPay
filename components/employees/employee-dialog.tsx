"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import type { Employee, Department, Designation } from "@/lib/types"

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    const json = await r.json()
    if (!r.ok) throw new Error(json.error || "Failed to fetch")
    return json
  })

interface EmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: Employee | null
  onSuccess: () => void
}

export function EmployeeDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: EmployeeDialogProps) {
  const isEdit = !!employee
  const { data: departments } = useSWR<Department[]>("/api/departments", fetcher)
  const { data: designations } = useSWR<Designation[]>("/api/designations", fetcher)

  const [form, setForm] = useState({
    employee_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: "",
    department_id: "",
    designation_id: "",
    employment_type: "full_time",
    date_of_joining: new Date().toISOString().split("T")[0],
    basic_salary: "",
    bank_name: "",
    bank_account_number: "",
    tax_id: "",
    is_active: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (employee) {
      setForm({
        employee_id: employee.employee_id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone || "",
        date_of_birth: employee.date_of_birth || "",
        gender: employee.gender || "",
        address: employee.address || "",
        department_id: employee.department_id || "",
        designation_id: employee.designation_id || "",
        employment_type: employee.employment_type,
        date_of_joining: employee.date_of_joining,
        basic_salary: employee.basic_salary?.toString() || "",
        bank_name: employee.bank_name || "",
        bank_account_number: employee.bank_account_number || "",
        tax_id: employee.tax_id || "",
        is_active: employee.is_active,
      })
    } else {
      setForm({
        employee_id: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        date_of_birth: "",
        gender: "",
        address: "",
        department_id: "",
        designation_id: "",
        employment_type: "full_time",
        date_of_joining: new Date().toISOString().split("T")[0],
        basic_salary: "",
        bank_name: "",
        bank_account_number: "",
        tax_id: "",
        is_active: true,
      })
    }
    setError(null)
  }, [employee, open])

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const body = {
      ...form,
      basic_salary: form.basic_salary ? parseFloat(form.basic_salary) : 0,
      department_id: form.department_id || null,
      designation_id: form.designation_id || null,
      gender: form.gender || null,
      date_of_birth: form.date_of_birth || null,
    }

    const url = isEdit ? `/api/employees/${employee.id}` : "/api/employees"
    const method = isEdit ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Something went wrong")
      setLoading(false)
      return
    }

    setLoading(false)
    onOpenChange(false)
    onSuccess()
  }

  const activeDepartments = departments?.filter((d) => d.is_active) ?? []
  const activeDesignations = designations?.filter((d) => d.is_active) ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Employee" : "Add Employee"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the employee details below."
              : "Fill in the details to register a new employee."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <form
            id="employee-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
          >
            {/* Basic Info */}
            <fieldset className="flex flex-col gap-4 rounded-lg border p-4">
              <legend className="px-2 text-sm font-medium text-muted-foreground">
                Basic Information
              </legend>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="emp-id">Employee ID</Label>
                  <Input
                    id="emp-id"
                    value={form.employee_id}
                    onChange={(e) => updateField("employee_id", e.target.value)}
                    placeholder="EMP-001"
                    required
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="emp-email">Email</Label>
                  <Input
                    id="emp-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="john@school.edu"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="emp-fname">First Name</Label>
                  <Input
                    id="emp-fname"
                    value={form.first_name}
                    onChange={(e) => updateField("first_name", e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="emp-lname">Last Name</Label>
                  <Input
                    id="emp-lname"
                    value={form.last_name}
                    onChange={(e) => updateField("last_name", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="emp-phone">Phone</Label>
                  <Input
                    id="emp-phone"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="emp-dob">Date of Birth</Label>
                  <Input
                    id="emp-dob"
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => updateField("date_of_birth", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="emp-gender">Gender</Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => updateField("gender", v)}
                >
                  <SelectTrigger id="emp-gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="emp-address">Address</Label>
                <Textarea
                  id="emp-address"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  rows={2}
                />
              </div>
            </fieldset>

            {/* Employment Details */}
            <fieldset className="flex flex-col gap-4 rounded-lg border p-4">
              <legend className="px-2 text-sm font-medium text-muted-foreground">
                Employment Details
              </legend>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="emp-dept">Department</Label>
                  <Select
                    value={form.department_id}
                    onValueChange={(v) => updateField("department_id", v)}
                  >
                    <SelectTrigger id="emp-dept">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeDepartments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="emp-desig">Designation</Label>
                  <Select
                    value={form.designation_id}
                    onValueChange={(v) => updateField("designation_id", v)}
                  >
                    <SelectTrigger id="emp-desig">
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeDesignations.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="emp-type">Employment Type</Label>
                  <Select
                    value={form.employment_type}
                    onValueChange={(v) => updateField("employment_type", v)}
                  >
                    <SelectTrigger id="emp-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="emp-doj">Date of Joining</Label>
                  <Input
                    id="emp-doj"
                    type="date"
                    value={form.date_of_joining}
                    onChange={(e) => updateField("date_of_joining", e.target.value)}
                    required
                  />
                </div>
              </div>
            </fieldset>

            {/* Financial Details */}
            <fieldset className="flex flex-col gap-4 rounded-lg border p-4">
              <legend className="px-2 text-sm font-medium text-muted-foreground">
                Financial Details
              </legend>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="emp-salary">Basic Salary</Label>
                  <Input
                    id="emp-salary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.basic_salary}
                    onChange={(e) => updateField("basic_salary", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="emp-taxid">Tax ID</Label>
                  <Input
                    id="emp-taxid"
                    value={form.tax_id}
                    onChange={(e) => updateField("tax_id", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="emp-bank">Bank Name</Label>
                  <Input
                    id="emp-bank"
                    value={form.bank_name}
                    onChange={(e) => updateField("bank_name", e.target.value)}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="emp-acct">Account Number</Label>
                  <Input
                    id="emp-acct"
                    value={form.bank_account_number}
                    onChange={(e) => updateField("bank_account_number", e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="emp-active" className="text-sm font-medium">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive employees are excluded from payroll
                </p>
              </div>
              <Switch
                id="emp-active"
                checked={form.is_active}
                onCheckedChange={(v) => updateField("is_active", v)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">{error}</p>
            )}
          </form>
        </ScrollArea>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="employee-form" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
