"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
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
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { DesignationDialog } from "./designation-dialog"
import type { Designation } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatCurrency(val: number | null) {
  if (val === null || val === undefined) return "---"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(val)
}

interface DesignationsTableProps {
  canManage: boolean
  canDelete: boolean
}

export function DesignationsTable({ canManage, canDelete }: DesignationsTableProps) {
  const { data: designations, mutate } = useSWR<Designation[]>(
    "/api/designations",
    fetcher
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDesig, setEditDesig] = useState<Designation | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function handleEdit(desig: Designation) {
    setEditDesig(desig)
    setDialogOpen(true)
  }

  function handleAdd() {
    setEditDesig(null)
    setDialogOpen(true)
  }

  async function handleDelete() {
    if (!deleteId) return
    const res = await fetch(`/api/designations/${deleteId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      toast.success("Designation deleted")
      mutate()
    } else {
      const data = await res.json()
      toast.error(data.error || "Failed to delete")
    }
    setDeleteId(null)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Designations</h1>
          <p className="text-sm text-muted-foreground">
            Manage job titles and salary ranges
          </p>
        </div>
        {canManage && (
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Designation
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="hidden sm:table-cell">Salary Range</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!designations ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : designations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No designations found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              designations.map((desig) => (
                <TableRow key={desig.id}>
                  <TableCell className="font-medium">{desig.title}</TableCell>
                  <TableCell className="hidden max-w-[300px] truncate md:table-cell">
                    {desig.description || "---"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {desig.base_salary_min || desig.base_salary_max
                      ? `${formatCurrency(desig.base_salary_min)} - ${formatCurrency(desig.base_salary_max)}`
                      : "---"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={desig.is_active ? "default" : "secondary"}>
                      {desig.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(desig)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={() => setDeleteId(desig.id)}
                              className="text-destructive focus:text-destructive"
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

      <DesignationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        designation={editDesig}
        onSuccess={() => {
          mutate()
          toast.success(editDesig ? "Designation updated" : "Designation created")
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Designation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the designation.
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
    </>
  )
}
