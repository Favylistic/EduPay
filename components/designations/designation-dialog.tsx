"use client"

import { useState, useEffect } from "react"
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
import { Loader2 } from "lucide-react"
import type { Designation } from "@/lib/types"

interface DesignationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  designation?: Designation | null
  onSuccess: () => void
}

export function DesignationDialog({
  open,
  onOpenChange,
  designation,
  onSuccess,
}: DesignationDialogProps) {
  const isEdit = !!designation
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (designation) {
      setTitle(designation.title)
      setDescription(designation.description || "")
      setIsActive(designation.is_active)
    } else {
      setTitle("")
      setDescription("")
      setIsActive(true)
    }
    setError(null)
  }, [designation, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const body = { title, description, is_active: isActive }
    const url = isEdit ? `/api/designations/${designation.id}` : "/api/designations"
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Designation" : "Add Designation"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the designation details below."
              : "Fill in the details to create a new designation."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="desig-title">Title</Label>
            <Input
              id="desig-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Teacher"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="desig-desc">Description</Label>
            <Textarea
              id="desig-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="desig-active" className="text-sm font-medium">Active</Label>
              <p className="text-xs text-muted-foreground">
                Inactive designations are hidden from forms
              </p>
            </div>
            <Switch
              id="desig-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
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
        </form>
      </DialogContent>
    </Dialog>
  )
}
