"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import type { SalaryComponent, UserRole } from "@/lib/types"
import { formatCurrency } from "@/lib/types"
import { SalaryComponentDialog } from "./salary-component-dialog"

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => Array.isArray(d) ? d : [])

interface Props { role: UserRole }

const APPLIES_TO_LABELS: Record<string, string> = {
  all: "All Employees",
  academic: "Academic",
  non_academic: "Non-Academic",
}

export function SalaryComponentsTable({ role }: Props) {
  const { data: components, mutate } = useSWR<SalaryComponent[]>("/api/salary-components", fetcher)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SalaryComponent | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const canManage = role === "super_admin" || role === "hr_manager"

  const safeComponents = Array.isArray(components) ? components : []
  const filtered = safeComponents.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )
  const earnings = filtered.filter((c) => c.type === "earning")
  const deductions = filtered.filter((c) => c.type === "deduction")

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/salary-components/${deleteId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Component deleted")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setDeleteId(null)
    }
  }

  function ComponentSection({ title, items, icon: Icon, colorClass }: {
    title: string
    items: SalaryComponent[]
    icon: typeof TrendingUp
    colorClass: string
  }) {
    return (
      <div className="rounded-lg border bg-card">
        <div className={`flex items-center gap-2 px-4 py-3 border-b ${colorClass}`}>
          <Icon className="h-4 w-4" />
          <span className="font-semibold text-sm">{title}</span>
          <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Calculation</TableHead>
              <TableHead className="font-semibold">Value</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Applies To</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              {canManage && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} className="h-20 text-center text-muted-foreground text-sm">
                  No {title.toLowerCase()} components yet.
                </TableCell>
              </TableRow>
            ) : items.map((comp) => (
              <TableRow key={comp.id}>
                <TableCell>
                  <p className="font-medium text-sm">{comp.name}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {comp.calculation_type === "percentage_of_base" ? "% of Base" : "Fixed"}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {comp.calculation_type === "percentage_of_base"
                    ? `${comp.value}%`
                    : formatCurrency(comp.value)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20">
                    {APPLIES_TO_LABELS[comp.applies_to] ?? comp.applies_to}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={comp.is_active ? "default" : "secondary"}>
                    {comp.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                {canManage && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditing(comp); setDialogOpen(true) }}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(comp.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {canManage && (
          <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" /> Add Component
          </Button>
        )}
      </div>

      <ComponentSection title="Earnings" items={earnings} icon={TrendingUp} colorClass="text-green-700 dark:text-green-400" />
      <ComponentSection title="Deductions" items={deductions} icon={TrendingDown} colorClass="text-destructive" />

      <SalaryComponentDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null) }}
        component={editing}
        onSuccess={() => mutate()}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete salary component?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the component from future payroll calculations. Historical payslips are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
