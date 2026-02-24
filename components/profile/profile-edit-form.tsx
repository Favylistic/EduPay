"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Profile, Employee } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface ProfileEditFormProps {
  profile: Profile
  employee: Employee | null
}

export function ProfileEditForm({ profile, employee }: ProfileEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error("Failed to update profile")

      toast({
        title: "Success",
        description: "Your profile has been updated",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Personal Information */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your name and contact details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="cursor-not-allowed opacity-60"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact HR to update.
              </p>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Employee Info Card */}
      {employee && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Employee Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Employee ID</p>
              <p className="font-semibold">{employee.employee_id}</p>
            </div>
            {employee.designation && (
              <div>
                <p className="text-muted-foreground mb-1">Position</p>
                <p className="font-semibold">{employee.designation.title}</p>
              </div>
            )}
            {employee.department && (
              <div>
                <p className="text-muted-foreground mb-1">Department</p>
                <p className="font-semibold">{employee.department.name}</p>
              </div>
            )}
            {employee.date_joined && (
              <div>
                <p className="text-muted-foreground mb-1">Date Joined</p>
                <p className="font-semibold">
                  {new Date(employee.date_joined).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
