"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { SalaryComponent } from "@/lib/types"

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["earning", "deduction"]),
  calculation_type: z.enum(["fixed", "percentage_of_base"]),
  value: z.coerce.number().min(0, "Value must be 0 or more"),
  applies_to: z.enum(["all", "academic", "non_academic"]),
  is_active: z.boolean(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  component: SalaryComponent | null
  onSuccess: () => void
}

export function SalaryComponentDialog({ open, onOpenChange, component, onSuccess }: Props) {
  const isEdit = !!component
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "earning",
      calculation_type: "fixed",
      value: 0,
      applies_to: "all",
      is_active: true,
    },
  })

  const calcType = form.watch("calculation_type")

  useEffect(() => {
    if (component) {
      form.reset({
        name: component.name,
        type: component.type,
        calculation_type: component.calculation_type,
        value: component.value,
        applies_to: component.applies_to,
        is_active: component.is_active,
      })
    } else {
      form.reset({
        name: "", type: "earning", calculation_type: "fixed",
        value: 0, applies_to: "all", is_active: true,
      })
    }
  }, [component, form])

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const url = isEdit ? `/api/salary-components/${component!.id}` : "/api/salary-components"
      const method = isEdit ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(isEdit ? "Component updated" : "Component created")
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Component" : "New Salary Component"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl><Input placeholder="e.g. Housing Allowance" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="earning">Earning</SelectItem>
                      <SelectItem value="deduction">Deduction</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="calculation_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Calculation</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="percentage_of_base">% of Base</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="value" render={({ field }) => (
              <FormItem>
                <FormLabel>{calcType === "percentage_of_base" ? "Percentage (%)" : "Amount ($)"}</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} />
                </FormControl>
                <FormDescription>
                  {calcType === "percentage_of_base"
                    ? "Percentage of the employee's base salary."
                    : "Fixed dollar amount per pay period."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="applies_to" render={({ field }) => (
              <FormItem>
                <FormLabel>Applies To</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    <SelectItem value="academic">Academic Staff</SelectItem>
                    <SelectItem value="non_academic">Non-Academic Staff</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="font-normal">Active</FormLabel>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : isEdit ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
