'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Loader2, UserPlus, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CreateEmployeeDialogProps {
  onSuccess?: () => void
}

export function CreateEmployeeDialog({ onSuccess }: CreateEmployeeDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [createdEmployee, setCreatedEmployee] = useState<any>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    designation: '',
    salary: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/admin/create-employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          department: formData.department || null,
          designation: formData.designation || null,
          salary: formData.salary || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create employee account')
        setLoading(false)
        return
      }

      setSuccess(true)
      setCreatedEmployee(data.user)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        designation: '',
        salary: '',
      })

      onSuccess?.()

      // Close dialog after 3 seconds
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setCreatedEmployee(null)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Create Employee Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Employee Account</DialogTitle>
          <DialogDescription>
            Add a new employee to the system. A temporary password will be generated and sent via email.
          </DialogDescription>
        </DialogHeader>

        {success && createdEmployee ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 dark:bg-green-950">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  Account Created Successfully!
                </p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Email invitation sent to {createdEmployee.email}
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-lg bg-muted p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Employee Name</p>
                <p className="font-semibold">
                  {createdEmployee.firstName} {createdEmployee.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Employee ID</p>
                <p className="font-mono font-semibold text-primary">{createdEmployee.employeeId}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Email</p>
                <p className="break-all text-sm">{createdEmployee.email}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              The employee will receive an email with their temporary credentials. They must change their password on first login.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@school.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="Mathematics"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  placeholder="Teacher"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Monthly Salary</Label>
              <Input
                id="salary"
                type="number"
                placeholder="50000"
                step="0.01"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                disabled={loading}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The employee will receive login credentials via email. They must change their temporary password on first login.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
