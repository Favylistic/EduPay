"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { EmployeeDialog } from "./employee-dialog"
import type { Employee } from "@/lib/types"

interface EmployeeDetailActionsProps {
  employee: Employee
}

export function EmployeeDetailActions({ employee }: EmployeeDetailActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="shrink-0"
      >
        <Pencil className="mr-2 h-4 w-4" />
        Edit Employee
      </Button>
      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={employee}
        onSuccess={() => {
          setDialogOpen(false)
          router.refresh()
        }}
      />
    </>
  )
}
